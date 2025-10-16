import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    // In a real implementation, you would generate a PDF report
    // For now, we'll return a mock PDF content
    const mockPdfContent = `
      Compliance Report
      Report ID: ${id}
      Generated: ${new Date().toISOString()}
      
      This is a mock compliance report.
      In a real implementation, this would be a properly formatted PDF
      containing detailed compliance analysis, findings, and recommendations.
      
      Report Contents:
      - Executive Summary
      - Compliance Assessment
      - Findings and Recommendations
      - Risk Analysis
      - Action Items
    `;

    // Convert to buffer for PDF download
    const buffer = Buffer.from(mockPdfContent, 'utf-8');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compliance-report-${id}.pdf"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Compliance report download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
