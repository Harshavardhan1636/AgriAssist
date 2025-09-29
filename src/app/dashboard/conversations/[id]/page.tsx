
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bot, User, Send, ArrowLeft, Paperclip, X } from 'lucide-react';
import { useI18n } from '@/context/i18n-context';
import { mockConversations, mockHistory } from '@/lib/mock-data';
import { askFollowUpQuestion, AskFollowUpQuestionOutput } from '@/app/dashboard/analyze/actions';
import type { Conversation, ChatMessage } from '@/lib/types';
import Link from 'next/link';

export default function ConversationPage() {
    const { t, locale } = useI18n();
    const params = useParams();
    const router = useRouter();
    const id = params.id as string; // This is the conversationId

    useEffect(() => {
        // This redirects to the unified history view which is now the canonical place for viewing past items.
        // A dedicated chat-only view can be built here if desired in the future.
        const foundAnalysis = mockHistory.find(h => h.conversationId === id);
        if (foundAnalysis) {
            router.replace(`/dashboard/history/${foundAnalysis.id}`);
        } else {
            // If there's no analysis linked (e.g., a general chat), maybe stay here?
            // For now, we redirect to the conversations list if no direct link is found.
            const existingConversation = mockConversations.find(c => c.id === id);
            if (!existingConversation) {
                 router.replace(`/dashboard/conversations`);
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
