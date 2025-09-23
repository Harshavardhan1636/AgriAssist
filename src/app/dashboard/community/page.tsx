
'use client';

import { AlertTriangle, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { communityOutbreaks } from '@/lib/mock-data';
import { useI18n } from '@/context/i18n-context';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const CommunityMap = dynamic(() => import('./community-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
});

export default function CommunityPage() {
    const { t } = useI18n();

    const getRiskVariant = (risk: 'High' | 'Medium' | 'Low') => {
        switch (risk) {
            case 'High': return 'destructive';
            case 'Medium': return 'secondary';
            case 'Low': return 'outline';
        }
    };

    return (
        <div className="grid gap-8">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-semibold">{t('Community Outbreaks')}</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{t('Regional Outbreak Map')}</CardTitle>
                    <CardDescription>{t('Live map of reported disease outbreaks in the region.')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <CommunityMap outbreaks={communityOutbreaks} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('Active Outbreak Alerts')}</CardTitle>
                    <CardDescription>{t("List of active alerts based on community-reported data.")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Disease')}</TableHead>
                                <TableHead>{t('Location')}</TableHead>
                                <TableHead>{t('Risk Level')}</TableHead>
                                <TableHead>{t('Detected Cases')}</TableHead>
                                <TableHead>{t('First Reported')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {communityOutbreaks.map(outbreak => (
                                <TableRow key={outbreak.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-destructive" />
                                        {outbreak.disease}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            {outbreak.location}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getRiskVariant(outbreak.riskLevel)}>
                                            {t(outbreak.riskLevel)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{outbreak.detectedCases}</TableCell>
                                    <TableCell>{format(new Date(outbreak.firstReported), 'PPP')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
