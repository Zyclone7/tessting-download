"use server"

import { NextResponse } from 'next/server';
import { dispenseProduct, DispenseRequest } from '@/lib/recharge360';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create an extended interface to include additional fields
interface ExtendedDispenseRequest extends DispenseRequest {
  amount?: string | number;
  provider_name?: string; // Changed from providerName to match frontend
  promo_name?: string; // Changed from promoName to match frontend
  promo_description?: string; // Changed from promoDescription to match frontend
  validity?: string;
  paymentMethod?: string;
  service_fee?: string | number; // Changed from serviceFee to match frontend
  provider_discount?: string | number; // Changed from providerDiscount to match frontend
  subtotal?: string | number;
  total?: string | number;
  user_id?: string | number; // Changed from userId to match frontend
}

export async function POST(request: Request) {
  try {
    const data: ExtendedDispenseRequest = await request.json();
    
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
    
    // ONLY store transaction data in database if successful
    if (!('code' in result)) {
      // Transaction was successful
      await prisma.pt_telco_transaction.create({
        data: {
          request_id: data.requestId,
          product_code: data.productCode,
          recipient: data.recipient,
          amount: typeof data.amount === 'string' ? parseFloat(data.amount) : (data.amount || 0),
          provider_name: data.provider_name || 'Unknown', // Changed field name
          promo_name: data.promo_name || null, // Changed field name
          promo_description: data.promo_description || null, // Changed field name
          validity: data.validity || null,
          payment_method: data.paymentMethod || 'credits',
          service_fee: typeof data.service_fee === 'string' ? parseFloat(data.service_fee) : (data.service_fee || 5), // Changed field name
          provider_discount: typeof data.provider_discount === 'string' ? parseFloat(data.provider_discount) : (data.provider_discount || 0), // Changed field name
          subtotal: typeof data.subtotal === 'string' ? parseFloat(data.subtotal) : (data.subtotal || 0),
          total: typeof data.total === 'string' ? parseFloat(data.total) : (data.total || 0),
          status: 'COMPLETED',
          response_rrn: result.rrn,
          response_token: result.token || null,
          response_balance: result.balance || null,
          user_id: typeof data.user_id === 'string' ? parseInt(data.user_id) : (data.user_id || 0), // Changed field name
        },
      });
      
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
      }
    }
    // We do NOT store failed transactions as requested
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { code: 'SERVER_ERROR', message: 'Server error processing request' },
      { status: 500 }
    );
  }
}