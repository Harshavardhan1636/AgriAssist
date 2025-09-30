'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/context/i18n-context';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ArrowRight, Search, PlusCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';

export default function ConversationsPage() {
    const { t } = useI18n();
    const [searchTerm, setSearchTerm] = useState('');
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDemoData, setIsDemoData] = useState(false);
    const { isDemoUser } = useAuth(); // Get demo user status

    useEffect(() => {
        fetchConversations();
    }, [isDemoUser]);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            // For demo users, we can still use localStorage as a fallback
            // For real users, we would fetch from the API
            if (isDemoUser) {
                // Load AI conversations from localStorage for demo users
                try {
                    const conversationsKey = 'agriassist_ai_conversations';
                    const storedConversations = JSON.parse(localStorage.getItem(conversationsKey) || '[]');
                    setConversations(storedConversations);
                    setIsDemoData(true);
                } catch (error) {
                    console.error("Error loading conversations from localStorage:", error);
                    setConversations([]);
                }
            } else {
                // For real users, fetch from API
                const response = await fetch('/api/conversations');
                const data = await response.json();
                
                if (data.success) {
                    setConversations(data.data.conversations);
                    setIsDemoData(data.data.isDemoData || false);
                } else {
                    // Fallback to localStorage if API fails
                    try {
                        const conversationsKey = 'agriassist_ai_conversations';
                        const storedConversations = JSON.parse(localStorage.getItem(conversationsKey) || '[]');
                        setConversations(storedConversations);
                        setIsDemoData(true);
                    } catch (error) {
                        console.error("Error loading conversations from localStorage:", error);
                        setConversations([]);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching conversations:", error);
            // Fallback to localStorage
            try {
                const conversationsKey = 'agriassist_ai_conversations';
                const storedConversations = JSON.parse(localStorage.getItem(conversationsKey) || '[]');
                setConversations(storedConversations);
                setIsDemoData(true);
            } catch (error) {
                console.error("Error loading conversations from localStorage:", error);
                setConversations([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredConversations = conversations.filter(convo => 
        convo.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const deleteConversation = (id: string) => {
        const updatedConversations = conversations.filter(convo => convo.id !== id);
        setConversations(updatedConversations);
        
        if (isDemoUser) {
            // For demo users, update localStorage
            try {
                const conversationsKey = 'agriassist_ai_conversations';
                localStorage.setItem(conversationsKey, JSON.stringify(updatedConversations));
            } catch (error) {
                console.error("Error updating conversations in localStorage:", error);
            }
        } else {
            // For real users, we would make an API call to delete from database
            // This is a placeholder for real implementation
            console.log("Would delete conversation from database for real user");
        }
    };

    if (loading) {
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
                        <CardDescription>{t('Loading your conversations...')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 animate-spin"/>
                            <p>{t('Loading conversations...')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{t('AI Chats')}</CardTitle>
                            <CardDescription>
                                {t('Review and continue your past conversations with the AI assistant.')}
                                {isDemoData && (
                                    <span className="block mt-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                                        {t('Demo Mode: Using sample data. Sign in to use real data.')}
                                    </span>
                                )}
                            </CardDescription>
                        </div>
                    </div>
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
                                <div key={convo.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <Link href={`/dashboard/conversations/${convo.id}`} className="flex-1">
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
                                        </Link>
                                        <Button size="sm" variant="destructive" onClick={() => deleteConversation(convo.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
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