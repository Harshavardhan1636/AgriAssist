'use server';

import { app } from '@/lib/firebase';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Logging functions
function logInfo(message: string, data?: any) {
  console.log(`[INFO] ${message}`, data || '');
}

function logError(message: string, error?: any) {
  console.error(`[ERROR] ${message}`, error || '');
}

function logWarn(message: string, data?: any) {
  console.warn(`[WARN] ${message}`, data || '');
}

// Fixed version of saveConversationToFirestore function
async function saveConversationToFirestore(conversationId: string, title: string, analysisContext: string) {
  try {
    // Mock user ID - in a real app, this would come from authentication
    const userId = 'demo-user-id';
    
    const db = getFirestore(app);
    const conversationsRef = collection(db, 'conversations');
    
    // Validate required parameters
    if (!conversationId || typeof conversationId !== 'string') {
      logError('Invalid conversationId provided');
      return null;
    }
    
    if (!title || typeof title !== 'string') {
      logError('Invalid title provided');
      return null;
    }
    
    // Ensure analysisContext is a string
    let validAnalysisContext = '';
    if (typeof analysisContext === 'string') {
      validAnalysisContext = analysisContext;
    } else if (analysisContext !== null && analysisContext !== undefined) {
      try {
        validAnalysisContext = JSON.stringify(analysisContext);
      } catch (e) {
        validAnalysisContext = 'Invalid context data';
        logWarn('Failed to stringify analysisContext, using fallback');
      }
    }
    
    // Sanitize and validate all fields
    const sanitizedUserId = userId && typeof userId === 'string' ? userId.trim() : 'anonymous';
    const sanitizedTitle = title.trim().substring(0, 100);
    const sanitizedContext = validAnalysisContext.trim();
    
    // Validate sanitized values
    if (!sanitizedUserId || sanitizedUserId.length === 0) {
      logError('Invalid userId after sanitization');
      return null;
    }
    
    if (!sanitizedTitle || sanitizedTitle.length === 0) {
      logError('Invalid title after sanitization');
      return null;
    }
    
    // Create new conversation with validated and sanitized values
    const newConversation: any = {
      userId: sanitizedUserId,
      title: sanitizedTitle,
      analysisContext: sanitizedContext,
      messages: [],
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
    };
    
    // Ensure all fields have valid values before saving
    const validatedConversation: any = {};
    for (const [key, value] of Object.entries(newConversation)) {
      // Skip undefined or null values
      if (value === undefined || value === null) {
        continue;
      }
      
      // Validate data types for Firestore
      if (typeof value === 'string' || 
          typeof value === 'number' || 
          typeof value === 'boolean' || 
          Array.isArray(value) || 
          (value && typeof value === 'object' && !(value instanceof Date) && value.constructor === Object)) {
        validatedConversation[key] = value;
      } else {
        logWarn(`Skipping invalid field for Firestore: ${key}`, { value, type: typeof value });
      }
    }
    
    // Additional validation to ensure we have required fields
    if (!validatedConversation.userId || !validatedConversation.title) {
      logError('Missing required fields after validation');
      return null;
    }
    
    const docRef = await addDoc(conversationsRef, validatedConversation);
    logInfo(`Conversation saved to Firestore with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error: any) {
    logError('Failed to save conversation to Firestore', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      conversationId
    });
    return null;
  }
}

export { saveConversationToFirestore };