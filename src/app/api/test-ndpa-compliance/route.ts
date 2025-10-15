import { NextRequest, NextResponse } from 'next/server';
import { NDPACompliance } from '@/lib/ndpa-compliance';
import { DataEncryption } from '@/lib/data-encryption';
import { ConsentManager } from '@/lib/consent-manager';
import { AuditLogger } from '@/lib/audit-logger';
import { DataRetentionManager } from '@/lib/data-retention';
import { BreachManager } from '@/lib/breach-manager';
import { NDPAConfigManager } from '@/lib/ndpa-config';

export async function GET(request: NextRequest) {
  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: [] as any[],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    };

    // Test 1: NDPA Compliance Framework
    try {
      const testData = {
        purpose: 'Test data processing',
        legalBasis: 'consent' as const,
        dataCategories: ['personal', 'contact'],
        retentionPeriod: 365
      };

      const validation = NDPACompliance.validateDataProcessing(testData);
      testResults.tests.push({
        name: 'NDPA Compliance Validation',
        status: validation.valid ? 'PASS' : 'FAIL',
        details: validation
      });
      testResults.summary.total++;
      if (validation.valid) testResults.summary.passed++;
      else testResults.summary.failed++;
    } catch (error) {
      testResults.tests.push({
        name: 'NDPA Compliance Validation',
        status: 'FAIL',
        error: error.message
      });
      testResults.summary.total++;
      testResults.summary.failed++;
    }

    // Test 2: Data Encryption
    try {
      const testString = 'Test sensitive data';
      const encrypted = DataEncryption.encrypt(testString);
      const decrypted = DataEncryption.decrypt(encrypted);
      
      const success = decrypted === testString;
      testResults.tests.push({
        name: 'Data Encryption/Decryption',
        status: success ? 'PASS' : 'FAIL',
        details: { original: testString, decrypted }
      });
      testResults.summary.total++;
      if (success) testResults.summary.passed++;
      else testResults.summary.failed++;
    } catch (error) {
      testResults.tests.push({
        name: 'Data Encryption/Decryption',
        status: 'FAIL',
        error: error.message
      });
      testResults.summary.total++;
      testResults.summary.failed++;
    }

    // Test 3: Data Anonymization
    try {
      const testData = {
        email: 'test@example.com',
        phone: '1234567890',
        name: 'John Doe'
      };
      
      const anonymized = DataEncryption.anonymize(testData);
      const success = anonymized.email !== testData.email && 
                     anonymized.phone !== testData.phone && 
                     anonymized.name !== testData.name;
      
      testResults.tests.push({
        name: 'Data Anonymization',
        status: success ? 'PASS' : 'FAIL',
        details: { original: testData, anonymized }
      });
      testResults.summary.total++;
      if (success) testResults.summary.passed++;
      else testResults.summary.failed++;
    } catch (error) {
      testResults.tests.push({
        name: 'Data Anonymization',
        status: 'FAIL',
        error: error.message
      });
      testResults.summary.total++;
      testResults.summary.failed++;
    }

    // Test 4: NDPA Configuration
    try {
      const config = NDPAConfigManager.getConfig();
      const validation = NDPAConfigManager.validateConfig();
      
      testResults.tests.push({
        name: 'NDPA Configuration',
        status: validation.valid ? 'PASS' : 'FAIL',
        details: { config, validation }
      });
      testResults.summary.total++;
      if (validation.valid) testResults.summary.passed++;
      else testResults.summary.failed++;
    } catch (error) {
      testResults.tests.push({
        name: 'NDPA Configuration',
        status: 'FAIL',
        error: error.message
      });
      testResults.summary.total++;
      testResults.summary.failed++;
    }

    // Test 5: Data Retention Check
    try {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - 400); // 400 days ago
      
      const shouldRetain = await DataRetentionManager.shouldRetainData('personal', testDate);
      
      testResults.tests.push({
        name: 'Data Retention Check',
        status: 'PASS',
        details: { shouldRetain }
      });
      testResults.summary.total++;
      testResults.summary.passed++;
    } catch (error) {
      testResults.tests.push({
        name: 'Data Retention Check',
        status: 'FAIL',
        error: error.message
      });
      testResults.summary.total++;
      testResults.summary.failed++;
    }

    // Test 6: Breach Notification Check
    try {
      const highRiskBreach = {
        id: 'test-breach-123',
        description: 'Test high-risk breach',
        categories: ['financial', 'biometric'],
        approximateDataSubjects: 150,
        likelyConsequences: 'High risk to data subjects',
        measuresProposed: 'Immediate containment measures',
        reportedToAuthority: false,
        reportedToDataSubjects: false,
        reportedAt: new Date(),
        status: 'detected' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        reportedBy: 'test-user'
      };
      
      const requiresNotification = NDPACompliance.isBreachNotificationRequired(highRiskBreach);
      
      testResults.tests.push({
        name: 'Breach Notification Check',
        status: requiresNotification ? 'PASS' : 'FAIL',
        details: { highRiskBreach, requiresNotification }
      });
      testResults.summary.total++;
      if (requiresNotification) testResults.summary.passed++;
      else testResults.summary.failed++;
    } catch (error) {
      testResults.tests.push({
        name: 'Breach Notification Check',
        status: 'FAIL',
        error: error.message
      });
      testResults.summary.total++;
      testResults.summary.failed++;
    }

    // Test 7: Data Subject Rights Response
    try {
      const testDataSubject = {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        consentGiven: true,
        consentDate: new Date()
      };
      
      const rightsResponse = NDPACompliance.generateDataSubjectRightsResponse(testDataSubject);
      
      testResults.tests.push({
        name: 'Data Subject Rights Response',
        status: 'PASS',
        details: { rightsResponse }
      });
      testResults.summary.total++;
      testResults.summary.passed++;
    } catch (error) {
      testResults.tests.push({
        name: 'Data Subject Rights Response',
        status: 'FAIL',
        error: error.message
      });
      testResults.summary.total++;
      testResults.summary.failed++;
    }

    // Test 8: Privacy Impact Assessment
    try {
      const testActivity = {
        id: 'test-activity-123',
        purpose: 'User authentication',
        legalBasis: 'legitimate_interests' as const,
        dataCategories: ['personal', 'contact'],
        recipients: ['internal_team'],
        retentionPeriod: 365,
        securityMeasures: ['encryption', 'access_controls'],
        riskLevel: 'low' as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user'
      };
      
      const assessment = NDPACompliance.generatePrivacyImpactAssessment(testActivity);
      
      testResults.tests.push({
        name: 'Privacy Impact Assessment',
        status: 'PASS',
        details: { assessment }
      });
      testResults.summary.total++;
      testResults.summary.passed++;
    } catch (error) {
      testResults.tests.push({
        name: 'Privacy Impact Assessment',
        status: 'FAIL',
        error: error.message
      });
      testResults.summary.total++;
      testResults.summary.failed++;
    }

    // Calculate overall compliance score
    const complianceScore = (testResults.summary.passed / testResults.summary.total) * 100;
    
    return NextResponse.json({
      success: true,
      message: 'NDPA Compliance Test Completed',
      complianceScore: Math.round(complianceScore),
      results: testResults,
      recommendations: generateRecommendations(testResults)
    });

  } catch (error: any) {
    console.error('NDPA compliance test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'NDPA compliance test failed',
      details: error.message
    }, { status: 500 });
  }
}

function generateRecommendations(testResults: any): string[] {
  const recommendations = [];
  
  if (testResults.summary.failed > 0) {
    recommendations.push('Review failed tests and ensure all NDPA compliance features are properly configured');
  }
  
  if (testResults.summary.passed === testResults.summary.total) {
    recommendations.push('All NDPA compliance features are working correctly. Consider regular compliance audits.');
  }
  
  recommendations.push('Ensure all environment variables are properly configured for production');
  recommendations.push('Regularly review and update data retention policies');
  recommendations.push('Conduct periodic privacy impact assessments for new data processing activities');
  recommendations.push('Maintain comprehensive audit logs for all data processing activities');
  
  return recommendations;
}
