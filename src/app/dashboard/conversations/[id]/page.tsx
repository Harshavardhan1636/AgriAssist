
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bot, User, Send, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/context/i18n-context';
import { mockConversations } from '@/lib/mock-data';
import { askFollowUpQuestion, AskFollowUpQuestionOutput } from '@/app/dashboard/analyze/actions';
import type { Conversation, ChatMessage } from '@/lib/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function ConversationPage() {
    const { t, locale } = useI18n();
    const params = useParams();
    const id = params.id as string;

    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [question, setQuestion] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    
    useEffect(() => {
        // In a real app, you'd fetch this from a database.
        const foundConversation = mockConversations.find(c => c.id === id) || null;
        if (!foundConversation) {
            // notFound();
            return;
        }
        setConversation(foundConversation);
    }, [id]);

    const handleFollowUpSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !conversation) return;

        const newHumanMessage: ChatMessage = { sender: 'user', text: question };
        setConversation(prev => prev ? { ...prev, messages: [...prev.messages, newHumanMessage] } : null);
        setQuestion('');
        setIsAsking(true);

        const response: AskFollowUpQuestionOutput = await askFollowUpQuestion(conversation.analysisContext, question, locale);
        
        const newAiMessage: ChatMessage = { sender: 'bot', text: response.answer };
        setConversation(prev => prev ? { ...prev, messages: [...prev.messages, newAiMessage] } : null);
        setIsAsking(false);
    };

    if (!conversation) {
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

    return (
        <div className="mx-auto grid w-full max-w-3xl gap-2">
            <div className="flex items-center gap-4 mb-4">
                 <Button asChild size="icon" variant="outline">
                    <Link href="/dashboard/conversations">
                        <ArrowLeft />
                    </Link>
                 </Button>
                 <h1 className="text-3xl font-semibold">{t(conversation.title as any)}</h1>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>{t('Chat History')}</CardTitle>
                    <CardDescription>{t('Continue your conversation with the AI assistant.')}</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[400px] space-y-4">
                    {conversation.messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'bot' && <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><Bot className="h-5 w-5" /></div>}
                            <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <p className="text-sm">{t(msg.text as any)}</p>
                            </div>
                            {msg.sender === 'user' && <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><User className="h-5 w-5" /></div>}
                        </div>
                    ))}
                    {isAsking && (
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><Bot className="h-5 w-5 animate-pulse" /></div>
                            <div className="rounded-lg px-4 py-2 bg-muted"><p className="text-sm">{t('Thinking...')}</p></div>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <form onSubmit={handleFollowUpSubmit} className="flex w-full items-center gap-2">
                        <Input 
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder={t('Ask a follow-up question...')}
                        disabled={isAsking}
                        />
                        <Button type="submit" size="icon" disabled={isAsking}>
                        <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}
