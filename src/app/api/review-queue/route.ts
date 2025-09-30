import { NextRequest, NextResponse } from 'next/server';
import { reviewQueue } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    // TODO: Extract user ID from JWT token and verify agronomist role
    // const userId = await getUserIdFromToken(request);
    // const userRole = await getUserRole(userId);
    // if (userRole !== 'agronomist') {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    // }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'pending';
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // TODO: Replace with Firestore query
    let filteredQueue = [...reviewQueue];

    // Apply filters
    if (status !== 'all') {
      filteredQueue = filteredQueue.filter(item => 
        status === 'pending' ? !item.reviewedAt : !!item.reviewedAt
      );
    }

    // Apply sorting
    filteredQueue.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'confidence':
          aValue = a.confidence;
          bValue = b.confidence;
          break;
        case 'crop':
          aValue = a.crop;
          bValue = b.crop;
          break;
        default:
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedQueue = filteredQueue.slice(offset, offset + limit);
    const total = filteredQueue.length;

    return NextResponse.json({
      success: true,
      data: {
        queue: paginatedQueue,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          pending: reviewQueue.filter(item => !item.reviewedAt).length,
          reviewed: reviewQueue.filter(item => !!item.reviewedAt).length,
          total: reviewQueue.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching review queue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch review queue' },
      { status: 500 }
    );
  }
}

// TODO: Implement with Firestore
/*
import { getFirestore, collection, query, where, orderBy, limit as firestoreLimit, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    const userRole = await getUserRole(userId);
    
    if (userRole !== 'agronomist') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'pending';

    const db = getFirestore();
    const analysesRef = collection(db, 'analyses');
    
    let q = query(
      analysesRef,
      where('status', '==', 'Pending Review'),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    const queue = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: {
        queue,
        pagination: {
          page,
          limit,
          total: snapshot.size,
          totalPages: Math.ceil(snapshot.size / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching review queue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch review queue' },
      { status: 500 }
    );
  }
}
*/