// File: /app/api/send-rejection/route.ts
import { NextResponse } from 'next/server';
import { sendATMGORejectionEmail } from '@/lib/atm-go-approval-email';

export async function POST(request: Request) {
  try {
    // Parse the JSON body
    const body = await request.json();
    const { application, rejectionReason, adminId } = body;

    // Validate required fields
    if (!application || !application.id || !application.complete_name || !application.business_name || !application.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required application data' 
      }, { status: 400 });
    }

    // Optional: Log the rejection action with reason
    console.log(`Application #${application.id} rejection email requested by admin #${adminId}${rejectionReason ? ` with reason: "${rejectionReason}"` : ''}`);

    // Send the rejection email with optional reason
    const emailResult = await sendATMGORejectionEmail(application, rejectionReason);

    // Return the result
    if (emailResult.success) {
      return NextResponse.json({ 
        success: true, 
        messageId: emailResult.messageId 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: emailResult.error || 'Failed to send email' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in send-rejection-email API route:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
}