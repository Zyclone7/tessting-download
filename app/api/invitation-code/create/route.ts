import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const generateInvitationCode = async () => {
  const prefix = "PACK";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  let isUnique = false;
  
  // Keep trying until we get a unique code
  while (!isUnique) {
    let generatedPart = "";
    for (let i = 0; i < 6; i++) {
      generatedPart += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    code = `${prefix}${generatedPart}`;
    
    // Check if this code already exists - using findFirst instead of findUnique
    const existingCode = await prisma.pt_invitation_codes.findFirst({
      where: { code }
    });
    
    isUnique = !existingCode;
  }
  
  return code;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packages, user_id, paymentMethod, idempotencyKey } = body;

    // Validate idempotency key
    if (!idempotencyKey) {
      return NextResponse.json(
        { success: false, message: "Idempotency key is required." },
        { status: 400 }
      );
    }

    // Check for existing request with this idempotency key
    const existingRequest = await prisma.pt_idempotency_keys.findUnique({
      where: { key: idempotencyKey }
    });

    // If we have a completed request with this key, return the stored response
    if (existingRequest?.status === 'completed' && existingRequest.response_data) {
      return NextResponse.json(JSON.parse(existingRequest.response_data), 
        { status: existingRequest.response_code ?? 200 });
    }

    // If we have an in-progress request with this key, return a conflict status
    if (existingRequest?.status === 'in_progress') {
      return NextResponse.json(
        { success: false, message: "A request with this idempotency key is already being processed." },
        { status: 409 }
      );
    }

    // Create or update the idempotency record to mark it as in progress
    await prisma.pt_idempotency_keys.upsert({
      where: { key: idempotencyKey },
      update: { 
        status: 'in_progress',
        created_at: new Date(),
        request_data: JSON.stringify(body)
      },
      create: {
        key: idempotencyKey,
        status: 'in_progress',
        created_at: new Date(),
        request_data: JSON.stringify(body)
      }
    });

    // Validate the request body
    if (!Array.isArray(packages) || packages.length === 0) {
      const errorResponse = { 
        success: false, 
        message: "Packages must be a non-empty array." 
      };
      
      // Store the error response with the idempotency key
      await prisma.pt_idempotency_keys.update({
        where: { key: idempotencyKey },
        data: { 
          status: 'completed',
          response_data: JSON.stringify(errorResponse),
          response_code: 400
        }
      });
      
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Fetch user's current credit
    const user = await prisma.pt_users.findUnique({
      where: { ID: parseInt(user_id.toString(), 10) },
      select: { user_credits: true }
    });

    if (!user) {
      const errorResponse = { 
        success: false, 
        message: "User not found." 
      };
      
      // Store the error response with the idempotency key
      await prisma.pt_idempotency_keys.update({
        where: { key: idempotencyKey },
        data: { 
          status: 'completed',
          response_data: JSON.stringify(errorResponse),
          response_code: 404
        }
      });
      
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const totalAmount = packages.reduce((total, pkg) => total + (pkg.amount * pkg.quantity), 0);

    // Check if user has enough credit when paying with credits
    if (paymentMethod === 'credits' && user.user_credits && user.user_credits < totalAmount) {
      const errorResponse = { 
        success: false, 
        message: "Insufficient credit." 
      };
      
      // Store the error response with the idempotency key
      await prisma.pt_idempotency_keys.update({
        where: { key: idempotencyKey },
        data: { 
          status: 'completed',
          response_data: JSON.stringify(errorResponse),
          response_code: 400
        }
      });
      
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const datePurchased = new Date().toISOString();
    const newCodes: any = [];

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (prisma) => {
      for (const pkg of packages) {
        const { packageName, amount, quantity } = pkg;
        
        for (let i = 0; i < quantity; i++) {
          // Generate a unique code
          const code = await generateInvitationCode();
          
          // Create the invitation code record
          try {
            // Fixed: Create proper data object based on what's available
            const createData: any = {
              code,
              date_purchased: datePurchased,
            };
            
            // Only add non-null values
            if (packageName) createData.package = packageName;
            if (amount) createData.amount = parseFloat(amount.toString());
            if (user_id) createData.user_id = parseInt(user_id.toString(), 10);

            const newCode = await prisma.pt_invitation_codes.create({
              data: createData,
            });
            
            newCodes.push(newCode);
          } catch (error) {
            // Properly type the error for Prisma
            const e = error as Error;
            
            // Check if it's a Prisma error with a code property
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
              i--; // Decrement to retry this iteration
              continue;
            }
            throw e; // Rethrow if it's not a unique constraint error
          }
        }
      }

      // Update user's credit if payment method is 'credits'
      if (paymentMethod === 'credits') {
        await prisma.pt_users.update({
          where: { ID: parseInt(user_id.toString(), 10) },
          data: { user_credits: { decrement: totalAmount } },
        });
      }
    });

    // Fetch updated user credit
    const updatedUser = await prisma.pt_users.findUnique({
      where: { ID: parseInt(user_id.toString(), 10) },
      select: { user_credits: true }
    });

    const successResponse = {
      success: true,
      message: "Invitation codes created successfully.",
      data: newCodes,
      updatedCredit: updatedUser?.user_credits,
    };

    // Store the success response with the idempotency key
    await prisma.pt_idempotency_keys.update({
      where: { key: idempotencyKey },
      data: { 
        status: 'completed',
        response_data: JSON.stringify(successResponse),
        response_code: 201
      }
    });

    return NextResponse.json(successResponse, { status: 201 });
  } catch (error: any) {
    console.error("Error creating invitation codes:", error);
    
    const errorResponse = { 
      success: false, 
      message: "Failed to create invitation codes.", 
      error: error.message 
    };
    
    // If we have an idempotency key in the request, update its status
    try {
      const body = await req.json();
      if (body.idempotencyKey) {
        await prisma.pt_idempotency_keys.update({
          where: { key: body.idempotencyKey },
          data: { 
            status: 'failed',
            response_data: JSON.stringify(errorResponse),
            response_code: 500
          }
        });
      }
    } catch (parseError) {
      console.error("Error parsing request during error handling:", parseError);
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}