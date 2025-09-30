import { NextResponse } from 'next/server';

export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'mock', // Would be 'connected' with real Firestore
      ai: process.env.GEMINI_API_KEY ? 'configured' : 'missing_key',
      auth: 'ready',
      api: 'operational'
    },
    features: {
      analysis: true,
      conversations: true,
      community: true,
      store: true,
      mobile: true,
      pwa: true
    },
    performance: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    }
  };

  return NextResponse.json(healthCheck, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}