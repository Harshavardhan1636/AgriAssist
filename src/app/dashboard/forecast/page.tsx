
'use client';

import { Cloudy, Droplets, Thermometer, Wind, AlertCircle, TestTube2, Sprout } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useI18n } from '@/context/i18n-context';
import { mockForecast, mockSoilData } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { addDays, format } from 'date-fns';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function ForecastPage() {
    const { t } = useI18n();
    const today = new Date();

    return (
        <div className="grid gap-8">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-semibold">{t('Weather Forecast & Advisory')}</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('14-Day Forecast')}</CardTitle>
                    <CardDescription>{t('Detailed weather forecast for the upcoming two weeks.')}</CardDescription>
                </CardHeader>
                <CardContent>
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
                                {mockForecast.map((day, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">
                                            <p>{format(addDays(today, index), 'EEEE')}</p>
                                            <p className="text-sm text-muted-foreground">{format(addDays(today, index), 'MMM d')}</p>
                                        </TableCell>
                                        <TableCell className='flex items-center gap-2'>
                                            <Cloudy className="h-5 w-5 text-muted-foreground" /> 
                                            {t(day.condition as any)}
                                        </TableCell>
                                        <TableCell>
                                             <div className="flex items-center gap-2">
                                                <Thermometer className="h-5 w-5 text-red-500" />
                                                <span>{`${day.temp.max}° / ${day.temp.min}°C`}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Droplets className="h-5 w-5 text-blue-500" />
                                                <span>{day.humidity}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={day.rainChance > 50 ? 'secondary' : 'outline'}>{day.rainChance}%</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>{t('Soil Data')}</CardTitle>
                    <CardDescription>{t('Current soil conditions for your farm.')}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-center justify-center text-center">
                        <Sprout className="h-8 w-8 mb-2 text-primary" />
                        <p className="text-sm font-medium text-muted-foreground">{t('Soil Type')}</p>
                        <p className="text-lg font-bold">{t(mockSoilData.type)}</p>
                    </div>
                     <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-center justify-center text-center">
                        <Droplets className="h-8 w-8 mb-2 text-blue-500" />
                        <p className="text-sm font-medium text-muted-foreground">{t('Moisture')}</p>
                        <p className="text-lg font-bold">{mockSoilData.moisture}%</p>
                    </div>
                     <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-center justify-center text-center">
                        <TestTube2 className="h-8 w-8 mb-2 text-violet-500" />
                        <p className="text-sm font-medium text-muted-foreground">{t('pH Level')}</p>
                        <p className="text-lg font-bold">{mockSoilData.ph}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-center justify-center text-center space-y-1">
                        <div className="text-sm font-medium text-muted-foreground">{t('Nutrients')}</div>
                        <div className="text-xs">N: <Badge variant={mockSoilData.nutrients.nitrogen === 'High' ? 'default' : 'secondary'}>{t(mockSoilData.nutrients.nitrogen)}</Badge></div>
                        <div className="text-xs">P: <Badge variant={mockSoilData.nutrients.phosphorus === 'High' ? 'default' : 'secondary'}>{t(mockSoilData.nutrients.phosphorus)}</Badge></div>
                        <div className="text-xs">K: <Badge variant={mockSoilData.nutrients.potassium === 'High' ? 'default' : 'secondary'}>{t(mockSoilData.nutrients.potassium)}</Badge></div>
                    </div>
                </CardContent>
            </Card>

            <Card className='bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'>
                 <CardHeader>
                    <CardTitle>{t('Crop Health Advisory')}</CardTitle>
                    <CardDescription>{t("Based on the forecast, here's what to watch out for.")}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='p-4 rounded-lg bg-background border'>
                        <h3 className='font-semibold flex items-center gap-2'><AlertCircle className='text-destructive'/>{t('High Risk: Tomato Late Blight')}</h3>
                        <p className='text-muted-foreground text-sm mt-1'>{t('The upcoming high humidity and rain are ideal conditions for Late Blight to spread rapidly. Your tomato crops are highly vulnerable over the next 5-7 days.')}</p>
                    </div>
                     <div className='p-4 rounded-lg bg-background border'>
                        <h3 className='font-semibold'>{t('General Advisory for All Crops')}</h3>
                        <p className='text-muted-foreground text-sm mt-1'>{t('Increased moisture can encourage fungal growth on all leafy vegetables. Ensure good air circulation and monitor for early signs of mildew.')}</p>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>{t('Preventive Actions to Take Now')}</CardTitle>
                    <CardDescription>{t("Proactive steps to protect your farm based on the weather forecast.")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <Wind className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                        <div>
                            <p className="font-semibold">{t('Improve Air Circulation')}</p>
                            <p className="text-sm text-muted-foreground">{t("With high humidity expected, prune lower leaves on tomato and potato plants to improve airflow and reduce leaf wetness.")}</p>
                        </div>
                      </li>
                       <li className="flex items-start gap-3">
                        <Droplets className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                        <div>
                            <p className="font-semibold">{t('Check Field Drainage')}</p>
                            <p className="text-sm text-muted-foreground">{t("Ensure your fields can handle the forecasted rain. Clear any blocked drainage channels to prevent waterlogging.")}</p>
                        </div>
                      </li>
                       <li className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                        <div>
                            <p className="font-semibold">{t('Scout for Early Symptoms')}</p>
                            <p className="text-sm text-muted-foreground">{t("Be extra vigilant in the mornings after rainfall. Look for the first signs of blight on lower leaves and stems.")}</p>
                        </div>
                      </li>
                    </ul>
                </CardContent>
            </Card>

        </div>
    );
}

    

    
