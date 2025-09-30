'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  ClipboardCheck,
  FlaskConical,
  ShieldAlert,
  ArrowUpRight,
  AlertTriangle,
  Cloudy,
  Thermometer,
  Droplets,
  Upload,
  FileText,
  Mic
} from "lucide-react";

import { mockForecast } from "@/lib/mock-data";
import { formatDistanceToNow, format, addDays } from "date-fns";
import { useI18n } from "@/context/i18n-context";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";

const DetectionsChart = dynamic(() => import('./detections-chart'), { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />
});

export default function DashboardPage() {
  const { t } = useI18n();
  const today = new Date();
  const minimalForecast = mockForecast.slice(0, 7);
  
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([
    { day: "Sun", detections: 0 },
    { day: "Mon", detections: 0 },
    { day: "Tue", detections: 0 },
    { day: "Wed", detections: 0 },
    { day: "Thu", detections: 0 },
    { day: "Fri", detections: 0 },
    { day: "Sat", detections: 0 },
  ]);

  useEffect(() => {
    // Load real data from localStorage
    try {
      const historyKey = 'agriassist_analysis_history';
      const storedHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      setAnalysisHistory(storedHistory);
      
      // Calculate weekly detections data based on real data
      const detectionsByDay = Array(7).fill(0);
      const todayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      storedHistory.forEach((analysis: any) => {
        const analysisDate = new Date(analysis.timestamp);
        const analysisDayIndex = analysisDate.getDay();
        const daysAgo = (todayIndex - analysisDayIndex + 7) % 7;
        
        // Only count analyses from the current week
        if (daysAgo < 7) {
          detectionsByDay[analysisDayIndex] += 1;
        }
      });
      
      // Update chart data with real values
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const updatedChartData = days.map((day, index) => ({
        day: day.substring(0, 3), // First 3 letters of day name
        detections: detectionsByDay[index]
      }));
      
      setChartData(updatedChartData);
    } catch (error) {
      console.error("Error loading analysis history:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate statistics from real data
  const totalScans = analysisHistory.length;
  const highRiskAlerts = analysisHistory.filter((analysis: any) => 
    analysis.severity === 'High' || (analysis.preview?.riskScore || 0) > 70
  ).length;
  const pendingReviews = analysisHistory.filter((analysis: any) => 
    analysis.status === 'Pending Review'
  ).length;
  const weeklyDetections = chartData.reduce((sum, day) => sum + day.detections, 0);
  const recentAnalyses = analysisHistory.slice(0, 5);

  return (
    <div className="flex flex-col gap-6 min-w-0">

       <Alert className="animate-blink-alert border-0">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('High-Risk Alert: Tomato Late Blight')}</AlertTitle>
          <AlertDescription>
            <span>
              {t("High humidity forecasted. Your tomato crops are at immediate risk. Review preventive actions now.")}
            </span>
          </AlertDescription>
       </Alert>
       
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">{t('Total Scans')}</CardTitle>
              <p className="text-xs text-muted-foreground">{t('+20.1% from last month')}</p>
            </div>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-6 w-16" /> : totalScans.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">{t('High-Risk Alerts')}</CardTitle>
              <p className="text-xs text-muted-foreground">{t('+12 since last week')}</p>
            </div>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-6 w-8" /> : highRiskAlerts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">{t('Pending Reviews')}</CardTitle>
              <p className="text-xs text-muted-foreground">{t('2 new today')}</p>
            </div>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-6 w-8" /> : pendingReviews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">{t('Weekly Detections')}</CardTitle>
              <p className="text-xs text-muted-foreground">{t('Total for this week')}</p>
            </div>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-6 w-8" /> : weeklyDetections}</div>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                <div>
                    <CardTitle className="flex items-center gap-2">
                      {t('7-Day Forecast')}
                    </CardTitle>
                    <CardDescription>{t('Minimal weather forecast for the upcoming week.')}</CardDescription>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/forecast">{t('View Detailed Forecast')}</Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {minimalForecast.map((day, index) => (
                  <div key={index} className="flex flex-col items-center p-2 rounded-lg bg-muted/50 text-center">
                    <p className="font-semibold text-sm">{format(addDays(today, index), 'EEE')}</p>
                    <Cloudy className="h-8 w-8 my-2 text-muted-foreground" />
                    <p className="font-bold text-lg">{day.temp.max}°</p>
                     <div className="flex items-center gap-1 text-xs text-blue-500">
                        <Droplets className="h-3 w-3" />
                        <span>{day.humidity}%</span>
                    </div>
                  </div>
                ))}
            </div>
        </CardContent>
       </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('Detections This Week')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="overflow-x-auto">
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <DetectionsChart chartData={chartData} />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>{t('Recent Analyses')}</CardTitle>
              <CardDescription>{t('Recent disease and pest analyses from your farm.')}</CardDescription>
            </div>
            <div className="flex gap-2 ml-auto">
              <Button asChild size="sm" className="gap-1">
                <Link href="/dashboard/history">
                  {t('View All')}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Crop')}</TableHead>
                    <TableHead>{t('Diagnosis')}</TableHead>
                    <TableHead className="text-right">{t('Time')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAnalyses.length > 0 ? (
                    recentAnalyses.map((analysis) => (
                      <TableRow key={analysis.id}>
                        <TableCell>
                          <div className="font-medium">{analysis.crop || 'Unknown'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={(analysis.disease && analysis.disease !== 'Healthy') ? "destructive" : "secondary"} className="text-xs" >
                            {analysis.disease || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">
                          {analysis.timestamp ? formatDistanceToNow(new Date(analysis.timestamp), {
                            addSuffix: true,
                          }) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        {t('No analysis history found.')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}