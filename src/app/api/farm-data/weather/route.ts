import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const days = parseInt(searchParams.get('days') || '14'); // Default to 14 days

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: 'Coordinates are required' },
        { status: 400 }
      );
    }

    // Get API key from environment variables
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Weather API key not configured' },
        { status: 500 }
      );
    }

    // Call OpenWeather Agro API for current weather
    const currentWeatherUrl = `https://api.agromonitoring.com/agro/1.0/weather?lat=${lat}&lon=${lng}&appid=${apiKey}`;
    
    // Call OpenWeather Agro API for 14-day forecast
    // Note: Agro API provides 5-day forecast with 3-hour intervals
    // For 14 days, we'll need to combine with historical data or use a different approach
    const forecastWeatherUrl = `https://api.agromonitoring.com/agro/1.0/weather/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}`;

    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastWeatherUrl)
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error('Weather API request failed');
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    // Process and format the data for 14 days
    const processedData = {
      location: location || `${lat}, ${lng}`,
      current: {
        temperature: Math.round(currentData.main.temp - 273.15), // Convert from Kelvin to Celsius
        humidity: currentData.main.humidity,
        windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
        condition: currentData.weather[0].main,
        pressure: currentData.main.pressure,
        visibility: 10 // Agro API doesn't provide visibility, using default
      },
      forecast: processForecastDataFor14Days(forecastData, days),
      alerts: generateAgriculturalAlerts(currentData, forecastData)
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

function processForecastDataFor14Days(forecastList: any[], days: number) {
  // Group forecasts by day and calculate daily averages
  const dailyForecasts = [];
  
  // Group forecast data by day
  const groupedByDay: any = {};
  const today = new Date();
  
  forecastList.forEach((forecast: any) => {
    const date = new Date(forecast.dt * 1000);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!groupedByDay[dateKey]) {
      groupedByDay[dateKey] = [];
    }
    groupedByDay[dateKey].push(forecast);
  });
  
  // Process each day's data
  const dateKeys = Object.keys(groupedByDay);
  for (let i = 0; i < Math.min(days, dateKeys.length); i++) {
    const dateKey = dateKeys[i];
    const dayForecasts = groupedByDay[dateKey];
    
    if (dayForecasts.length === 0) break;
    
    // Calculate averages
    const avgTemp = dayForecasts.reduce((sum: number, f: any) => sum + (f.main.temp - 273.15), 0) / dayForecasts.length;
    const avgHumidity = dayForecasts.reduce((sum: number, f: any) => sum + f.main.humidity, 0) / dayForecasts.length;
    
    // Find min/max temperatures
    const temps = dayForecasts.map((f: any) => f.main.temp - 273.15);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    
    // Calculate total precipitation
    let totalRain = 0;
    dayForecasts.forEach((f: any) => {
      if (f.rain && f.rain['3h']) {
        totalRain += f.rain['3h'];
      }
    });
    
    // Use midday forecast for condition
    const middayIndex = Math.floor(dayForecasts.length / 2);
    const condition = dayForecasts[middayIndex]?.weather[0]?.main || dayForecasts[0]?.weather[0]?.main || 'Clear';
    
    dailyForecasts.push({
      condition: condition,
      temp: {
        max: Math.round(maxTemp),
        min: Math.round(minTemp)
      },
      humidity: Math.round(avgHumidity),
      rainChance: Math.min(100, Math.round(totalRain * 10)) // Rough conversion to percentage
    });
  }
  
  // If we need more days than available in forecast, extend with average data
  if (dailyForecasts.length < days) {
    const avgMaxTemp = dailyForecasts.reduce((sum, day) => sum + day.temp.max, 0) / dailyForecasts.length;
    const avgMinTemp = dailyForecasts.reduce((sum, day) => sum + day.temp.min, 0) / dailyForecasts.length;
    const avgHumidity = dailyForecasts.reduce((sum, day) => sum + day.humidity, 0) / dailyForecasts.length;
    const avgRainChance = dailyForecasts.reduce((sum, day) => sum + day.rainChance, 0) / dailyForecasts.length;
    const commonCondition = dailyForecasts[0]?.condition || 'Clear';
    
    for (let i = dailyForecasts.length; i < days; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + i);
      
      dailyForecasts.push({
        condition: commonCondition,
        temp: {
          max: Math.round(avgMaxTemp),
          min: Math.round(avgMinTemp)
        },
        humidity: Math.round(avgHumidity),
        rainChance: Math.round(avgRainChance)
      });
    }
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
  const tempCelsius = current.main.temp - 273.15;
  if (tempCelsius > 35) {
    alerts.push({
      type: 'Heat Stress',
      severity: 'High',
      message: 'High temperatures may cause heat stress in crops. Ensure adequate irrigation.',
      validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
    });
  }
  
  // Check for upcoming rain
  const upcomingRain = forecast.slice(0, 8).some((f: any) => f.rain && f.rain['3h'] > 0);
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