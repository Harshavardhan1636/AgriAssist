import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

    // TODO: Replace with Firebase Authentication
    // For now, simulate authentication
    if (email === 'demo@agriassist.com' && password === 'demo123') {
      // In production, this would be a proper JWT token from Firebase
      const mockToken = 'mock-jwt-token-' + Date.now();
      
      const user = {
        uid: 'demo-user-id',
        email: email,
        displayName: 'Demo User',
        farmLocation: {
          latitude: 12.9716,
          longitude: 77.5946,
          address: 'Bangalore, Karnataka, India'
        }
      };

      return NextResponse.json({
        success: true,
        token: mockToken,
        user: user
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );

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

// TODO: Implement with Firebase Authentication
/*
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();

    // Update last login
    await updateDoc(doc(db, 'users', user.uid), {
      lastLoginAt: new Date()
    });

    // Get Firebase ID token
    const token = await user.getIdToken();

    return NextResponse.json({
      success: true,
      token: token,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: userData?.displayName || user.displayName,
        farmLocation: userData?.farmLocation
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 401 }
    );
  }
}
*/