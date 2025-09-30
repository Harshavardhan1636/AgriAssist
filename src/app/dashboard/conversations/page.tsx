'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/context/i18n-context';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ArrowRight, Search, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ConversationsPage() {
    const { t } = useI18n();
    const [searchTerm, setSearchTerm] = useState('');
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load AI conversations from localStorage (separate from analysis history)
        try {
            const conversationsKey = 'agriassist_ai_conversations';
            const storedConversations = JSON.parse(localStorage.getItem(conversationsKey) || '[]');
            setConversations(storedConversations);
        } catch (error) {
            console.error("Error loading conversations from localStorage:", error);
            setConversations([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const filteredConversations = conversations.filter(convo => 
        convo.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="grid gap-8">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-semibold">{t('AI Conversations')}</h1>
                <Button asChild>
                    <Link href="/dashboard/conversations/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('New Chat')}
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('AI Chats')}</CardTitle>
                    <CardDescription>{t('Review and continue your past conversations with the AI assistant.')}</CardDescription>
                     <div className="relative pt-4">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder={t('Search chats...')} 
                            className="pl-8 w-full max-w-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 animate-spin"/>
                            <p>{t('Loading conversations...')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredConversations.length > 0 ? filteredConversations.map(convo => (
                                <Link href={`/dashboard/conversations/${convo.id}`} key={convo.id} className="block">
                                    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-3">
                                                <MessageSquare className="h-5 w-5 text-primary mt-1 flex-shrink-0"/>
                                                <div>
                                                    <p className="font-semibold">{t(convo.title as any)}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {t('Last message')}: {convo.lastUpdated 
                                                            ? formatDistanceToNow(new Date(convo.lastUpdated), { addSuffix: true })
                                                            : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                        </div>
                                    </div>
                                </Link>
                            )) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-4"/>
                                    <p>{t('No conversations yet.')}</p>
                                    <p>{t('Start a new chat to begin a conversation.')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}