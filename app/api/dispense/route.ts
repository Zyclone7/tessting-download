import { NextResponse } from 'next/server';
import { dispenseProduct, DispenseRequest } from '@/lib/recharge360';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create an extended interface to include additional fields
interface ExtendedDispenseRequest extends DispenseRequest {
  amount?: string | number;
  providerName?: string;
  promoName?: string;
  promoDescription?: string;
  validity?: string;
  paymentMethod?: string;
  serviceFee?: string | number;
  providerDiscount?: string | number;
  subtotal?: string | number;
  total?: string | number;
  userId?: string | number;
}

export async function POST(request: Request) {
  try {
    const data: ExtendedDispenseRequest = await request.json();
    
    // Validate required fields
    if (!data.requestId || !data.productCode || !data.recipient) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate mobile number format (must be 11 digits starting with 09)
    if (!/^09\d{9}$/.test(data.recipient)) {
      return NextResponse.json(
        { error: 'Invalid recipient format. Must be 11 digits starting with 09' },
        { status: 400 }
      );
    }
    
    // Call the Recharge360 API with the properly typed request data
    const result = await dispenseProduct({
      requestId: data.requestId,
      productCode: data.productCode,
      recipient: data.recipient,
    });
    
    // Store transaction data in database
    if (!('code' in result)) {
      // Transaction was successful
      await prisma.pt_telco_transaction.create({
        data: {
          request_id: data.requestId,
          product_code: data.productCode,
          recipient: data.recipient,
          amount: typeof data.amount === 'string' ? parseFloat(data.amount) : (data.amount || 0),
          provider_name: data.providerName || 'Unknown',
          promo_name: data.promoName || null,
          promo_description: data.promoDescription || null,
          validity: data.validity || null,
          payment_method: data.paymentMethod || 'credits',
          service_fee: typeof data.serviceFee === 'string' ? parseFloat(data.serviceFee) : (data.serviceFee || 5),
          provider_discount: typeof data.providerDiscount === 'string' ? parseFloat(data.providerDiscount) : (data.providerDiscount || 0),
          subtotal: typeof data.subtotal === 'string' ? parseFloat(data.subtotal) : (data.subtotal || 0),
          total: typeof data.total === 'string' ? parseFloat(data.total) : (data.total || 0),
          status: 'COMPLETED',
          response_rrn: result.rrn,
          response_token: result.token || null,
          response_balance: result.balance || null,
          user_id: typeof data.userId === 'string' ? parseInt(data.userId) : (data.userId || 0),
        },
      });
      
      // If payment was with credits, update user's credit balance
      if (data.paymentMethod === 'credits' && data.userId && data.total) {
        const totalAmount = typeof data.total === 'string' ? parseFloat(data.total) : data.total;
        const userId = typeof data.userId === 'string' ? parseInt(data.userId) : data.userId;
        
        await prisma.pt_users.update({
          where: { ID: userId },
          data: {
            user_credits: {
              decrement: totalAmount,
            },
          },
        });
      }
    } else {
      // Transaction failed - optionally store failed transaction
      await prisma.pt_telco_transaction.create({
        data: {
          request_id: data.requestId,
          product_code: data.productCode,
          recipient: data.recipient,
          amount: typeof data.amount === 'string' ? parseFloat(data.amount) : (data.amount || 0),
          provider_name: data.providerName || 'Unknown',
          payment_method: data.paymentMethod || 'credits',
          service_fee: typeof data.serviceFee === 'string' ? parseFloat(data.serviceFee) : (data.serviceFee || 5),
          subtotal: typeof data.subtotal === 'string' ? parseFloat(data.subtotal) : (data.subtotal || 0),
          total: typeof data.total === 'string' ? parseFloat(data.total) : (data.total || 0),
          status: 'FAILED',
          error_code: result.code,
          error_message: result.message,
          user_id: typeof data.userId === 'string' ? parseInt(data.userId) : (data.userId || 0),
        },
      });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}