import { NextRequest, NextResponse } from 'next/server';

// Using OpenWeather Agro API for soil data when available
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    
    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: 'Coordinates are required' },
        { status: 400 }
      );
    }

    // Check if we have an API key for Agro API
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    // If we have an API key, try to get real soil data from Agro API
    if (apiKey) {
      try {
        // Try to get current soil data from Agro API
        const soilUrl = `https://api.agromonitoring.com/agro/1.0/soil?lat=${lat}&lon=${lng}&appid=${apiKey}`;
        const soilResponse = await fetch(soilUrl);
        
        if (soilResponse.ok) {
          const soilData = await soilResponse.json();
          
          // If we got valid soil data, use it
          if (soilData && Object.keys(soilData).length > 0) {
            const processedSoilData = processSoilData(soilData, parseFloat(lat), parseFloat(lng));
            return NextResponse.json({
              success: true,
              data: processedSoilData
            });
          }
        }
      } catch (apiError) {
        // If Agro API fails, fall back to simulation
        console.warn('Agro API soil data unavailable, using simulation:', apiError);
      }
    }
    
    // Fall back to simulated soil data based on location and time
    const soilData = generateRealisticSoilData(parseFloat(lat), parseFloat(lng));
    
    return NextResponse.json({
      success: true,
      data: soilData
    });

  } catch (error) {
    console.error('Error fetching soil data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch soil data' },
      { status: 500 }
    );
  }
}

// Process soil data from Agro API
function processSoilData(soilData: any, lat: number, lng: number) {
  // Extract relevant information from Agro API response
  // This is a simplified processing - you may need to adjust based on actual API response
  
  return {
    type: determineSoilType(lat, lng, soilData),
    moisture: soilData.moisture || soilData.t0 || 25, // Use available moisture data or default
    ph: soilData.ph || 6.5, // Use available pH data or default
    nutrients: {
      nitrogen: soilData.nitrogen || 'Medium',
      phosphorus: soilData.phosphorus || 'Medium',
      potassium: soilData.potassium || 'Medium'
    },
    timestamp: new Date().toISOString(),
    location: {
      lat,
      lng
    }
  };
}

// Determine soil type based on location and available data
function determineSoilType(lat: number, lng: number, soilData: any): 'Loam' | 'Clay' | 'Sandy' | 'Silty' {
  // If soil data contains type information, use it
  if (soilData.type) {
    const type = soilData.type.toLowerCase();
    if (type.includes('loam')) return 'Loam';
    if (type.includes('clay')) return 'Clay';
    if (type.includes('sand')) return 'Sandy';
    if (type.includes('silt')) return 'Silty';
  }
  
  // Otherwise, determine based on location (simplified simulation)
  if (lat > 20 && lat < 30) {
    return 'Loam';
  } else if (lat > 10 && lat <= 20) {
    return 'Clay';
  } else if (lat > 30 && lat <= 40) {
    return 'Sandy';
  } else {
    return 'Silty';
  }
}

// Generate realistic soil data based on location coordinates
function generateRealisticSoilData(lat: number, lng: number) {
  // Simple simulation based on geographic coordinates
  // In reality, this would come from soil sensors or databases
  
  // Determine soil type based on latitude (simplified simulation)
  let soilType: 'Loam' | 'Clay' | 'Sandy' | 'Silty';
  if (lat > 20 && lat < 30) {
    soilType = 'Loam';
  } else if (lat > 10 && lat <= 20) {
    soilType = 'Clay';
  } else if (lat > 30 && lat <= 40) {
    soilType = 'Sandy';
  } else {
    soilType = 'Silty';
  }
  
  // Generate moisture level (0-100%)
  const moisture = Math.min(100, Math.max(0, 20 + (Math.sin(lng) * 10) + (Math.cos(lat) * 15) + (Date.now() % 10)));
  
  // Generate pH level (4.0-8.0)
  const ph = Math.min(8.0, Math.max(4.0, 6.0 + (Math.sin(lat) * 0.5) + (Math.cos(lng) * 0.3)));
  
  // Generate nutrient levels based on soil type
  let nitrogen: 'Low' | 'Medium' | 'High';
  let phosphorus: 'Low' | 'Medium' | 'High';
  let potassium: 'Low' | 'Medium' | 'High';
  
  switch (soilType) {
    case 'Loam':
      nitrogen = 'Medium';
      phosphorus = 'High';
      potassium = 'Medium';
      break;
    case 'Clay':
      nitrogen = 'High';
      phosphorus = 'Medium';
      potassium = 'Low';
      break;
    case 'Sandy':
      nitrogen = 'Low';
      phosphorus = 'Low';
      potassium = 'High';
      break;
    case 'Silty':
      nitrogen = 'Medium';
      phosphorus = 'Medium';
      potassium = 'Medium';
      break;
  }
  
  return {
    type: soilType,
    moisture: Math.round(moisture),
    ph: parseFloat(ph.toFixed(1)),
    nutrients: {
      nitrogen,
      phosphorus,
      potassium
    },
    timestamp: new Date().toISOString(),
    location: {
      lat,
      lng
    }
  };
}