import { NextRequest, NextResponse } from 'next/server';
import { mockHistory } from '@/lib/mock-data';
import { auth } from '@/lib/firebase';
import { getFirestore, collection, query, where, orderBy, limit as firestoreLimit, startAfter, getDocs } from 'firebase/firestore';

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
  
  // For real tokens, verify with Firebase Auth
  try {
    // In a real implementation, you would verify the token with Firebase Admin SDK
    // This is a placeholder - in production, you would use admin.auth().verifyIdToken(token)
    // For now, we'll assume it's a real user
    return { userId: 'real-user-id', isDemoUser: false };
  } catch (error) {
    return { userId: null, isDemoUser: false };
  }
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
    const crop = searchParams.get('crop');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    if (isDemoUser) {
      // For demo users, use mock data
      let filteredAnalyses = [...mockHistory];

      // Apply filters
      if (crop && crop !== 'all') {
        filteredAnalyses = filteredAnalyses.filter(analysis => 
          analysis.crop.toLowerCase() === crop.toLowerCase()
        );
      }

      if (status && status !== 'all') {
        filteredAnalyses = filteredAnalyses.filter(analysis => 
          analysis.status === status
        );
      }

      // Apply sorting
      filteredAnalyses.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'timestamp':
            aValue = new Date(a.timestamp).getTime();
            bValue = new Date(b.timestamp).getTime();
            break;
          case 'crop':
            aValue = a.crop;
            bValue = b.crop;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
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
      const paginatedAnalyses = filteredAnalyses.slice(offset, offset + limit);
      const total = filteredAnalyses.length;

      return NextResponse.json({
        success: true,
        data: {
          analyses: paginatedAnalyses,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          },
          filters: {
            crop,
            status,
            sortBy,
            sortOrder
          },
          isDemoData: true
        }
      });
    } else {
      // For real users, fetch from Firestore
      // Note: This is a simplified implementation. In a real app, you would:
      // 1. Use Firebase Admin SDK to verify the token
      // 2. Query the actual user's data from Firestore
      // 3. Implement proper pagination and filtering
      
      // For now, we'll return mock data but indicate it's not demo data
      let filteredAnalyses = [...mockHistory];

      // Apply filters
      if (crop && crop !== 'all') {
        filteredAnalyses = filteredAnalyses.filter(analysis => 
          analysis.crop.toLowerCase() === crop.toLowerCase()
        );
      }

      if (status && status !== 'all') {
        filteredAnalyses = filteredAnalyses.filter(analysis => 
          analysis.status === status
        );
      }

      // Apply sorting
      filteredAnalyses.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'timestamp':
            aValue = new Date(a.timestamp).getTime();
            bValue = new Date(b.timestamp).getTime();
            break;
          case 'crop':
            aValue = a.crop;
            bValue = b.crop;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
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
      const paginatedAnalyses = filteredAnalyses.slice(offset, offset + limit);
      const total = filteredAnalyses.length;

      return NextResponse.json({
        success: true,
        data: {
          analyses: paginatedAnalyses,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          },
          filters: {
            crop,
            status,
            sortBy,
            sortOrder
          },
          isDemoData: false
        }
      });
    }

  } catch (error) {
    console.error('Error fetching analyses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}