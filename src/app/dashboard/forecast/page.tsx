'use client';

import { useState, useEffect } from 'react';
import { Cloudy, Droplets, Thermometer, Wind, AlertCircle, TestTube2, Sprout, MapPin, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useI18n } from '@/context/i18n-context';
import { Badge } from '@/components/ui/badge';
import { addDays, format } from 'date-fns';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Types for real-time data
interface WeatherData {
  location: string;
  forecast: Array<{
    condition: string;
    temp: { max: number; min: number };
    humidity: number;
    rainChance: number;
  }>;
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    condition: string;
    pressure: number;
    visibility: number;
  };
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
    validUntil: string;
  }>;
}

interface SoilData {
  type: 'Loam' | 'Clay' | 'Sandy' | 'Silty';
  moisture: number;
  ph: number;
  nutrients: {
    nitrogen: 'Low' | 'Medium' | 'High';
    phosphorus: 'Low' | 'Medium' | 'High';
    potassium: 'Low' | 'Medium' | 'High';
  };
  timestamp: string;
  location: {
    lat: number;
    lng: number;
  };
}

export default function ForecastPage() {
    const { t } = useI18n();
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [soilData, setSoilData] = useState<SoilData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const today = new Date();

    // Default location (could be user's location or farm location)
    const defaultLocation = {
      lat: "17.3850", // Hyderabad, India as default
      lng: "78.4867"
    };

    const fetchRealTimeData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch weather data (14 days) directly instead of using apiClient
        const weatherUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/farm-data/weather?lat=${defaultLocation.lat}&lng=${defaultLocation.lng}&days=14`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        
        if (weatherData.success && weatherData.data) {
          setWeatherData(weatherData.data);
        } else {
          throw new Error(weatherData.error || 'Failed to fetch weather data');
        }
        
        // Fetch soil data directly instead of using apiClient
        const soilUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/farm-data/soil?lat=${defaultLocation.lat}&lng=${defaultLocation.lng}`;
        const soilResponse = await fetch(soilUrl);
        const soilData = await soilResponse.json();
        
        if (soilData.success && soilData.data) {
          setSoilData(soilData.data);
        } else {
          throw new Error(soilData.error || 'Failed to fetch soil data');
        }
      } catch (err) {
        console.error('Error fetching real-time data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch real-time data');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchRealTimeData();
    }, []);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('Loading real-time data...')}</span>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('Error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    return (
        <div className="grid gap-8 min-w-0">
            <div className="flex items-center gap-4 min-w-0">
                <h1 className="text-3xl font-semibold">{t('Weather Forecast & Advisory')}</h1>
                <Button variant="outline" size="sm" onClick={fetchRealTimeData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('Refresh Data')}
                </Button>
            </div>

            {weatherData?.alerts && weatherData.alerts.length > 0 && (
              <div className="grid gap-4">
                {weatherData.alerts.map((alert, index) => (
                  <Alert key={index} variant={alert.severity === 'High' ? 'destructive' : 'default'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t(alert.type)}</AlertTitle>
                    <AlertDescription>{t(alert.message)}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5" />
                    {t('Current Conditions')}
                  </CardTitle>
                  <CardDescription>
                    {weatherData?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {weatherData.location}
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-center justify-center">
                    <Thermometer className="h-8 w-8 mb-2 text-red-500" />
                    <p className="text-sm font-medium text-muted-foreground">{t('Temperature')}</p>
                    <p className="text-lg font-bold">{weatherData?.current.temperature}°C</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-center justify-center">
                    <Droplets className="h-8 w-8 mb-2 text-blue-500" />
                    <p className="text-sm font-medium text-muted-foreground">{t('Humidity')}</p>
                    <p className="text-lg font-bold">{weatherData?.current.humidity}%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-center justify-center">
                    <Wind className="h-8 w-8 mb-2 text-gray-500" />
                    <p className="text-sm font-medium text-muted-foreground">{t('Wind Speed')}</p>
                    <p className="text-lg font-bold">{weatherData?.current.windSpeed} km/h</p>
                  </div>
                </CardContent>
              </Card>

              {soilData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sprout className="h-5 w-5" />
                      {t('Soil Data')}
                    </CardTitle>
                    <CardDescription>{t('Current soil conditions for your farm.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-center justify-center text-center">
                      <Sprout className="h-8 w-8 mb-2 text-primary" />
                      <p className="text-sm font-medium text-muted-foreground">{t('Soil Type')}</p>
                      <p className="text-lg font-bold">{t(soilData.type)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-center justify-center text-center">
                      <Droplets className="h-8 w-8 mb-2 text-blue-500" />
                      <p className="text-sm font-medium text-muted-foreground">{t('Moisture')}</p>
                      <p className="text-lg font-bold">{soilData.moisture}%</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-center justify-center text-center">
                      <TestTube2 className="h-8 w-8 mb-2 text-violet-500" />
                      <p className="text-sm font-medium text-muted-foreground">{t('pH Level')}</p>
                      <p className="text-lg font-bold">{soilData.ph}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-center justify-center text-center space-y-1">
                      <div className="text-sm font-medium text-muted-foreground">{t('Nutrients')}</div>
                      <div className="text-xs">N: <Badge variant={soilData.nutrients.nitrogen === 'High' ? 'default' : 'secondary'}>{t(soilData.nutrients.nitrogen)}</Badge></div>
                      <div className="text-xs">P: <Badge variant={soilData.nutrients.phosphorus === 'High' ? 'default' : 'secondary'}>{t(soilData.nutrients.phosphorus)}</Badge></div>
                      <div className="text-xs">K: <Badge variant={soilData.nutrients.potassium === 'High' ? 'default' : 'secondary'}>{t(soilData.nutrients.potassium)}</Badge></div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('14-Day Forecast')}</CardTitle>
                    <CardDescription>{t('Detailed weather forecast for the upcoming two weeks.')}</CardDescription>
                </CardHeader>
                <CardContent className="min-w-0">
                    <ScrollArea>
                        <Table className="whitespace-nowrap">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('Date')}</TableHead>
                                    <TableHead>{t('Condition')}</TableHead>
                                    <TableHead>{t('Temperature')}</TableHead>
                                    <TableHead>{t('Humidity')}</TableHead>
                                    <TableHead>{t('Rain Chance')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {weatherData?.forecast.map((day, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">
                                            <p>{format(addDays(today, index), 'EEEE')}</p>
                                            <p className="text-sm text-muted-foreground">{format(addDays(today, index), 'MMM d')}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Cloudy className="h-5 w-5 text-muted-foreground" />
                                                <span>{t(day.condition)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Thermometer className="h-4 w-4 text-red-500" />
                                                <span>{day.temp.max}°</span>
                                                <span className="text-muted-foreground">/</span>
                                                <span className="text-muted-foreground">{day.temp.min}°</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Droplets className="h-4 w-4 text-blue-500" />
                                                <span>{day.humidity}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Cloudy className="h-4 w-4 text-gray-500" />
                                                <span>{day.rainChance}%</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}