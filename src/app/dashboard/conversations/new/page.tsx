'use client';

import { useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bot, User, Send, ArrowLeft, Paperclip, X, Loader2, Mic, Square } from 'lucide-react';
import { useI18n } from '@/context/i18n-context';
import { askFollowUpQuestion, analyzeImage } from '@/app/dashboard/analyze/fixed-actions';
import type { ChatMessage } from '@/lib/types';
import type { AskFollowUpQuestionOutput } from '@/ai/flows/ask-follow-up-question';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

function fileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function NewConversationPage() {
    const { t, locale } = useI18n();
    const router = useRouter();
    const { toast } = useToast();
    
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [question, setQuestion] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string>(''); // Track conversation ID
    
    // Voice recording states
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize a new conversation when the component mounts
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
        
        const newId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setConversationId(newId);
        
        // Cleanup function
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [locale, t, toast]);

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

    // Store conversation in localStorage whenever chatHistory changes
    useEffect(() => {
        if (conversationId && chatHistory.length > 0) {
            try {
                const conversationsKey = 'agriassist_ai_conversations';
                const existingConversations = JSON.parse(localStorage.getItem(conversationsKey) || '[]');
                
                // Find existing conversation or create new one
                let conversation = existingConversations.find((c: any) => c.id === conversationId);
                if (!conversation) {
                    conversation = {
                        id: conversationId,
                        title: 'New Chat',
                        timestamp: new Date().toISOString(),
                        messages: []
                    };
                }
                
                // Update conversation with current chat history
                conversation.messages = chatHistory;
                conversation.lastUpdated = new Date().toISOString();
                
                // Update title based on first message if it's still the default
                if (conversation.title === 'New Chat' && chatHistory.length > 0) {
                    const firstUserMessage = chatHistory.find(msg => msg.sender === 'user');
                    if (firstUserMessage) {
                        conversation.title = firstUserMessage.text.substring(0, 50) + (firstUserMessage.text.length > 50 ? '...' : '');
                    }
                }
                
                // Update or add conversation to storage
                const updatedConversations = existingConversations.filter((c: any) => c.id !== conversationId);
                updatedConversations.unshift(conversation);
                
                // Limit to 50 conversations
                const limitedConversations = updatedConversations.slice(0, 50);
                localStorage.setItem(conversationsKey, JSON.stringify(limitedConversations));
            } catch (error) {
                console.warn('Failed to save conversation to localStorage:', error);
            }
        }
    }, [chatHistory, conversationId]);

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          const dataUri = await fileToDataUri(file);
          setImagePreview(dataUri);
        }
    };
    
    const removeImage = () => {
        setImagePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = '';
    }

    // Function to format analysis results in a structured way
    const formatAnalysisResults = (data: any) => {
        const disease = data.classification?.predictions?.[0]?.label || 'Unknown';
        const confidence = Math.round((data.classification?.predictions?.[0]?.confidence || 0) * 100);
        const severity = data.severity?.severityBand || 'Unknown';
        
        let formattedResponse = `**Disease Detected:** ${disease}\n`;
        formattedResponse += `**Confidence:** ${confidence}%\n`;
        formattedResponse += `**Severity:** ${severity}\n\n`;
        
        if (data.recommendations?.recommendations?.length > 0) {
            formattedResponse += '**Recommendations:**\n';
            data.recommendations.recommendations.forEach((rec: any, index: number) => {
                formattedResponse += `\n**${index + 1}. ${rec.title}**\n${rec.description}\n`;
            });
        } else {
            formattedResponse += '**Recommendations:**\nNo specific recommendations available.';
        }
        
        return formattedResponse;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!question.trim() && !imagePreview) return;

        const userMessage = question;
        const newHumanMessage: ChatMessage = { sender: 'user', text: userMessage };
        setChatHistory(prev => [...prev, newHumanMessage]);
        setQuestion('');
        
        // If there's an image, we trigger the full analysis flow
        if (imagePreview) {
            const attachedImage = imagePreview;
            removeImage(); // Clear image after sending
            setIsLoading(true);

            const formData = new FormData();
            formData.append('photoDataUri', attachedImage);
            if (userMessage) formData.append('textQuery', userMessage);
            formData.append('locale', locale);

            const response = await analyzeImage(formData);
            
            setIsLoading(false);
            if (response.error) {
                toast({ variant: 'destructive', title: t('Analysis Failed'), description: response.error });
                 const newAiMessage: ChatMessage = { sender: 'bot', text: response.error };
                 setChatHistory(prev => [...prev, newAiMessage]);
            } else if (response.data) {
                // For AI conversations, we should display the analysis results directly in the chat
                // Format the analysis results as a structured bot message
                const formattedResults = formatAnalysisResults(response.data);
                const newAiMessage: ChatMessage = { sender: 'bot', text: formattedResults };
                setChatHistory(prev => [...prev, newAiMessage]);
            }
            return;
        }

        // If no image, it's a simple chat follow-up
        setIsAsking(true);
        // This simulates a general knowledge answer. A real backend would need more robust context handling.
        const analysisContext = "General knowledge question."; 
        const response: AskFollowUpQuestionOutput = await askFollowUpQuestion(analysisContext, userMessage, locale);
        
        const newAiMessage: ChatMessage = { sender: 'bot', text: response.answer };
        setChatHistory(prev => [...prev, newAiMessage]);
        setIsAsking(false);
    };
    
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed shadow-sm bg-card p-12 text-center h-[500px]">
                <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                <h3 className="text-xl font-semibold font-headline">{t('Analyzing your image...')}</h3>
                <p className="text-muted-foreground">{t('This may take a moment. The AI is hard at work!')}</p>
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
                 <h1 className="text-3xl font-semibold">{t('New Chat')}</h1>
            </div>
             <Card className="flex flex-col h-[70vh]">
                <CardHeader>
                    <CardTitle>{t('AI Assistant')}</CardTitle>
                    <CardDescription>{t('Ask a question or upload an image to start an analysis.')}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto space-y-4">
                    {chatHistory.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Bot className="h-12 w-12 mb-4" />
                            <p>{t('How can I help you today?')}</p>
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
                    <form onSubmit={handleSubmit} className="flex w-full items-start gap-2">
                        <div className="flex-grow space-y-2">
                            {imagePreview && (
                                <div className="relative w-24 h-24">
                                    <Image src={imagePreview} alt="attachment preview" layout="fill" className="object-cover rounded-md border" />
                                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeImage}>
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            )}
                            <div className="flex w-full items-center gap-2">
                                <Button type="button" size="icon" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    <Paperclip className="h-5 w-5" />
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    accept="image/*"
                                    onChange={handleFileChange}
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
                                    placeholder={isSpeechSupported ? t('Ask a question or describe your image...') : t('Ask a question or describe your image...')}
                                    disabled={isAsking || isLoading}
                                />
                                <Button type="submit" size="icon" disabled={isAsking || isLoading || (!question.trim() && !imagePreview)}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}