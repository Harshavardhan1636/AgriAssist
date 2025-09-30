import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, orderBy, limit as firestoreLimit, startAfter, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';

async function getUserIdFromToken(request: NextRequest): Promise<string> {
  // Mock implementation - in a real app, you would verify the JWT token
  // and extract the user ID from it
  return 'demo-user-id';
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const db = getFirestore(app);
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

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    const body = await request.json();
    
    const { title, analysisContext } = body;

    const db = getFirestore(app);
    const conversationsRef = collection(db, 'conversations');
    
    // Create new conversation
    const newConversation = {
      userId,
      title,
      analysisContext,
      messages: [],
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(conversationsRef, newConversation);
    
    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...newConversation
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}