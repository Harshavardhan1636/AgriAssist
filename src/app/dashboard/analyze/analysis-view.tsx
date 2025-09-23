
'use client';

import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, X, Loader2, AlertCircle, Image as ImageIcon, FileText } from 'lucide-react';
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
  
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, locale } = useI18n();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const dataUri = await fileToDataUri(file);
      setPreview(dataUri);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    setIsPending(true);
    setError(null);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    
    try {
      const response = await analyzeImage(formData);
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setResult(response.data);
      } else {
        // This case should not happen if the server action is well-behaved
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
    <Tabs defaultValue="image" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image"><ImageIcon className="mr-2" />{t('Analyze with Image')}</TabsTrigger>
            <TabsTrigger value="text"><FileText className="mr-2"/>{t('Describe the Issue')}</TabsTrigger>
        </TabsList>
        <form onSubmit={handleSubmit}>
            <input type="hidden" name="locale" value={locale} />
            <TabsContent value="image">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Analyze with Image')}</CardTitle>
                        <CardDescription>{t('Upload an image of a plant leaf to get an AI-powered health analysis and risk assessment.')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {preview && <input type="hidden" name="photoDataUri" value={preview} />}
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
                            name="textQuery"
                            placeholder={t("e.g., 'My tomato leaves have yellow spots and brown edges.'")}
                            className="min-h-[200px]"
                        />
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
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                    {isPending ? t('Analyzing...') : t('Start Analysis')}
                </Button>
            </div>
        </form>
    </Tabs>
  );
}
