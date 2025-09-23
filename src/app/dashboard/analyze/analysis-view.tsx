
'use client';

import { useState, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, X, Loader2, AlertCircle, Image as ImageIcon, FileText, Mic, Square } from 'lucide-react';
import Image from 'next/image';
import type { FullAnalysisResponse } from '@/lib/types';
import AnalysisResults from './analysis-results';
import { useI18n } from '@/context/i18n-context';
import { analyzeImage } from './actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

function fileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function AnalysisView() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FullAnalysisResponse | null>(null);
  
  const [activeTab, setActiveTab] = useState('image');
  const [preview, setPreview] = useState<string | null>(null);
  const [textQuery, setTextQuery] = useState('');
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { t, locale } = useI18n();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const dataUri = await fileToDataUri(file);
      setPreview(dataUri);
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError(null);
    setPreview(null);
    setTextQuery('');
    setAudioDataUri(null);
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            const dataUri = await fileToDataUri(audioBlob);
            setAudioDataUri(dataUri);
            stream.getTracks().forEach(track => track.stop()); // Stop microphone
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Error accessing microphone:", err);
        setError("Microphone access denied. Please enable it in your browser settings.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };
  
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('locale', locale);

    if (activeTab === 'image' && preview) {
      formData.append('photoDataUri', preview);
    } else if (activeTab === 'text' && textQuery) {
      formData.append('textQuery', textQuery);
    } else if (activeTab === 'audio' && audioDataUri) {
      formData.append('audioDataUri', audioDataUri);
    } else {
        setError("Please provide an input before starting the analysis.");
        setIsPending(false);
        return;
    }
    
    try {
      const response = await analyzeImage(formData);
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setResult(response.data);
      } else {
        setError("An unexpected error occurred: received no data and no error.");
      }
    } catch (e: any) {
      setError(e.message || "An unexpected response was received from the server.");
    } finally {
      setIsPending(false);
    }
  };

  if (isPending) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed shadow-sm bg-card p-12 text-center h-[500px]">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <h3 className="text-xl font-semibold font-headline">{t('Analyzing your crop...')}</h3>
            <p className="text-muted-foreground">{t('This may take a moment. The AI is hard at work!')}</p>
        </div>
    );
  }

  if (result) {
    return <AnalysisResults result={result} />;
  }
  
  return (
    <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="image"><ImageIcon className="mr-2 h-4 w-4" />{t('Analyze with Image')}</TabsTrigger>
                <TabsTrigger value="text"><FileText className="mr-2 h-4 w-4"/>{t('Describe the Issue')}</TabsTrigger>
                <TabsTrigger value="audio"><Mic className="mr-2 h-4 w-4"/>{t('Record Audio')}</TabsTrigger>
            </TabsList>

            <TabsContent value="image">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Analyze with Image')}</CardTitle>
                        <CardDescription>{t('Upload an image of a plant leaf to get an AI-powered health analysis and risk assessment.')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            {preview ? (
                            <div className="relative group w-full max-w-lg mx-auto">
                                <Image
                                src={preview}
                                alt="Image preview"
                                width={600}
                                height={400}
                                className="rounded-lg object-contain border"
                                />
                                <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity"
                                onClick={handleRemoveImage}
                                >
                                <X className="h-4 w-4" />
                                </Button>
                            </div>
                            ) : (
                            <div
                                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="space-y-1 text-center">
                                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                <div className="flex text-sm text-muted-foreground">
                                    <span className="relative rounded-md font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                                    {t('Upload a file')}
                                    </span>
                                    <input
                                    ref={fileInputRef}
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    />
                                    <p className="pl-1">{t('or drag and drop')}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">{t('PNG, JPG, GIF up to 10MB')}</p>
                                </div>
                            </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="text">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('Describe the Issue')}</CardTitle>
                        <CardDescription>{t("Describe the symptoms you're seeing in your own words.")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea 
                            value={textQuery}
                            onChange={(e) => setTextQuery(e.target.value)}
                            placeholder={t("e.g., 'My tomato leaves have yellow spots and brown edges.'")}
                            className="min-h-[200px]"
                        />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="audio">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('Record Audio Query')}</CardTitle>
                        <CardDescription>{t("Record your question or observation in your local language.")}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center space-y-4 min-h-[200px]">
                        {!isRecording ? (
                            <Button type="button" size="lg" onClick={startRecording} disabled={isRecording}>
                                <Mic className="mr-2"/>
                                {t('Start Recording')}
                            </Button>
                        ) : (
                             <Button type="button" size="lg" variant="destructive" onClick={stopRecording} disabled={!isRecording}>
                                <Square className="mr-2"/>
                                {t('Stop Recording')}
                            </Button>
                        )}
                        {audioDataUri && (
                            <div className="w-full">
                                <p className="text-sm text-center text-muted-foreground mb-2">{t('Recording complete. Ready for analysis.')}</p>
                                <audio src={audioDataUri} controls className="w-full" />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            
            <div className="py-4">
              {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('Analysis Failed')}</AlertTitle>
                    <AlertDescription>{t(error) || error}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isPending || isRecording || (activeTab === 'image' && !preview) || (activeTab === 'text' && !textQuery) || (activeTab === 'audio' && !audioDataUri)} 
                  className="w-full sm:w-auto"
                >
                    {isPending ? t('Analyzing...') : t('Start Analysis')}
                </Button>
            </div>
        </Tabs>
    </form>
  );
}
