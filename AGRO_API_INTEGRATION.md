# OpenWeather Agro API Integration

This document explains how the AgriAssist application integrates with the OpenWeather Agro API to provide specialized agricultural weather and soil data.

## Current Implementation Status

**Status:** 🔄 Partially Implemented
**Integration Type:** Server-side API calls through Next.js API routes
**Fallback:** Simulated data when API is unavailable

## Overview

The AgriAssist application uses the OpenWeather Agro API, which is specifically designed for agricultural applications. This provides more relevant data for crop monitoring and farming decisions compared to the general weather API.

## API Endpoints Used

### Current Weather
- **Endpoint**: `https://api.agromonitoring.com/agro/1.0/weather`
- **Parameters**: 
  - `lat`: Latitude of the location
  - `lon`: Longitude of the location
  - `appid`: Your Agro API key

### Weather Forecast
- **Endpoint**: `https://api.agromonitoring.com/agro/1.0/weather/forecast`
- **Parameters**: 
  - `lat`: Latitude of the location
  - `lon`: Longitude of the location
  - `appid`: Your Agro API key

### Soil Data (when available)
- **Endpoint**: `https://api.agromonitoring.com/agro/1.0/soil`
- **Parameters**: 
  - `lat`: Latitude of the location
  - `lon`: Longitude of the location
  - `appid`: Your Agro API key

## Current Implementation

### API Routes
The application implements the following Next.js API routes:
- `/api/farm-data/weather` - Fetches current weather and forecast data
- `/api/farm-data/soil` - Fetches soil data when available

### Data Processing
- Temperature is converted from Kelvin to Celsius
- Wind speed is converted from m/s to km/h
- Forecast data is processed for 14-day risk assessment
- Agricultural alerts are generated based on weather conditions

### Error Handling
- Graceful fallback to simulated data when API is unavailable
- Proper error messages for debugging
- Validation of required parameters
- Timeout handling for slow API responses

## Data Provided to Application

### Weather Data
- Current weather conditions (temperature, humidity, wind, etc.)
- 14-day weather forecast with daily summaries
- Agricultural alerts based on weather conditions

### Soil Data
- Soil type classification (when available)
- Soil moisture estimates
- When API data is unavailable, simulated data based on location and crop type

## Benefits of Using Agro API

1. **Agricultural Focus**: Data specifically tailored for farming applications
2. **Higher Accuracy**: More precise weather data for agricultural planning
3. **Specialized Parameters**: Additional agricultural metrics not available in general weather APIs
4. **Forecast Accuracy**: Extended forecast provides detailed planning information

## Current Limitations

### API Availability
- API calls may fail due to network issues or service outages
- Rate limiting may affect data retrieval during high usage
- Some regions may have limited soil data availability

### Data Processing
- Some data transformations are simplified for prototype purposes
- Error handling could be more robust in production
- Caching is not yet implemented for improved performance

## Testing Status

The integration has been tested with sample API keys:
- ✅ Current weather data retrieval
- ✅ Forecast data retrieval  
- ✅ Soil data retrieval (when available)
- ✅ Fallback to simulated data
- ✅ Error handling scenarios

## Future Enhancements

The Agro API also provides additional endpoints that could be integrated in the future:
- Satellite imagery for crop monitoring
- Vegetation indices (NDVI, EVI, etc.)
- Historical weather data
- Accumulated temperature and precipitation data
- UV index data

## API Key Security

The API key is stored in environment variables and is not exposed in the client-side code. All API calls are made server-side through API routes to protect the key.

## Rate Limits

The free tier of the Agro API provides sufficient calls for most agricultural applications. For high-volume usage, consider upgrading to a paid plan.

## Troubleshooting

If you encounter issues:
1. Verify the API key is correct in `.env.local`
2. Check that the coordinates are valid
3. Ensure you have internet connectivity
4. Check the OpenWeather Agro API status page for service issues
5. Review server logs for detailed error information

## Integration Code Structure

```
src/
├── app/
│   └── api/
│       └── farm-data/
│           ├── weather/
│           │   └── route.ts    # Weather API integration
│           └── soil/
│               └── route.ts    # Soil API integration
├── lib/
│   └── api-client.ts           # API client utilities
└── app/
    └── dashboard/
        └── analyze/
            └── fixed-actions.ts # Business logic for data usage
```

This integration provides farmers with accurate, agriculture-specific weather and soil data to make better farming decisions. As the application matures, we plan to expand the integration to include more advanced agricultural data sources.