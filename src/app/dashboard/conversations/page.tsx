
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/context/i18n-context';
import { mockConversations } from '@/lib/mock-data';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function ConversationsPage() {
    const { t } = useI18n();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredConversations = mockConversations.filter(convo => 
        t(convo.title as any).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="grid gap-8">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-semibold">{t('AI Conversations')}</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('Chat History')}</CardTitle>
                    <CardDescription>{t('Review and continue your past conversations with the AI assistant.')}</CardDescription>
                     <div className="relative pt-4">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder={t('Search by title...')} 
                            className="pl-8 w-full max-w-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredConversations.length > 0 ? filteredConversations.map(convo => {
                            const lastMessage = convo.messages[convo.messages.length - 1];
                            return (
                             <Link href={`/dashboard/conversations/${convo.id}`} key={convo.id} className="block">
                                <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-3">
                                            <MessageSquare className="h-5 w-5 text-primary mt-1 flex-shrink-0"/>
                                            <div>
                                                <p className="font-semibold">{t(convo.title as any)}</p>
                                                 <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                    <span className='font-medium'>{lastMessage.sender === 'bot' ? 'AI' : t('You')}:</span> {t(lastMessage.text as any)}
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 ml-8">
                                        {t('Last message')}: {formatDistanceToNow(new Date(convo.lastMessageTimestamp), { addSuffix: true })}
                                    </p>
                                </div>
                            </Link>
                        )}) : (
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
