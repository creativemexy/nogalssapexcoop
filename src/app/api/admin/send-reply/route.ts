import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin or apex
    if ((session.user as any).role !== 'SUPER_ADMIN' && (session.user as any).role !== 'APEX') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, id, reply } = body;

    if (!type || !id || !reply) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let email = '';
    let name = '';
    let subject = '';

    if (type === 'message') {
      // Handle contact message reply
      const message = await prisma.contactMessage.findUnique({
        where: { id },
      });

      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      email = message.email;
      name = message.name;
      subject = `Re: ${message.subject}`;

      // Update message status to REPLIED
      await prisma.contactMessage.update({
        where: { id },
        data: { status: 'REPLIED' },
      });

    } else if (type === 'ticket') {
      // Handle support ticket reply
      const ticket = await prisma.supportTicket.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });

      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      email = ticket.user.email;
      name = `${ticket.user.firstName} ${ticket.user.lastName}`;
      subject = `Re: ${ticket.subject}`;

      // Update ticket status to IN_PROGRESS if it's OPEN
      if (ticket.status === 'OPEN') {
        await prisma.supportTicket.update({
          where: { id },
          data: { status: 'IN_PROGRESS' },
        });
      }
    }

    // Send email reply
    try {
      await NotificationService.sendEmail({
        to: email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0D5E42;">Reply from Nogalss Support</h2>
            <p>Dear ${name},</p>
            <p>Thank you for contacting us. Here is our response to your inquiry:</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              ${reply.replace(/\n/g, '<br>')}
            </div>
            <p>If you have any further questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>Nogalss Support Team</p>
          </div>
        `,
      });

      return NextResponse.json({
        success: true,
        message: 'Reply sent successfully',
      });

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return NextResponse.json({ 
        error: 'Failed to send email reply',
        details: emailError instanceof Error ? emailError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Send reply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
