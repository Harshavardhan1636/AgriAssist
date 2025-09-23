
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/context/i18n-context';
import { mockConversations } from '@/lib/mock-data';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ConversationsPage() {
    const { t } = useI18n();

    return (
        <div className="grid gap-8">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-semibold">{t('AI Conversations')}</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('Chat History')}</CardTitle>
                    <CardDescription>{t('Review and continue your past conversations with the AI assistant.')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {mockConversations.length > 0 ? mockConversations.map(convo => (
                             <Link href={`/dashboard/conversations/${convo.id}`} key={convo.id} className="block">
                                <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <MessageSquare className="h-5 w-5 text-primary"/>
                                            <p className="font-semibold">{t(convo.title as any)}</p>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2 ml-8">
                                        {t('Last message')}: {formatDistanceToNow(new Date(convo.lastMessageTimestamp), { addSuffix: true })}
                                    </p>
                                </div>
                            </Link>
                        )) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4"/>
                                <p>{t('No conversations yet.')}</p>
                                <p>{t('Start a new analysis to begin a chat.')}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
