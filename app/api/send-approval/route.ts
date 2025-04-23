// File: /app/api/send-approval/route.ts
import { NextResponse } from 'next/server';
import { sendATMGOApprovalEmail } from '@/lib/atm-go-approval-email';

export async function POST(request: Request) {
  try {
    // Parse the JSON body
    const body = await request.json();
    const { application, adminId } = body;

    // Validate required fields
    if (!application || !application.id || !application.complete_name || !application.business_name || !application.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required application data' 
      }, { status: 400 });
    }

    // Optional: Log the approval action
    console.log(`Application #${application.id} approval email requested by admin #${adminId}`);

    // Send the approval email
    const emailResult = await sendATMGOApprovalEmail(application);

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
    console.error('Error in send-approval-email API route:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
}