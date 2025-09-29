
'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useI18n } from '@/context/i18n-context';
import { mockHistory, mockConversations } from '@/lib/mock-data';
import type { FullAnalysisResponse, Conversation, AnalysisResult } from '@/lib/types';
import AnalysisResults from '@/app/dashboard/analyze/analysis-results';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// This is a helper function to assemble the full response object
// that the AnalysisResults component expects.
const assembleFullAnalysisResponse = (analysis: AnalysisResult, conversation: Conversation | undefined): FullAnalysisResponse | null => {
    if (!analysis) return null;

    // This is a simplified reconstruction. In a real app, you'd likely fetch this complete object from the DB.
    return {
        classification: { predictions: analysis.predictions },
        severity: {
            severityPercentage: analysis.severity.percentage,
            severityBand: analysis.severity.band,
            confidence: 0.95 // Mock confidence for display
        },
        explanation: { gradCAMOverlay: analysis.gradCamImage },
        forecast: {
            riskScore: analysis.risk.score,
            explanation: analysis.risk.explanation,
            preventiveActions: ['Monitor crop daily', 'Ensure good drainage'] // Mock actions
        },
        recommendations: {
            // Mock recommendations as this is not stored in the brief history object
            recommendations: [
                { step: 1, title: 'Monitor and Remove Infected Leaves', description: 'Regularly check plants and remove any leaves showing signs of blight to reduce spread.', type: 'Organic/Cultural' },
                { step: 2, title: 'Apply Organic Fungicide', description: 'Use a copper-based or neem oil fungicide as a preventive measure, especially before rain.', type: 'Organic/Cultural' },
            ]
        },
        originalImage: analysis.image,
        locale: 'en', // This should come from i18n context
        conversationId: analysis.conversationId
    };
}


export default function CaseDetailPage() {
    const { t, locale } = useI18n();
    const params = useParams();
    const id = params.id as string;
    
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [fullResponse, setFullResponse] = useState<FullAnalysisResponse | null>(null);

    useEffect(() => {
        // In a real app, you'd fetch the full analysis and conversation from your backend using the ID.
        const foundAnalysis = mockHistory.find(h => h.id === id);
        if (!foundAnalysis) {
            // notFound(); // Use this in production
            return;
        }
        
        const foundConversation = mockConversations.find(c => c.id === foundAnalysis.conversationId);
        
        setAnalysis(foundAnalysis);
        if(foundConversation) setConversation(foundConversation);

        // We need to reconstruct the `FullAnalysisResponse` object for the results component
        const assembledResponse = assembleFullAnalysisResponse(foundAnalysis, foundConversation || undefined);
        setFullResponse(assembledResponse);

    }, [id]);

    if (!analysis || !fullResponse) {
        // You can return a loading skeleton here
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('Loading Case...')}</CardTitle>
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
                 <h1 className="text-3xl font-semibold">{t('Case Details for')} {analysis.crop} - {t(analysis.predictions[0].label as any)}</h1>
            </div>
            
            <AnalysisResults result={fullResponse} />
        </div>
    );
}
