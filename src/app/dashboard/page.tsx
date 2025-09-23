
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
  Droplets
} from "lucide-react";

import { mockHistory, mockForecast } from "@/lib/mock-data";
import { formatDistanceToNow, format, addDays } from "date-fns";
import { useI18n } from "@/context/i18n-context";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";


const DetectionsChart = dynamic(() => import('./detections-chart'), { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />
});


const chartData = [
  { day: "Mon", detections: 5 },
  { day: "Tue", detections: 8 },
  { day: "Wed", detections: 12 },
  { day: "Thu", detections: 7 },
  { day: "Fri", detections: 15 },
  { day: "Sat", detections: 11 },
  { day: "Sun", detections: 9 },
];

export default function DashboardPage() {
  const recentAnalyses = mockHistory.slice(0, 5);
  const { t } = useI18n();
  const today = new Date();

  return (
    <div className="flex flex-col gap-6">

       <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('High-Risk Alert: Tomato Late Blight')}</AlertTitle>
          <AlertDescription>
            {t("High humidity forecasted. Your tomato crops are at immediate risk. Review preventive actions now.")}
          </AlertDescription>
       </Alert>
       
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Total Scans')}</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,254</div>
            <p className="text-xs text-muted-foreground">{t('+20.1% from last month')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('High-Risk Alerts')}</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-muted-foreground">{t('+12 since last week')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Pending Reviews')}</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockHistory.filter(h => h.status === 'Pending Review').length}</div>
            <p className="text-xs text-muted-foreground">{t('2 new today')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Weekly Detections')}</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chartData.reduce((acc, cur) => acc + cur.detections, 0)}</div>
            <p className="text-xs text-muted-foreground">{t('Total for this week')}</p>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
            <div className='flex justify-between items-center'>
                <div>
                    <CardTitle>{t('14-Day Forecast')}</CardTitle>
                    <CardDescription>{t('Minimal weather forecast for the upcoming two weeks.')}</CardDescription>
                </div>
                 <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/forecast">{t('View Detailed Forecast')}</Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <ScrollArea>
              <div className="flex space-x-6 pb-4">
                {mockForecast.map((day, index) => (
                  <div key={index} className="flex flex-col items-center min-w-[80px] p-2 rounded-lg bg-muted/50">
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
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </CardContent>
       </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>{t('Detections This Week')}</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="overflow-x-auto">
              <DetectionsChart />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>{t('Recent Analyses')}</CardTitle>
              <CardDescription>{t('Recent disease and pest analyses from your farm.')}</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/history">
                {t('View All')}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Crop')}</TableHead>
                  <TableHead>{t('Diagnosis')}</TableHead>
                  <TableHead className="text-right">{t('Time')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAnalyses.map((analysis) => (
                  <TableRow key={analysis.id}>
                    <TableCell>
                      <div className="font-medium">{t(analysis.crop as any)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={analysis.predictions[0].label === 'Healthy' ? "secondary" : "destructive"} className="text-xs" >
                        {t(analysis.predictions[0].label as any)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(analysis.timestamp), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    