"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma-singleton";

// update product by id with data provided in the request
export async function updateProduct(
  id: number,
  data: {
    name?: string;
    category?: string;
    price?: number;
    status?: number;
    label?: string;
    short_description?: string;
    payment_type?: string;
    package_type?: string;
    retailer_count: number;
    free_credits: number;
    pt_package_features?: { id?: number; feature: string }[];
  }
) {
  try {
    const { pt_package_features, ...productData } = data;

    const updatedProduct = await prisma.pt_package_products.update({
      where: { id: BigInt(id) },
      data: {
        ...productData,
        price: data.price !== undefined ? new Prisma.Decimal(data.price) : undefined,
        pt_package_features: {
          deleteMany: {},
          create: pt_package_features?.map(feature => ({
            feature: feature.feature,
          })) || [],
        },
      },
      include: {
        pt_package_features: true,
      },
    });

    return {
      ...updatedProduct,
      id: Number(updatedProduct.id),
      price: Number(updatedProduct.price), // Convert Decimal to Number
      pt_package_features: updatedProduct.pt_package_features.map(feature => ({
        ...feature,
        id: Number(feature.id),
        product_id: Number(feature.product_id),
      })),
    };
  } catch (error) {
    console.error("Error updating product:", error);
    throw new Error("Failed to update product");
  }
}

// create a new product with data provided in the request
export async function createProduct(data: {
  name: string;
  category: string;
  price: number;
  status: number;
  label?: string;
  short_description?: string;
  payment_type?: string;
  package_type?: string;
  pt_package_features?: { feature: string }[];
}) {
  try {
    const { pt_package_features, ...productData } = data;

    const product = await prisma.pt_package_products.create({
      data: {
        ...productData,
        price: new Prisma.Decimal(data.price), // Convert number to Decimal for Prisma
        pt_package_features: {
          create: pt_package_features,
        },
      },
      include: {
        pt_package_features: true,
      },
    });

    return {
      ...product,
      id: Number(product.id),
      price: Number(product.price), // Convert Decimal to Number
      pt_package_features: product.pt_package_features.map(feature => ({
        ...feature,
        id: Number(feature.id),
        product_id: Number(feature.product_id),
      })),
    };
  } catch (error) {
    console.error("Error creating product:", error);
    throw new Error("Failed to create product");
  }
}

// delete product by id provided in the request
export async function deleteProduct(id: number) {
  try {
    await prisma.pt_package_products.delete({
      where: { id: BigInt(id) },
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error("Failed to delete product");
  }
}

// fetch all products from the database
export async function fetchProducts() {
  try {
    const products = await prisma.pt_package_products.findMany({
      include: {
        pt_package_features: true,
      },
    });

    return products.map(product => ({
      ...product,
      id: Number(product.id),
      price: Number(product.price), // Convert Decimal to Number
      pt_package_features: product.pt_package_features.map(feature => ({
        ...feature,
        id: Number(feature.id),
        product_id: Number(feature.product_id),
      })),
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
}


export async function getPackageInfoQuery(referralCode: string) {
  try {
    // Step 1: Get the invitation code
    const invitationCode = await prisma.pt_invitation_codes.findFirst({
      where: { code: referralCode },
    });

    if (!invitationCode) {
      return { success: false, error: "Invalid activation code" };
    }

    // Step 2: Get the associated package information using `package` from invitation code
    const packageInfo = await prisma.pt_package_products.findUnique({
      where: { id: invitationCode.package ? Number(invitationCode.package) : 0 },
    });

    if (!packageInfo) {
      return { success: false, error: "Package information not found" };
    }

    // Step 3: Get the related incentive programs using `product_id` as the foreign key
    const incentivePrograms = await prisma.pt_incentive_programs.findMany({
      where: { product_id: packageInfo.id },
    });

    // Step 4: Get the related package features using `product_id` as the foreign key
    const packageFeatures = await prisma.pt_package_features.findMany({
      where: { product_id: packageInfo.id },
    });

    return {
      success: true,
      data: {
        user_role: packageInfo.name,
        package_info: {
          id: packageInfo.id,
          name: packageInfo.name,
          label: packageInfo.label,
          short_description: packageInfo.short_description,
          payment_type: packageInfo.payment_type,
          price: packageInfo.price,
          status: packageInfo.status,
          the_order: packageInfo.the_order,
          created_at: packageInfo.created_at,
          category: packageInfo.category,
          image: packageInfo.image,
          package_type: packageInfo.package_type,
          features: packageFeatures.map((feature) => feature.feature),
          earn_description: packageInfo.earn_description,
          refer_earn: packageInfo.refer_earn,
          incentive_programs: incentivePrograms,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching package info:", error);
    return { success: false, error: "An error occurred while fetching package information" };
  }
}

// fetch all products from the database for register
export async function fetchPackageProductsForRegister() {
  try {
    const products = await prisma.pt_package_products.findMany({
      include: {
        pt_package_features: true,
      },
    })

    const formattedProducts = products.map((product) => ({
      ...product,
      id: Number(product.id),
      price: Number(product.price),
      pt_package_features: product.pt_package_features.map((feature) => ({
        ...feature,
        id: Number(feature.id),
        product_id: Number(feature.product_id),
      })),
    }))

    return formattedProducts
  } catch (error) {
    console.error("Error fetching products:", error)
    throw new Error("Failed to fetch products")
  }
}