import { NextRequest, NextResponse } from 'next/server';
import { mockProducts } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const disease = searchParams.get('disease');
    const crop = searchParams.get('crop');
    const type = searchParams.get('type');
    const govtApproved = searchParams.get('govtApproved');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // TODO: Replace with Firestore query with proper product recommendation logic
    let filteredProducts = [...mockProducts];

    // Apply filters
    if (type && type !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.type === type
      );
    }

    if (govtApproved === 'true') {
      filteredProducts = filteredProducts.filter(product => 
        product.isGovtApproved
      );
    }

    // TODO: Implement smart recommendation based on disease and crop
    if (disease) {
      // This would be replaced with AI-powered recommendations
      // For now, prioritize organic and government-approved products
      filteredProducts.sort((a, b) => {
        if (a.isGovtApproved && !b.isGovtApproved) return -1;
        if (!a.isGovtApproved && b.isGovtApproved) return 1;
        if (a.type.includes('Organic') && !b.type.includes('Organic')) return -1;
        if (!a.type.includes('Organic') && b.type.includes('Organic')) return 1;
        return 0;
      });
    }

    // Apply sorting
    filteredProducts.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);
    const total = filteredProducts.length;

    return NextResponse.json({
      success: true,
      data: {
        products: paginatedProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        filters: {
          disease,
          crop,
          type,
          govtApproved,
          sortBy,
          sortOrder
        },
        recommendations: disease ? {
          message: `Products recommended for ${disease}`,
          priority: 'Organic and government-approved products are prioritized'
        } : null
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// TODO: Implement with Firestore and AI-powered recommendations
/*
import { getFirestore, collection, query, where, orderBy, limit as firestoreLimit, getDocs } from 'firebase/firestore';
import { recommendProducts } from '@/ai/flows/recommend-products';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const disease = searchParams.get('disease');
    const crop = searchParams.get('crop');
    const severity = searchParams.get('severity');

    const db = getFirestore();
    const productsRef = collection(db, 'products');
    
    let q = query(
      productsRef,
      where('inStock', '==', true),
      orderBy('isGovtApproved', 'desc'),
      orderBy('name', 'asc')
    );

    // If we have disease information, get AI recommendations
    if (disease) {
      const aiRecommendations = await recommendProducts({
        disease,
        crop: crop || 'Unknown',
        severity: severity || 'Medium',
        language: 'en'
      });

      // Filter products based on AI recommendations
      const recommendedProductIds = aiRecommendations.recommendations.map(r => r.productId);
      q = query(q, where('__name__', 'in', recommendedProductIds));
    }

    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: {
        products,
        recommendations: disease ? aiRecommendations : null
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
*/