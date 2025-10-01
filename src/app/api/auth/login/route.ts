import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    // Check if this is a demo login
    if (email === 'demo@agriassist.com' && password === 'demo123') {
      // Demo user authentication
      const mockToken = 'mock-jwt-token-' + Date.now();
      
      const user = {
        uid: 'demo-user-id',
        email: email,
        displayName: 'Demo User',
        farmLocation: {
          latitude: 12.9716,
          longitude: 77.5946,
          address: 'Bangalore, Karnataka, India'
        },
        isDemoUser: true // Mark as demo user
      };

      return NextResponse.json({
        success: true,
        token: mockToken,
        user: user
      });
    }

    // Check if Firebase auth is available
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Firebase authentication not available. Please check your configuration.' },
        { status: 500 }
      );
    }

    // Real user authentication with Firebase
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
      });

    } catch (firebaseError: any) {
      console.error('Firebase login error:', firebaseError);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}