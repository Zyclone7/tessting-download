"use server"

import { NextResponse } from 'next/server';
import { dispenseProduct, DispenseRequest, generateRequestId } from '@/lib/recharge360';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create an extended interface to include additional fields
interface ExtendedDispenseRequest extends DispenseRequest {
  amount?: string | number;
  provider_name?: string;
  promo_name?: string;
  promo_description?: string;
  validity?: string;
  paymentMethod?: string;
  service_fee?: string | number;
  provider_discount?: string | number;
  subtotal?: string | number;
  total?: string | number;
  user_id?: string | number;
}

export async function POST(request: Request) {
  try {
    const data: ExtendedDispenseRequest = await request.json();
    
    // Add some logging to help with debugging
    console.log('Received dispense request:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.requestId || !data.productCode || !data.recipient) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate mobile number format (must be 11 digits starting with 09)
    if (!/^09\d{9}$/.test(data.recipient)) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Invalid recipient format. Must be 11 digits starting with 09' },
        { status: 400 }
      );
    }
    
    // Call the Recharge360 API with the properly typed request data
    const result = await dispenseProduct({
      requestId: data.requestId,
      productCode: data.productCode,
      recipient: data.recipient,
    });
    
    console.log('API response:', JSON.stringify(result, null, 2));
    
    // ONLY store transaction data in database if successful
    if (!('code' in result)) {
      // Transaction was successful
      try {
        await prisma.pt_telco_transaction.create({
          data: {
            request_id: data.requestId,
            product_code: data.productCode,
            recipient: data.recipient,
            amount: typeof data.amount === 'string' ? parseFloat(data.amount) : (data.amount || 0),
            provider_name: data.provider_name || 'Unknown',
            promo_name: data.promo_name || null,
            promo_description: data.promo_description || null,
            validity: data.validity || null,
            payment_method: data.paymentMethod || 'credits',
            service_fee: typeof data.service_fee === 'string' ? parseFloat(data.service_fee) : (data.service_fee || 5),
            provider_discount: typeof data.provider_discount === 'string' ? parseFloat(data.provider_discount) : (data.provider_discount || 0),
            subtotal: typeof data.subtotal === 'string' ? parseFloat(data.subtotal) : (data.subtotal || 0),
            total: typeof data.total === 'string' ? parseFloat(data.total) : (data.total || 0),
            status: 'COMPLETED',
            response_rrn: result.rrn,
            response_token: result.token || null,
            response_balance: result.balance || null,
            user_id: typeof data.user_id === 'string' ? parseInt(data.user_id) : (data.user_id || 0),
          },
        });
        
        console.log('Successfully stored transaction in database');
        
        // If payment was with credits, update user's credit balance
        if (data.paymentMethod === 'credits' && data.user_id && data.total) {
          const totalAmount = typeof data.total === 'string' ? parseFloat(data.total) : data.total;
          const userId = typeof data.user_id === 'string' ? parseInt(data.user_id) : data.user_id;
          
          await prisma.pt_users.update({
            where: { ID: userId },
            data: {
              user_credits: {
                decrement: totalAmount,
              },
            },
          });
          
          console.log(`Updated user ${userId} credits, deducted ${totalAmount}`);
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        // Continue processing even if database operations fail
        // The API call was successful, so we still want to return success to the client
      }
    } else {
      console.log('Transaction failed, not storing in database');
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API route error:', error);
    
    // Check if it's a Prisma error
    const errorMessage = error instanceof Error ? error.message : 'Server error processing request';
    
    return NextResponse.json(
      { code: 'SERVER_ERROR', message: errorMessage },
      { status: 500 }
    );
  }
}

