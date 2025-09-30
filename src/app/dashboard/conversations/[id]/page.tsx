'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useI18n } from '@/context/i18n-context';
import type { ChatMessage } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bot, User, Send, ArrowLeft, Paperclip, X, Mic, Square, Volume2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { speakText, stopSpeech } from '@/lib/tts-utils';
import { useAuth } from '@/context/auth-context';

export default function ConversationDetailPage() {
    const { t, locale } = useI18n();
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { isDemoUser } = useAuth(); // Get demo user status
    
    const id = params.id as string;
    
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [question, setQuestion] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const [conversation, setConversation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [autoSpeak, setAutoSpeak] = useState(false);
    const [isDemoData, setIsDemoData] = useState(false);
    
    // Voice recording states
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);

    useEffect(() => {
        // Check if speech recognition is supported
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            setIsSpeechSupported(true);
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = locale || 'en-US';
            
            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setQuestion(transcript);
                setIsRecording(false);
            };
            
            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsRecording(false);
                toast({
                    variant: 'destructive',
                    title: t('Speech Recognition Error'),
                    description: t('There was an error with speech recognition. Please try again.')
                });
            };
            
            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
        
        // Load conversation based on user type
        loadConversation();
        
        // Cleanup function
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            // Stop any ongoing speech when component unmounts
            stopSpeech();
        };
    }, [id, t, toast, locale, isDemoUser]);

    const loadConversation = async () => {
        setIsLoading(true);
        try {
            if (isDemoUser) {
                // Load conversation from localStorage for demo users
                try {
                    const conversationsKey = 'agriassist_ai_conversations';
                    const storedConversations = JSON.parse(localStorage.getItem(conversationsKey) || '[]');
                    const foundConversation = storedConversations.find((c: any) => c.id === id);
                    
                    if (foundConversation) {
                        setConversation(foundConversation);
                        setChatHistory(foundConversation.messages || []);
                        setIsDemoData(true);
                    } else {
                        console.error("Conversation not found in localStorage");
                    }
                } catch (error) {
                    console.error("Error loading conversation from localStorage:", error);
                }
            } else {
                // For real users, we would fetch from API
                // This is a placeholder for real implementation
                try {
                    const conversationsKey = 'agriassist_ai_conversations';
                    const storedConversations = JSON.parse(localStorage.getItem(conversationsKey) || '[]');
                    const foundConversation = storedConversations.find((c: any) => c.id === id);
                    
                    if (foundConversation) {
                        setConversation(foundConversation);
                        setChatHistory(foundConversation.messages || []);
                        setIsDemoData(false);
                    } else {
                        console.error("Conversation not found");
                    }
                } catch (error) {
                    console.error("Error loading conversation:", error);
                }
            }
        } catch (error) {
            console.error("Error loading conversation:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-speak new AI responses when autoSpeak is enabled
    useEffect(() => {
        if (autoSpeak && chatHistory.length > 0) {
            const lastMessage = chatHistory[chatHistory.length - 1];
            if (lastMessage.sender === 'bot') {
                // Small delay to ensure the UI is updated
                setTimeout(() => {
                    speakText(lastMessage.text, locale);
                }, 500);
            }
        }
    }, [chatHistory, autoSpeak, locale]);

    // Update conversation based on user type whenever chatHistory changes
    useEffect(() => {
        if (id && chatHistory.length > 0 && conversation) {
            if (isDemoUser) {
                // For demo users, update localStorage
                try {
                    const conversationsKey = 'agriassist_ai_conversations';
                    const existingConversations = JSON.parse(localStorage.getItem(conversationsKey) || '[]');
                    
                    // Update the specific conversation
                    const updatedConversations = existingConversations.map((c: any) => {
                        if (c.id === id) {
                            return {
                                ...c,
                                messages: chatHistory,
                                lastUpdated: new Date().toISOString()
                            };
                        }
                        return c;
                    });
                    
                    localStorage.setItem(conversationsKey, JSON.stringify(updatedConversations));
                } catch (error) {
                    console.warn('Failed to update conversation in localStorage:', error);
                }
            } else {
                // For real users, we would make an API call to update the database
                // This is a placeholder for real implementation
                console.log("Would update conversation in database for real user");
            }
        }
    }, [chatHistory, id, conversation, isDemoUser]);

    // Start voice recording
    const startRecording = () => {
        if (recognitionRef.current && isSpeechSupported) {
            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Error starting speech recognition:", err);
                toast({
                    variant: 'destructive',
                    title: t('Microphone Access Error'),
                    description: t('Failed to access microphone. Please check your browser settings.')
                });
            }
        }
    };

    // Stop voice recording
    const stopRecording = () => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;

        const userMessage: ChatMessage = { sender: 'user', text: question };
        setChatHistory(prev => [...prev, userMessage]);
        setQuestion('');
        
        setIsAsking(true);
        
        // Simulate AI response (in a real app, this would call an API)
        setTimeout(() => {
            const aiResponse: ChatMessage = { 
                sender: 'bot', 
                text: `This is a simulated response to your question: "${question}". In a real application, this would be generated by an AI model.` 
            };
            setChatHistory(prev => [...prev, aiResponse]);
            setIsAsking(false);
        }, 1000);
    };

    const deleteConversation = () => {
        if (isDemoUser) {
            // For demo users, delete from localStorage
            try {
                const conversationsKey = 'agriassist_ai_conversations';
                const existingConversations = JSON.parse(localStorage.getItem(conversationsKey) || '[]');
                
                // Filter out the current conversation
                const updatedConversations = existingConversations.filter((c: any) => c.id !== id);
                
                localStorage.setItem(conversationsKey, JSON.stringify(updatedConversations));
                
                // Navigate back to conversations list
                router.push('/dashboard/conversations');
                
                toast({
                    title: t('Conversation Deleted'),
                    description: t('The conversation has been successfully deleted.')
                });
            } catch (error) {
                console.error("Error deleting conversation from localStorage:", error);
                toast({
                    variant: 'destructive',
                    title: t('Deletion Failed'),
                    description: t('Failed to delete the conversation. Please try again.')
                });
            }
        } else {
            // For real users, we would make an API call to delete from database
            // This is a placeholder for real implementation
            toast({
                title: t('Demo Mode'),
                description: t('In a real implementation, this conversation would be deleted from the database.')
            });
            router.push('/dashboard/conversations');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">{t('Loading conversation...')}</p>
            </div>
        );
    }
    
    if (!conversation) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Conversation not found')}</CardTitle>
                        <CardDescription>
                            {t('The requested conversation could not be found.')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/dashboard/conversations">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {t('Back to Conversations')}
                            </Link>
                        </Button>
                    </CardContent>
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
                 <h1 className="text-3xl font-semibold">{t(conversation.title || 'AI Conversation')}</h1>
                 <Button size="icon" variant="destructive" onClick={deleteConversation}>
                    <Trash2 className="h-5 w-5" />
                 </Button>
            </div>
             <Card className="flex flex-col h-[70vh]">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>{t('AI Assistant')}</CardTitle>
                            <CardDescription>
                                {t('Continue your conversation with the AI assistant.')}
                                {isDemoData && (
                                    <span className="block mt-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                                        {t('Demo Mode: Using sample data. Sign in to use real data.')}
                                    </span>
                                )}
                            </CardDescription>
                        </div>
                        <div className="relative group">
                            <Button 
                                size="sm" 
                                variant={autoSpeak ? "default" : "outline"}
                                onClick={() => setAutoSpeak(!autoSpeak)}
                                className="flex items-center gap-2"
                            >
                                <Volume2 className="h-4 w-4" />
                                {t('Auto')}
                            </Button>
                            <div className="absolute right-0 mt-1 w-32 p-2 bg-black text-white text-xs rounded-md shadow-lg z-10 hidden group-hover:block">
                                {autoSpeak ? t('Auto Speak On') : t('Auto Speak Off')}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto space-y-4">
                    {chatHistory.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Bot className="h-12 w-12 mb-4" />
                            <p>{t('No messages yet. Start the conversation!')}</p>
                        </div>
                    )}
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'bot' && <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><Bot className="h-5 w-5" /></div>}
                            <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                {msg.sender === 'bot' ? (
                                    <div className="text-sm whitespace-pre-wrap">
                                        {msg.text.split('\n').map((line, i) => (
                                            <p key={i} className={line.startsWith('**') ? 'font-bold mt-2' : line.startsWith('*') ? 'ml-4' : ''}>
                                                {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                                            </p>
                                        ))}
                                        <div className="flex justify-end mt-2">
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="h-6 w-6 p-0"
                                                onClick={() => speakText(msg.text, locale)}
                                            >
                                                <Volume2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm">{t(msg.text as any)}</p>
                                )}
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
                <CardFooter className="border-t pt-4">
                    <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
                        <Button type="button" size="icon" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <input
                            id="file-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                        />
                        {isSpeechSupported ? (
                            <Button 
                                type="button" 
                                size="icon" 
                                variant={isRecording ? "destructive" : "outline"}
                                onClick={isRecording ? stopRecording : startRecording}
                            >
                                {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            </Button>
                        ) : null}
                        <Input 
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder={isSpeechSupported ? t('Type your message or use voice input...') : t('Type your message...')}
                            disabled={isAsking}
                        />
                        <Button type="submit" size="icon" disabled={isAsking || (!question.trim())}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}