import { NextRequest, NextResponse } from 'next/server';
import { mockHistory, mockConversations } from '@/lib/mock-data';
import type { FullAnalysisResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Extract user ID from JWT token
    // const userId = await getUserIdFromToken(request);
    const userId = 'demo-user-id'; // Mock user ID
    const analysisId = params.id;

    // TODO: Fetch from Firestore with user ownership verification
    const analysis = mockHistory.find(a => a.id === analysisId);
    if (!analysis) {
      return NextResponse.json(
        { success: false, error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Get associated conversation
    const conversation = mockConversations.find(c => c.analysisId === analysisId);

    // Reconstruct FullAnalysisResponse format
    const fullAnalysis: FullAnalysisResponse = {
      classification: {
        predictions: analysis.predictions
      },
      severity: {
        severityPercentage: analysis.severity.percentage,
        severityBand: analysis.severity.band,
        confidence: 0.85 // Mock confidence
      },
      explanation: {
        gradCAMOverlay: analysis.gradCamImage
      },
      forecast: {
        riskScore: analysis.risk.score,
        explanation: analysis.risk.explanation,
        preventiveActions: [] // Mock data
      },
      recommendations: {
        recommendations: [] // Mock data - would be populated from analysis
      },
      originalImage: analysis.image,
      locale: 'en', // Mock locale
      conversationId: analysis.conversationId
    };

    return NextResponse.json({
      success: true,
      data: {
        analysis: fullAnalysis,
        conversation: conversation || null,
        metadata: {
          id: analysis.id,
          timestamp: analysis.timestamp,
          status: analysis.status,
          crop: analysis.crop
        }
      }
    });

  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Extract user ID from JWT token and verify ownership
    const analysisId = params.id;
    const body = await request.json();
    const { status } = body;

    if (!['Completed', 'Pending Review'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // TODO: Update analysis status in Firestore
    /*
    const db = getFirestore();
    const analysisRef = doc(db, 'analyses', analysisId);
    
    await updateDoc(analysisRef, {
      status,
      updatedAt: new Date()
    });
    */

    return NextResponse.json({
      success: true,
      message: 'Analysis status updated successfully'
    });

  } catch (error) {
    console.error('Error updating analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update analysis' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Extract user ID from JWT token and verify ownership
    const analysisId = params.id;

    // TODO: Delete analysis and associated conversation from Firestore
    /*
    const db = getFirestore();
    const batch = writeBatch(db);
    
    // Delete analysis
    const analysisRef = doc(db, 'analyses', analysisId);
    batch.delete(analysisRef);
    
    // Delete associated conversation
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('analysisId', '==', analysisId)
    );
    const conversationsSnapshot = await getDocs(conversationsQuery);
    conversationsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    */

    return NextResponse.json({
      success: true,
      message: 'Analysis deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete analysis' },
      { status: 500 }
    );
  }
}

// TODO: Implement Firestore operations
/*
import { getFirestore, doc, getDoc, updateDoc, deleteDoc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';

async function getAnalysisFromFirestore(analysisId: string, userId: string) {
  const db = getFirestore();
  const analysisRef = doc(db, 'analyses', analysisId);
  const analysisSnap = await getDoc(analysisRef);
  
  if (!analysisSnap.exists()) {
    return null;
  }
  
  const analysis = analysisSnap.data();
  
  // Verify ownership
  if (analysis.userId !== userId) {
    throw new Error('Unauthorized access to analysis');
  }
  
  return { id: analysisSnap.id, ...analysis };
}
*/