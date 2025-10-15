import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuthFromSession } from '@/lib/security';
import { AuditLogger } from '@/lib/audit-logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get privacy impact assessments
    const assessments = await prisma.privacyImpactAssessment.findMany({
      orderBy: { assessmentDate: 'desc' },
      take: limit,
      select: {
        id: true,
        activityId: true,
        purpose: true,
        legalBasis: true,
        dataCategories: true,
        riskLevel: true,
        mitigationMeasures: true,
        assessmentDate: true,
        assessedBy: true,
        approvedBy: true
      }
    });

    return NextResponse.json({ assessments });

  } catch (error: any) {
    console.error('Failed to fetch impact assessments:', error);
    return NextResponse.json({
      error: 'Failed to fetch impact assessments'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) {
      return authResult.error;
    }

    const {
      purpose,
      legalBasis,
      dataCategories,
      dataMinimization,
      purposeLimitation,
      storageLimitation,
      accuracy,
      security,
      transparency
    } = await request.json();

    if (!purpose || !legalBasis || !dataCategories || dataCategories.length === 0) {
      return NextResponse.json({
        error: 'Purpose, legal basis, and data categories are required'
      }, { status: 400 });
    }

    // Assess risk level based on data categories
    const riskLevel = assessRiskLevel(dataCategories);

    // Generate mitigation measures based on risk level
    const mitigationMeasures = generateMitigationMeasures(riskLevel, dataCategories);

    // Create privacy impact assessment
    const assessment = await prisma.privacyImpactAssessment.create({
      data: {
        activityId: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        purpose,
        legalBasis,
        dataCategories,
        riskLevel,
        mitigationMeasures,
        dataMinimization,
        purposeLimitation,
        storageLimitation,
        accuracy,
        security,
        transparency,
        assessedBy: (session.user as any).id
      }
    });

    // Log the assessment creation
    const { ipAddress, userAgent } = AuditLogger.extractRequestInfo(request);
    await AuditLogger.logDataProcessing(
      assessment.activityId,
      'privacy_impact_assessment_created',
      {
        purpose,
        legalBasis,
        dataCategories,
        retentionPeriod: 2555 // 7 years for assessments
      },
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      assessment,
      message: 'Privacy impact assessment created successfully'
    });

  } catch (error: any) {
    console.error('Failed to create impact assessment:', error);
    return NextResponse.json({
      error: 'Failed to create impact assessment'
    }, { status: 500 });
  }
}

/**
 * Assess risk level based on data categories
 */
function assessRiskLevel(dataCategories: string[]): 'low' | 'medium' | 'high' {
  let riskScore = 0;
  
  // High-risk categories
  const highRiskCategories = ['Biometric Data', 'Health Information', 'Financial Data'];
  const hasHighRiskCategory = dataCategories.some(cat => 
    highRiskCategories.includes(cat)
  );
  
  if (hasHighRiskCategory) {
    riskScore += 3;
  }
  
  // Medium-risk categories
  const mediumRiskCategories = ['Location Data', 'Behavioral Data', 'Communication Data'];
  const hasMediumRiskCategory = dataCategories.some(cat => 
    mediumRiskCategories.includes(cat)
  );
  
  if (hasMediumRiskCategory) {
    riskScore += 2;
  }
  
  // Low-risk categories
  const lowRiskCategories = ['Personal Information', 'Contact Details'];
  const hasLowRiskCategory = dataCategories.some(cat => 
    lowRiskCategories.includes(cat)
  );
  
  if (hasLowRiskCategory) {
    riskScore += 1;
  }
  
  // Multiple categories increase risk
  if (dataCategories.length > 3) {
    riskScore += 1;
  }
  
  if (riskScore >= 5) return 'high';
  if (riskScore >= 3) return 'medium';
  return 'low';
}

/**
 * Generate mitigation measures based on risk level and categories
 */
function generateMitigationMeasures(riskLevel: string, dataCategories: string[]): string[] {
  const measures: string[] = [];
  
  // Base security measures
  measures.push('Encryption of data at rest and in transit');
  measures.push('Access controls and authentication');
  measures.push('Regular security assessments');
  measures.push('Staff training on data protection');
  
  // Risk-specific measures
  if (riskLevel === 'high') {
    measures.push('Additional encryption layers');
    measures.push('Enhanced access monitoring');
    measures.push('Regular penetration testing');
    measures.push('Data protection impact assessment review');
  }
  
  if (riskLevel === 'medium') {
    measures.push('Enhanced logging and monitoring');
    measures.push('Regular security updates');
    measures.push('Data minimization reviews');
  }
  
  // Category-specific measures
  if (dataCategories.includes('Biometric Data')) {
    measures.push('Special protection for biometric data');
    measures.push('Explicit consent for biometric processing');
  }
  
  if (dataCategories.includes('Health Information')) {
    measures.push('Enhanced security for health data');
    measures.push('Medical data protection protocols');
  }
  
  if (dataCategories.includes('Financial Data')) {
    measures.push('PCI DSS compliance measures');
    measures.push('Financial data encryption standards');
  }
  
  return measures;
}
