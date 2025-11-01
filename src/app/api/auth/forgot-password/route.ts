import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { sendMail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ 
        message: 'If an account with that email exists, we have sent password reset instructions.' 
      });
    }

    if (!user.isActive) {
      return NextResponse.json({ 
        message: 'If an account with that email exists, we have sent password reset instructions.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetToken,
        resetTokenExpiry: resetTokenExpiry
      }
    });

    // Send password reset email
    const resetLink = `https://nogalssapexcoop.org/auth/reset-password?token=${resetToken}`;
    
    // Create a professional, spam-resistant email
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request - Nogalss Cooperative</title>
        <meta name="description" content="Password reset request for Nogalss National Apex Cooperative Society account">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
        <div style="background-color: #ffffff; margin: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header -->
          <div style="background-color: #16a34a; padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Password Reset Request</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Nogalss National Apex Cooperative Society</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px 20px;">
            <p style="font-size: 16px; margin: 0 0 20px 0;">Dear ${user.firstName} ${user.lastName},</p>
            
            <p style="font-size: 16px; margin: 0 0 20px 0; color: #555555;">
              We received a request to reset the password for your Nogalss National Apex Cooperative Society account. 
              If you made this request, please click the button below to reset your password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; padding: 15px 30px; background-color: #16a34a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(22, 163, 74, 0.3);">
                Reset My Password
              </a>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="font-size: 14px; margin: 0 0 10px 0; color: #666666; font-weight: 600;">Alternative Method:</p>
              <p style="font-size: 14px; margin: 0 0 10px 0; color: #666666;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="font-size: 14px; margin: 0; color: #16a34a; word-break: break-all; background-color: #ffffff; padding: 10px; border-radius: 4px; border: 1px solid #e5e7eb;">
                ${resetLink}
              </p>
            </div>
            
            <div style="background-color: #fef3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="font-size: 14px; margin: 0; color: #92400e;">
                <strong>Security Notice:</strong> This password reset link will expire in 1 hour for your security. 
                If you didn't request this password reset, please ignore this email and your password will remain unchanged.
              </p>
            </div>
            
            <p style="font-size: 16px; margin: 20px 0 0 0; color: #555555;">
              If you have any questions or need assistance, please contact our support team.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; margin: 0 0 10px 0; color: #6b7280; font-weight: 600;">Nogalss National Apex Cooperative Society Ltd</p>
            <p style="font-size: 12px; margin: 0; color: #9ca3af;">
              This is an automated message. Please do not reply to this email.<br>
              For support, contact us at support@nogalss.org
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Also create a plain text version
    const emailText = `
PASSWORD RESET REQUEST - NOGALSS NATIONAL APEX COOPERATIVE SOCIETY

Dear ${user.firstName} ${user.lastName},

We received a request to reset the password for your Nogalss National Apex Cooperative Society account.

To reset your password, please visit the following link:
${resetLink}

IMPORTANT SECURITY INFORMATION:
- This password reset link will expire in 1 hour
- If you didn't request this password reset, please ignore this email
- Your password will remain unchanged if you don't use this link

If you have any questions or need assistance, please contact our support team.

Best regards,
Nogalss National Apex Cooperative Society Ltd

---
This is an automated message. Please do not reply to this email.
For support, contact us at support@nogalss.org
    `;

    try {
      // Log the password reset request for debugging
      console.log(`📧 Sending password reset email to: ${user.email}`);

      await sendMail({
        to: user.email,
        subject: 'Password Reset Request - Nogalss National Apex Cooperative Society',
        html: emailHtml,
        text: emailText
      });

      // Log the password reset request
      await prisma.log.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          action: `Password reset requested for user ${user.email}`
        }
      });

      console.log(`✅ Password reset email sent successfully to ${user.email}`);
      
      return NextResponse.json({ 
        message: 'If an account with that email exists, we have sent password reset instructions.' 
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Log the reset link for manual use when email fails
      console.log('🔗 PASSWORD RESET LINK (Email failed - use this link manually):');
      console.log(`   Email: ${user.email}`);
      console.log(`   Reset Link: ${resetLink}`);
      console.log(`   Token: ${resetToken}`);
      console.log('   Note: Email delivery failed, but you can use the link above to reset the password.');
      
      // Log the email failure
      await prisma.log.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          action: `Password reset email failed for user ${user.email}: ${emailError.message}. Reset link: ${resetLink}`
        }
      });
      
      // Still return success to user for security (don't reveal email issues)
      return NextResponse.json({ 
        message: 'If an account with that email exists, we have sent password reset instructions.' 
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ 
      message: 'An error occurred. Please try again later.' 
    }, { status: 500 });
  }
}
