
'use client';

import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bot, User, Send, ArrowLeft, Paperclip, X, Loader2 } from 'lucide-react';
import { useI18n } from '@/context/i18n-context';
import { askFollowUpQuestion, AskFollowUpQuestionOutput, analyzeImage } from '@/app/dashboard/analyze/actions';
import type { ChatMessage, FullAnalysisResponse } from '@/lib/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import AnalysisResults from '@/app/dashboard/analyze/analysis-results';

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
    const [analysisResult, setAnalysisResult] = useState<FullAnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            } else if (response.data) {
                setAnalysisResult(response.data);
                // Redirect to the new unified case history page which will show both analysis and chat.
                router.push(`/dashboard/history/${response.data.conversationId}`);
            }
            return;
        }

        // If no image, it's a simple chat follow-up (without context for now)
        setIsAsking(true);
        // This simulates a general knowledge answer. A real backend would handle this better.
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
    
    if (analysisResult) {
        return <AnalysisResults result={analysisResult} />;
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
                                <Input 
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder={t('Ask a question or describe your image...')}
                                    disabled={isAsking || isLoading}
                                />
                                <Button type="submit" size="icon" disabled={isAsking || isLoading}>
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
