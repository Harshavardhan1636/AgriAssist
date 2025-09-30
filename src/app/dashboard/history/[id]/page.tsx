'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useI18n } from '@/context/i18n-context';
import type { FullAnalysisResponse } from '@/lib/types';
import AnalysisResults from '@/app/dashboard/analyze/analysis-results';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function CaseDetailPage() {
    const { t } = useI18n();
    const params = useParams();
    const id = params.id as string;
    
    const [fullResponse, setFullResponse] = useState<FullAnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [analysis, setAnalysis] = useState<any>(null);

    useEffect(() => {
        // First, try to find the analysis in localStorage
        try {
            const historyKey = 'agriassist_analysis_history';
            const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            const foundAnalysis = history.find((h: any) => h.id === id);
            
            if (foundAnalysis) {
                setAnalysis(foundAnalysis);
                // Use the complete stored data for the AnalysisResults component
                if (foundAnalysis.fullData) {
                    setFullResponse(foundAnalysis.fullData);
                } else {
                    // Fallback for older data format
                    const assembledResponse = assembleFullAnalysisResponse(foundAnalysis);
                    setFullResponse(assembledResponse);
                }
            } else {
                console.error("Analysis not found in localStorage");
                // Try to find in sessionStorage as fallback
                const sessionHistory = JSON.parse(sessionStorage.getItem(historyKey) || '[]');
                const sessionAnalysis = sessionHistory.find((h: any) => h.id === id);
                if (sessionAnalysis) {
                    setAnalysis(sessionAnalysis);
                    if (sessionAnalysis.fullData) {
                        setFullResponse(sessionAnalysis.fullData);
                    } else {
                        const assembledResponse = assembleFullAnalysisResponse(sessionAnalysis);
                        setFullResponse(assembledResponse);
                    }
                }
            }
        } catch (error) {
            console.error("Error loading analysis:", error);
        }
        setIsLoading(false);
    }, [id]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-8 w-1/2" />
                </div>
                 <Skeleton className="h-48 w-full" />
                 <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="md:col-span-3 space-y-6">
                        <Skeleton className="h-96 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                    <div className="md:col-span-2 space-y-6">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (!fullResponse || !analysis) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('Analysis not found')}</CardTitle>
                        <p className="text-muted-foreground mt-2">
                            {t('The requested analysis could not be found. It may have been deleted or the link is invalid.')}
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/dashboard/history">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {t('Back to History')}
                            </Link>
                        </Button>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                 <Button asChild size="icon" variant="outline">
                    <Link href="/dashboard/history">
                        <ArrowLeft />
                    </Link>
                 </Button>
                 <h1 className="text-2xl lg:text-3xl font-semibold">
                    {t('Case Details for')} {analysis?.disease || 'Unknown Disease'}
                 </h1>
            </div>
            
            <AnalysisResults result={fullResponse} />
        </div>
    );
}

// This is a helper function to assemble the full response object
// that the AnalysisResults component expects.
const assembleFullAnalysisResponse = (analysis: any): FullAnalysisResponse | null => {
    if (!analysis) return null;

    // If we have full data stored, use it directly
    if (analysis.fullData) {
        return analysis.fullData;
    }

    // Fallback to assembling from individual fields for older data format
    return {
        classification: { 
            predictions: [
                { label: analysis.disease || 'Unknown Disease', confidence: analysis.confidence || 0 },
                // Add some mock predictions if needed for UI
            ] 
        },
        severity: {
            severityPercentage: analysis.preview?.severityPercentage || 0,
            severityBand: analysis.severity || 'Unknown',
            confidence: analysis.confidence || 0,
        },
        explanation: { gradCAMOverlay: analysis.fullData?.explanation?.gradCAMOverlay || '' },
        forecast: {
            riskScore: (analysis.preview?.riskScore || 0) / 100,
            explanation: 'Risk assessment based on environmental factors and disease patterns.',
            preventiveActions: [
                'Monitor plants regularly for early signs of disease',
                'Maintain proper spacing between plants for air circulation',
                'Apply appropriate fungicides as recommended'
            ],
        },
        recommendations: {
            recommendations: [
                { 
                    step: 1, 
                    title: 'Immediate Action', 
                    description: 'Remove and destroy infected plant parts to prevent spread.', 
                    type: 'Preventive' 
                },
                { 
                    step: 2, 
                    title: 'Treatment', 
                    description: 'Apply appropriate fungicides as recommended for this disease.', 
                    type: 'Chemical' 
                },
                { 
                    step: 3, 
                    title: 'Prevention', 
                    description: 'Implement crop rotation and use disease-resistant varieties.', 
                    type: 'Organic/Cultural' 
                }
            ]
        },
        originalImage: analysis.fullData?.originalImage || '',
        locale: analysis.fullData?.locale || 'en',
        conversationId: analysis.fullData?.conversationId || analysis.id || 'unknown',
        // Add the text-based analysis flag if it exists
        isTextBasedAnalysis: analysis.fullData?.isTextBasedAnalysis || false
    };
}