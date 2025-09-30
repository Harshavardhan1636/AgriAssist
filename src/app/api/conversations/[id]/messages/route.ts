import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { askFollowUpQuestion as askFollowUpQuestionFlow } from '@/ai/flows/ask-follow-up-question';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';

const messageSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty'),
  analysisContext: z.string().optional(),
  language: z.string().default('en'),
});

async function getUserIdFromToken(request: NextRequest): Promise<string> {
  // Mock implementation - in a real app, you would verify the JWT token
  // and extract the user ID from it
  return 'demo-user-id';
}

async function getConversationFromFirestore(conversationId: string, userId: string) {
  const db = getFirestore(app);
  const conversationRef = doc(db, 'conversations', conversationId);
  const conversationSnap = await getDoc(conversationRef);
  
  if (!conversationSnap.exists()) {
    return null;
  }
  
  const conversation = conversationSnap.data();
  
  // Verify ownership
  if (conversation.userId !== userId) {
    throw new Error('Unauthorized access to conversation');
  }
  
  return { id: conversationSnap.id, ...conversation } as any;
}

async function updateConversationInFirestore(conversationId: string, updates: any) {
  const db = getFirestore(app);
  const conversationRef = doc(db, 'conversations', conversationId);
  
  await updateDoc(conversationRef, {
    ...updates,
    lastMessageAt: serverTimestamp()
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromToken(request);
    const conversationId = params.id;

    const body = await request.json();
    const validatedData = messageSchema.parse(body);
    const { question, analysisContext, language } = validatedData;

    // Fetch conversation from Firestore to verify ownership and get context
    const conversation: any = await getConversationFromFirestore(conversationId, userId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Use provided context or conversation's analysis context
    const contextToUse = analysisContext || conversation.analysisContext;

    // Get AI response
    const aiResponse = await askFollowUpQuestionFlow({
      analysisContext: contextToUse,
      question,
      language
    });

    // Save messages to Firestore
    const userMessage = {
      sender: 'user' as const,
      text: question,
      timestamp: new Date().toISOString()
    };

    const botMessage = {
      sender: 'bot' as const,
      text: aiResponse.answer,
      timestamp: new Date().toISOString()
    };

    // Update conversation in Firestore
    await updateConversationInFirestore(conversationId, {
      messages: arrayUnion(userMessage, botMessage)
    });

    return NextResponse.json({
      success: true,
      data: {
        userMessage,
        botMessage,
        answer: aiResponse.answer
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error processing follow-up question:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process question' 
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromToken(request);
    const conversationId = params.id;

    // Fetch conversation messages from Firestore
    const conversation: any = await getConversationFromFirestore(conversationId, userId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        messages: conversation.messages || []
      }
    });

  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}