'use client';

import { useState, useRef, ChangeEvent, useActionState } from 'react';
import { analyzeImage } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import type { FullAnalysisResponse } from '@/lib/types';
import AnalysisResults from './analysis-results';

const initialState = {
  data: null,
  error: null,
};

function fileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function AnalysisView() {
  const [formState, formAction, isPending] = useActionState(analyzeImage, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  if (isPending) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card p-12 text-center h-[500px]">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <h3 className="text-xl font-semibold font-headline">Analyzing your crop...</h3>
            <p className="text-muted-foreground">This may take a moment. The AI is hard at work!</p>
        </div>
    );
  }

  if (formState.data) {
    return <AnalysisResults result={formState.data} />;
  }
  
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Analyze Crop Health</CardTitle>
        <CardDescription>Upload an image of a plant leaf to get an AI-powered health analysis and risk assessment.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
            {preview && <input type="hidden" name="photoDataUri" value={preview} />}
          <div className="space-y-2">
            <label htmlFor="file-upload" className="block text-sm font-medium text-foreground">
              Crop Image
            </label>
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
                      Upload a file
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
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            )}
          </div>
          {formState.error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Analysis Failed</AlertTitle>
                <AlertDescription>{formState.error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={!preview || isPending} className="w-full">
            {isPending ? 'Analyzing...' : 'Start Analysis'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
