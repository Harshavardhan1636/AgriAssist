import { NextRequest, NextResponse } from 'next/server';
import { mockForecast } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const days = parseInt(searchParams.get('days') || '7');

    if (!location && (!lat || !lng)) {
      return NextResponse.json(
        { success: false, error: 'Location or coordinates are required' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual weather API call
    // For now, return mock data
    const weatherData = {
      location: location || `${lat}, ${lng}`,
      forecast: mockForecast.slice(0, days),
      current: {
        temperature: 28,
        humidity: 75,
        windSpeed: 12,
        condition: 'Partly Cloudy',
        pressure: 1013,
        visibility: 10
      },
      alerts: [
        {
          type: 'High Humidity',
          severity: 'Medium',
          message: 'High humidity levels may increase disease risk for tomato crops',
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: weatherData
    });

  } catch (error) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

// TODO: Implement with real weather API
/*
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const days = parseInt(searchParams.get('days') || '7');

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: 'Coordinates are required' },
        { status: 400 }
      );
    }

    // Call OpenWeatherMap API
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&cnt=${days * 8}`; // 8 forecasts per day (3-hour intervals)

    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl)
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error('Weather API request failed');
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    // Process and format the data
    const processedData = {
      location: `${currentData.name}, ${currentData.sys.country}`,
      current: {
        temperature: Math.round(currentData.main.temp),
        humidity: currentData.main.humidity,
        windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
        condition: currentData.weather[0].main,
        pressure: currentData.main.pressure,
        visibility: currentData.visibility / 1000 // Convert to km
      },
      forecast: processForecastData(forecastData.list, days),
      alerts: generateAgriculturalAlerts(currentData, forecastData.list)
    };

    return NextResponse.json({
      success: true,
      data: processedData
    });

  } catch (error) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

function processForecastData(forecastList: any[], days: number) {
  // Group forecasts by day and calculate daily averages
  const dailyForecasts = [];
  
  for (let i = 0; i < days; i++) {
    const dayStart = i * 8;
    const dayEnd = Math.min((i + 1) * 8, forecastList.length);
    const dayForecasts = forecastList.slice(dayStart, dayEnd);
    
    if (dayForecasts.length === 0) break;
    
    const avgTemp = dayForecasts.reduce((sum, f) => sum + f.main.temp, 0) / dayForecasts.length;
    const avgHumidity = dayForecasts.reduce((sum, f) => sum + f.main.humidity, 0) / dayForecasts.length;
    const totalRain = dayForecasts.reduce((sum, f) => sum + (f.rain?.['3h'] || 0), 0);
    
    dailyForecasts.push({
      condition: dayForecasts[4]?.weather[0]?.main || dayForecasts[0].weather[0].main, // Use midday forecast
      temp: {
        max: Math.round(Math.max(...dayForecasts.map(f => f.main.temp_max))),
        min: Math.round(Math.min(...dayForecasts.map(f => f.main.temp_min)))
      },
      humidity: Math.round(avgHumidity),
      rainChance: Math.min(100, Math.round(totalRain * 10)) // Rough conversion to percentage
    });
  }
  
  return dailyForecasts;
}

function generateAgriculturalAlerts(current: any, forecast: any[]) {
  const alerts = [];
  
  // High humidity alert
  if (current.main.humidity > 80) {
    alerts.push({
      type: 'High Humidity',
      severity: 'Medium',
      message: 'High humidity levels may increase disease risk for crops',
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  // Temperature alerts
  if (current.main.temp > 35) {
    alerts.push({
      type: 'Heat Stress',
      severity: 'High',
      message: 'High temperatures may cause heat stress in crops. Ensure adequate irrigation.',
      validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
    });
  }
  
  // Check for upcoming rain
  const upcomingRain = forecast.slice(0, 8).some(f => f.rain && f.rain['3h'] > 0);
  if (upcomingRain) {
    alerts.push({
      type: 'Rain Expected',
      severity: 'Low',
      message: 'Rain expected in the next 24 hours. Plan field activities accordingly.',
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return alerts;
}
*/