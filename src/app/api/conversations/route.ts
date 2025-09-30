import { NextRequest, NextResponse } from 'next/server';
import { mockConversations } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    // TODO: Extract user ID from JWT token
    // const userId = await getUserIdFromToken(request);
    const userId = 'demo-user-id'; // Mock user ID

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // TODO: Replace with Firestore query
    // For now, return mock data
    const userConversations = mockConversations.slice(offset, offset + limit);
    const total = mockConversations.length;

    return NextResponse.json({
      success: true,
      data: {
        conversations: userConversations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// TODO: Implement with Firestore
/*
import { getFirestore, collection, query, where, orderBy, limit as firestoreLimit, startAfter, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const db = getFirestore();
    const conversationsRef = collection(db, 'conversations');
    
    let q = query(
      conversationsRef,
      where('userId', '==', userId),
      orderBy('lastMessageAt', 'desc'),
      firestoreLimit(limit)
    );

    // Handle pagination
    if (page > 1) {
      const previousPageQuery = query(
        conversationsRef,
        where('userId', '==', userId),
        orderBy('lastMessageAt', 'desc'),
        firestoreLimit((page - 1) * limit)
      );
      const previousPageSnapshot = await getDocs(previousPageQuery);
      const lastDoc = previousPageSnapshot.docs[previousPageSnapshot.docs.length - 1];
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get total count for pagination
    const totalQuery = query(conversationsRef, where('userId', '==', userId));
    const totalSnapshot = await getDocs(totalQuery);
    const total = totalSnapshot.size;

    return NextResponse.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
*/