import { NextRequest, NextResponse } from 'next/server';
import { communityOutbreaks } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '50'); // km
    const riskLevel = searchParams.get('riskLevel');
    const disease = searchParams.get('disease');

    // TODO: Replace with Firestore geospatial query
    let filteredOutbreaks = [...communityOutbreaks];

    // Apply filters
    if (riskLevel && riskLevel !== 'all') {
      filteredOutbreaks = filteredOutbreaks.filter(outbreak => 
        outbreak.riskLevel === riskLevel
      );
    }

    if (disease && disease !== 'all') {
      filteredOutbreaks = filteredOutbreaks.filter(outbreak => 
        outbreak.disease.toLowerCase().includes(disease.toLowerCase())
      );
    }

    // Apply geospatial filtering if coordinates provided
    if (lat !== 0 && lng !== 0) {
      filteredOutbreaks = filteredOutbreaks.filter(outbreak => {
        const distance = calculateDistance(lat, lng, outbreak.latitude, outbreak.longitude);
        return distance <= radius;
      });
    }

    // Sort by risk level and recency
    filteredOutbreaks.sort((a, b) => {
      const riskOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const riskDiff = riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      if (riskDiff !== 0) return riskDiff;
      
      return new Date(b.firstReported).getTime() - new Date(a.firstReported).getTime();
    });

    return NextResponse.json({
      success: true,
      data: {
        outbreaks: filteredOutbreaks,
        summary: {
          total: filteredOutbreaks.length,
          high: filteredOutbreaks.filter(o => o.riskLevel === 'High').length,
          medium: filteredOutbreaks.filter(o => o.riskLevel === 'Medium').length,
          low: filteredOutbreaks.filter(o => o.riskLevel === 'Low').length,
        }
      }
    });

  } catch (error) {
    console.error('Error fetching outbreaks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch outbreak data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Extract user ID from JWT token
    // const userId = await getUserIdFromToken(request);
    const userId = 'demo-user-id';

    const body = await request.json();
    const { disease, crop, location, latitude, longitude, description } = body;

    // TODO: Validate and save outbreak report to Firestore
    const outbreakReport = {
      id: `outbreak-${Date.now()}`,
      disease,
      crop,
      location,
      latitude,
      longitude,
      description,
      reportedBy: userId,
      reportedAt: new Date().toISOString(),
      status: 'pending_verification',
      detectedCases: 1,
      riskLevel: 'Medium' as const // Initial assessment
    };

    // TODO: Save to Firestore and trigger analysis pipeline
    /*
    const db = getFirestore();
    const outbreaksRef = collection(db, 'outbreak_reports');
    
    await addDoc(outbreaksRef, outbreakReport);
    
    // Trigger background analysis to determine if this creates a new outbreak cluster
    await triggerOutbreakAnalysis(outbreakReport);
    */

    return NextResponse.json({
      success: true,
      message: 'Outbreak report submitted successfully',
      data: outbreakReport
    });

  } catch (error) {
    console.error('Error reporting outbreak:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit outbreak report' },
      { status: 500 }
    );
  }
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// TODO: Implement with Firestore geospatial queries
/*
import { getFirestore, collection, query, where, getDocs, GeoPoint } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '50');

    const db = getFirestore();
    const outbreaksRef = collection(db, 'outbreaks');
    
    // For geospatial queries, you might need to use a service like Algolia or implement
    // a geohash-based solution since Firestore doesn't have native radius queries
    
    let q = query(
      outbreaksRef,
      where('status', '==', 'active'),
      orderBy('riskLevel', 'desc'),
      orderBy('firstReported', 'desc')
    );

    const snapshot = await getDocs(q);
    const outbreaks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: { outbreaks }
    });

  } catch (error) {
    console.error('Error fetching outbreaks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch outbreak data' },
      { status: 500 }
    );
  }
}
*/