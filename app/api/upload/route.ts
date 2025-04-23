import { type NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import sharp from "sharp";
import { getUserInfo } from "@/actions/user";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = (formData.get("type") as string) || "profile"; // Default to profile if not specified
  const productId = formData.get("productId") as string;
  const userId = formData.get("userId") as string; // Keep for backward compatibility
  const deleteOnly = formData.get("deleteOnly") as string;
  const currentImageUrl = formData.get("currentImageUrl") as string;
  const hasNoImage = formData.get("hasNoImage") as string;
  const quality = Number.parseInt(
    (formData.get("quality") as string) || "85",
    10
  );
  const maxSize = Number.parseInt(
    (formData.get("maxSize") as string) || "1600",
    10
  );

  // Handle delete-only requests (when removing an image without uploading a new one)
  if (deleteOnly === "true" && currentImageUrl) {
    try {
      await deleteOldImage(currentImageUrl);

      return NextResponse.json({
        success: true,
        message: "Image deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting image:", error);
      return NextResponse.json(
        {
          error: `Delete failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
        { status: 500 }
      );
    }
  }

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  try {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image." },
        { status: 400 }
      );
    }

    // Delete old image if it exists
    if (currentImageUrl) {
      try {
        await deleteOldImage(currentImageUrl);
      } catch (deleteError) {
        console.error(`Error deleting old ${type} image:`, deleteError);
        // Continue with upload even if delete fails
      }
    }
    // Skip trying to delete old images if explicitly told there's no previous image
    else if (hasNoImage !== "true" && (productId || userId)) {
      try {
        // If we have a productId, we're dealing with a product image
        if (productId) {
          // Here you would look up the product by ID and get its image URL
          // For now, we'll skip this since we don't have the product lookup function
          console.log(
            `No current image URL provided for product ${productId}, skipping deletion`
          );
        }
        // Backward compatibility for user images
        else if (userId) {
          try {
            const userData: any = await getUserInfo(Number.parseInt(userId));
            if (!userData) {
              console.log(
                `User not found with ID ${userId}, skipping image deletion`
              );
            } else {
              const oldImageUrl =
                type === "product"
                  ? userData?.image
                  : type === "logo"
                  ? userData?.travel_logo_url
                  : userData?.profile_pic_url;

              if (oldImageUrl) {
                await deleteOldImage(oldImageUrl);
              }
            }
          } catch (userError) {
            console.error(
              `Error fetching user data: ${
                userError instanceof Error ? userError.message : "Unknown error"
              }`
            );
            // Continue with upload even if user lookup fails
          }
        }
      } catch (deleteError) {
        console.error(`Error handling old ${type} image:`, deleteError);
        // Continue with upload even if delete fails
      }
    }

    // Convert file to buffer for processing
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process image with sharp for optimization
    const sharpInstance = sharp(buffer);
    const metadata = await sharpInstance.metadata();

    // Determine appropriate dimensions while maintaining aspect ratio
    let width = maxSize;
    let height = maxSize;

    if (metadata.width && metadata.height) {
      if (metadata.width > metadata.height) {
        height = Math.round((metadata.height / metadata.width) * maxSize);
      } else {
        width = Math.round((metadata.width / metadata.height) * maxSize);
      }
    }

    const optimizedBuffer = await sharpInstance
      .resize({
        width,
        height,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality }) // Use the provided quality setting
      .toBuffer()
      .catch((err) => {
        throw new Error(`Image processing failed: ${err.message}`);
      });

    // Log final dimensions for debugging
    const optimizedMetadata = await sharp(optimizedBuffer).metadata();
    console.log(
      `Processed ${type} image: ${optimizedMetadata.width}x${optimizedMetadata.height}, quality: ${quality}%`
    );

    // Create a unique, sanitized filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace special characters
      .replace(/\.[^/.]+$/, ".webp"); // Ensure .webp extension
    const uniqueFilename = `${type}_${timestamp}_${sanitizedFileName}`;

    // Create a new file with the optimized buffer
    const optimizedFile = new File([optimizedBuffer], uniqueFilename, {
      type: "image/webp",
    });

    // Upload to Vercel Blob
    const blob = await put(optimizedFile.name, optimizedFile, {
      access: "public",
    });

    return NextResponse.json({
      url: blob.url,
      size: {
        original: file.size,
        optimized: optimizedBuffer.length,
      },
      dimensions: {
        original: { width: metadata.width, height: metadata.height },
        optimized: {
          width: optimizedMetadata.width,
          height: optimizedMetadata.height,
        },
      },
    });
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error);
    return NextResponse.json(
      {
        error: `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}

// Helper function to delete an image from Vercel Blob
async function deleteOldImage(imageUrl: string) {
  try {
    const urlParts = new URL(imageUrl);
    const pathname = urlParts.pathname;
    const filename = pathname.split("/").pop();

    if (filename) {
      await del(filename);
      console.log(`Successfully deleted old image: ${filename}`);
    }
  } catch (error) {
    console.error("Error deleting old image:", error);
    throw error;
  }
}
