import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = signupSchema.parse(body);
    const { email, password } = validatedData;

    // Check if Firebase auth is available
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Firebase authentication not available. Please check your configuration.' },
        { status: 500 }
      );
    }

    // Real user signup with Firebase
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get Firebase ID token
      const token = await user.getIdToken();

      return NextResponse.json({
        success: true,
        token: token,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          isDemoUser: false // Mark as real user
        }
      }, { status: 201 });

    } catch (firebaseError: any) {
      console.error('Firebase signup error:', firebaseError);
      
      // Handle specific Firebase errors
      if (firebaseError.code === 'auth/email-already-in-use') {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Signup failed' },
        { status: 400 }
      );
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}