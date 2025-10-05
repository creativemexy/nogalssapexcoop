import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logContactMessage } from '@/lib/contact-logger';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the input
    const validatedData = contactSchema.parse(body);
    
    try {
      // Save the contact message to the database
      const contactMessage = await prisma.contactMessage.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone || null,
          subject: validatedData.subject,
          message: validatedData.message,
          status: 'UNREAD',
          isActive: true,
        },
      });

      return NextResponse.json(
        { 
          success: true, 
          message: 'Contact message submitted successfully',
          id: contactMessage.id 
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // If database is unavailable, log to file as backup
      const contactMessage = {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        subject: validatedData.subject,
        message: validatedData.message,
        timestamp: new Date().toISOString()
      };
      
      // Log to file as backup
      logContactMessage(contactMessage);

      return NextResponse.json(
        { 
          success: true, 
          message: 'Contact message received. We will get back to you soon.',
          note: 'Message logged due to database maintenance'
        },
        { status: 201 }
      );
    }

  } catch (error) {
    console.error('Contact form submission error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation error',
          errors: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
