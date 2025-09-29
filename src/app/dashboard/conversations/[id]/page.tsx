
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bot, User, Send, ArrowLeft, Paperclip, X } from 'lucide-react';
import { useI18n } from '@/context/i18n-context';
import { mockConversations } from '@/lib/mock-data';
import { askFollowUpQuestion, AskFollowUpQuestionOutput } from '@/app/dashboard/analyze/actions';
import type { Conversation, ChatMessage } from '@/lib/types';
import Link from 'next/link';

export default function ConversationPage() {
    const { t, locale } = useI18n();
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [question, setQuestion] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    
    useEffect(() => {
        // This redirects to the unified history view which is now the canonical place for viewing past items.
        // A dedicated chat-only view can be built here if desired in the future.
        if (id) {
            const relatedAnalysis = mockConversations.find(c => c.id === id)?.analysisId;
            if(relatedAnalysis) {
                router.replace(`/dashboard/history/${relatedAnalysis}`);
            }
        }
    }, [id, router]);

    const foundConversation = mockConversations.find(c => c.id === id) || null;

    if (!foundConversation) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('Conversation not found')}</CardTitle>
                        <CardDescription>{t("We couldn't find the chat you're looking for.")}</CardDescription>
                    </CardHeader>
                     <CardFooter>
                        <Button asChild variant="outline">
                            <Link href="/dashboard/conversations">
                                <ArrowLeft className="mr-2 h-4 w-4"/>
                                {t('Back to Conversations')}
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // The content below is now effectively hidden by the redirect, but kept for potential future use
    // if a standalone chat view is desired again.
    return null;
}
