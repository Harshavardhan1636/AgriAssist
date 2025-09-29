
'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useI18n } from '@/context/i18n-context';
import { mockHistory, mockConversations } from '@/lib/mock-data';
import type { FullAnalysisResponse, Conversation, AnalysisResult } from '@/lib/types';
import AnalysisResults from '@/app/dashboard/analyze/analysis-results';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

// This is a helper function to assemble the full response object
// that the AnalysisResults component expects. In a real app, you'd fetch this complete object from the DB.
const assembleFullAnalysisResponse = (analysis: AnalysisResult): FullAnalysisResponse | null => {
    if (!analysis) return null;

    // This is a simplified reconstruction.
    return {
        classification: { predictions: analysis.predictions },
        severity: {
            severityPercentage: analysis.severity.percentage,
            severityBand: analysis.severity.band,
            confidence: analysis.predictions[0].confidence, // Use top prediction confidence
        },
        explanation: { gradCAMOverlay: analysis.gradCamImage },
        forecast: {
            riskScore: analysis.risk.score,
            explanation: analysis.risk.explanation,
            // Mocking these as they are not in the brief history object. A real backend would provide them.
            preventiveActions: ['Monitor crop daily', 'Ensure good drainage', 'Improve air circulation'], 
        },
        recommendations: {
            // Mocking recommendations. A real backend would provide these based on the analysis.
            recommendations: [
                { step: 1, title: 'Monitor and Remove Infected Leaves', description: 'Regularly check plants and remove any leaves showing signs of the disease to reduce spread.', type: 'Organic/Cultural' },
                { step: 2, title: 'Apply Organic Fungicide', description: 'Use a copper-based or neem oil fungicide as a preventive measure, especially before rain is forecasted.', type: 'Organic/Cultural' },
            ]
        },
        originalImage: analysis.image,
        locale: 'en', // This should come from i18n context or be stored with the analysis
        conversationId: analysis.conversationId
    };
}


export default function CaseDetailPage() {
    const { t } = useI18n();
    const params = useParams();
    const id = params.id as string;
    
    const [fullResponse, setFullResponse] = useState<FullAnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // In a real app, you'd fetch the full analysis and conversation from your backend using the ID.
        // Here, we find the data from our mock files.
        const foundAnalysis = mockHistory.find(h => h.id === id || h.conversationId === id);
        
        if (foundAnalysis) {
            const assembledResponse = assembleFullAnalysisResponse(foundAnalysis);
            setFullResponse(assembledResponse);
        } else {
             // In a real app, this would trigger a 404.
            console.error("Analysis not found");
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
    
    if (!fullResponse) {
        // Use Next.js notFound() in a real app to render the 404 page
        // notFound(); 
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('Case not found')}</CardTitle>
                    </CardHeader>
                </Card>
            </div>
        );
    }
    
    const analysis = mockHistory.find(h => h.id === id || h.conversationId === id);

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                 <Button asChild size="icon" variant="outline">
                    <Link href="/dashboard/history">
                        <ArrowLeft />
                    </Link>
                 </Button>
                 <h1 className="text-2xl lg:text-3xl font-semibold">{t('Case Details for')} {analysis?.crop} - {t(analysis?.predictions[0].label as any)}</h1>
            </div>
            
            <AnalysisResults result={fullResponse} />
        </div>
    );
}
