import { NextRequest, NextResponse } from 'next/server';
import { mockConversations } from '@/lib/mock-data';

// Mock function to simulate getting user ID from token
// In a real implementation, this would verify the JWT token
async function getUserIdFromToken(request: NextRequest): Promise<{ userId: string | null; isDemoUser: boolean }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: null, isDemoUser: false };
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  // For demo token, return demo user ID
  if (token.startsWith('mock-jwt-token-')) {
    return { userId: 'demo-user-id', isDemoUser: true };
  }
  
  // For real tokens, we would verify with Firebase Auth
  // This is a placeholder for real implementation
  return { userId: 'real-user-id', isDemoUser: false };
}

export async function GET(request: NextRequest) {
  try {
    const { userId, isDemoUser } = await getUserIdFromToken(request);
    
    // If no user ID, return unauthorized
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (isDemoUser) {
      // For demo users, use mock data
      const offset = (page - 1) * limit;
      const paginatedConversations = mockConversations.slice(offset, offset + limit);
      const total = mockConversations.length;

      return NextResponse.json({
        success: true,
        data: {
          conversations: paginatedConversations,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          },
          isDemoData: true
        }
      });
    } else {
      // For real users, we would fetch from Firestore
      // For now, we'll return mock data but indicate it's not demo data
      const offset = (page - 1) * limit;
      const paginatedConversations = mockConversations.slice(offset, offset + limit);
      const total = mockConversations.length;

      return NextResponse.json({
        success: true,
        data: {
          conversations: paginatedConversations,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          },
          isDemoData: false
        }
      });
    }

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
    const { userId, isDemoUser } = await getUserIdFromToken(request);
    
    // If no user ID, return unauthorized
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    const { title, analysisContext } = body;

    if (isDemoUser) {
      // For demo users, we don't actually create anything in the database
      // Just return a mock response
      const newConversation = {
        id: 'demo-convo-' + Date.now(),
        userId: 'demo-user-id',
        title,
        analysisContext,
        messages: [],
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
      };
      
      return NextResponse.json({
        success: true,
        data: newConversation
      }, { status: 201 });
    } else {
      // For real users, we would create in Firestore
      // For now, we'll return a mock response but indicate it's not demo data
      const newConversation = {
        id: 'real-convo-' + Date.now(),
        userId: 'real-user-id',
        title,
        analysisContext,
        messages: [],
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
      };
      
      return NextResponse.json({
        success: true,
        data: newConversation
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

// TODO: Implement with Firestore for real user data
/*
import { getFirestore, collection, query, where, orderBy, limit as firestoreLimit, startAfter, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    
    // If no user ID, return unauthorized
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if this is a demo user
    const isDemoUser = userId === 'demo-user-id';
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (isDemoUser) {
      // For demo users, use mock data
      const offset = (page - 1) * limit;
      const paginatedConversations = mockConversations.slice(offset, offset + limit);
      const total = mockConversations.length;

      return NextResponse.json({
        success: true,
        data: {
          conversations: paginatedConversations,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          },
          isDemoData: true
        }
      });
    } else {
      // For real users, fetch from Firestore
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
          },
          isDemoData: false
        }
      });
    }

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
    
    // If no user ID, return unauthorized
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if this is a demo user
    const isDemoUser = userId === 'demo-user-id';
    
    const body = await request.json();
    
    const { title, analysisContext } = body;

    if (isDemoUser) {
      // For demo users, we don't actually create anything in the database
      // Just return a mock response
      const newConversation = {
        id: 'demo-convo-' + Date.now(),
        userId: 'demo-user-id',
        title,
        analysisContext,
        messages: [],
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
      };
      
      return NextResponse.json({
        success: true,
        data: newConversation
      }, { status: 201 });
    } else {
      // For real users, create in Firestore
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
    }

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
*/