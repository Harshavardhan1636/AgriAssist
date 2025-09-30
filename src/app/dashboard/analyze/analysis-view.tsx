'use client';

import { useState, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, X, Loader2, AlertCircle, Image as ImageIcon, FileText, Mic, Square, MapPin, Plus } from 'lucide-react';
import Image from 'next/image';
import type { FullAnalysisResponse } from '@/lib/types';
import AnalysisResults from './analysis-results';
import { useI18n } from '@/context/i18n-context';
import { analyzeImage } from './fixed-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnalysis } from '@/context/analysis-context';
import { v4 as uuidv4 } from 'uuid';
import { mockProducts } from '@/lib/mock-data';

function fileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Function to map recommendations to products
const mapRecommendationsToProducts = (recommendations: any[]): any[] => {
  // In a real implementation, this would map specific recommendations to actual products
  // For now, we'll use mock products but filter/sort based on recommendations
  
  // Extract keywords from recommendations to match with products
  const recommendationKeywords = recommendations.flatMap(rec => {
    const text = `${rec.title} ${rec.description}`.toLowerCase();
    // Extract potential product types from recommendation text
    if (text.includes('neem')) return ['neem'];
    if (text.includes('fungicide') || text.includes('blight') || text.includes('rust')) return ['fungicide'];
    if (text.includes('insecticide') || text.includes('pest')) return ['insecticide'];
    if (text.includes('bio') || text.includes('organic')) return ['organic'];
    if (text.includes('copper')) return ['copper'];
    if (text.includes('trichoderma')) return ['trichoderma'];
    return [];
  });
  
  // Filter mock products based on keywords
  if (recommendationKeywords.length > 0) {
    const filteredProducts = mockProducts.filter(product => {
      const productText = `${product.name} ${product.description} ${product.type}`.toLowerCase();
      return recommendationKeywords.some(keyword => productText.includes(keyword));
    });
    
    // If we found matching products, return them, otherwise return all mock products
    return filteredProducts.length > 0 ? filteredProducts : mockProducts;
  }
  
  // Default to all mock products if no keywords found
  return mockProducts;
};

export default function AnalysisView() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FullAnalysisResponse | null>(null);
  
  const [activeTab, setActiveTab] = useState('image');
  const [preview, setPreview] = useState<string | null>(null);
  const [textQuery, setTextQuery] = useState('');
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [location, setLocation] = useState<{ lat: string; lng: string } | null>(null);
  const [useLocation, setUseLocation] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState<string>(''); // New crop selection state
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const { isNewAnalysisRequested, resetNewAnalysisRequest } = useAnalysis();

  const { t, locale } = useI18n();
  
  // Effect to handle new analysis request from header
  useEffect(() => {
    if (isNewAnalysisRequested) {
      startNewAnalysis();
      resetNewAnalysisRequest();
    }
  }, [isNewAnalysisRequested, resetNewAnalysisRequest]);

  // Function to start a new analysis
  const startNewAnalysis = () => {
    // Clear all current analysis data
    setResult(null);
    setPreview(null);
    setTextQuery('');
    setAudioDataUri(null);
    setError(null);
    setSelectedCrop('');
    setLocation(null);
    setUseLocation(true);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Reset recording state if needed
    if (isRecording) {
      stopRecording();
    }
    
    // Reset to image tab
    setActiveTab('image');
    
    console.log('[INFO] Started new analysis');
  };

  // Function to store analysis in localStorage
  const storeAnalysisInHistory = (analysisData: FullAnalysisResponse) => {
    try {
      const historyKey = 'agriassist_analysis_history';
      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      // Generate a unique ID for the analysis
      const analysisId = uuidv4();
      
      // Extract top prediction
      const topPrediction = analysisData.classification?.predictions?.[0] || { label: 'Unknown', confidence: 0 };
      
      // Map recommendations to products
      const recommendedProducts = analysisData.recommendations?.recommendations 
        ? mapRecommendationsToProducts(analysisData.recommendations.recommendations)
        : [];
      
      // Ensure recommendedProducts is an array
      const validRecommendedProducts = Array.isArray(recommendedProducts) ? recommendedProducts : [];
      
      // Add the new analysis to the beginning of the history array
      const newHistoryItem = {
        id: analysisId,
        timestamp: new Date().toISOString(),
        disease: topPrediction.label,
        confidence: topPrediction.confidence,
        severity: analysisData.severity?.severityBand || 'Unknown',
        location: location,
        crop: selectedCrop,
        // Store the complete analysis data for detailed view
        fullData: {
          classification: analysisData.classification,
          severity: analysisData.severity,
          explanation: analysisData.explanation,
          forecast: analysisData.forecast,
          recommendations: analysisData.recommendations,
          originalImage: analysisData.originalImage,
          locale: analysisData.locale,
          conversationId: analysisData.conversationId,
          // Add the text-based analysis flag
          isTextBasedAnalysis: (analysisData as any).isTextBasedAnalysis || false
        },
        // Store a simplified version of the results for the history list
        preview: {
          disease: topPrediction.label,
          confidence: Math.round(topPrediction.confidence * 100),
          severity: analysisData.severity?.severityBand || 'Unknown',
          riskScore: Math.round((analysisData.forecast?.riskScore || 0) * 100) || 0,
        },
        // Store recommended products
        recommendedProducts: recommendedProducts
      };
      
      // Limit history to 50 items
      const updatedHistory = [newHistoryItem, ...existingHistory].slice(0, 50);
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
      
      // Also store the recommended products for the store page
      const storeProductsKey = 'agriassist_store_products';
      localStorage.setItem(storeProductsKey, JSON.stringify(validRecommendedProducts));
      
      console.log('[INFO] Analysis saved to localStorage history with recommended products');
    } catch (storageError) {
      console.warn('[WARN] Failed to save analysis to localStorage:', storageError);
    }
  };

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
    // Reset other inputs when switching tabs for a cleaner experience
    setPreview(null);
    setTextQuery('');
    setAudioDataUri(null);
    if (isRecording) {
      stopRecording();
    }
  };

  const handleLocationChange = (e: ChangeEvent<HTMLInputElement>) => {
    const [lat, lng] = e.target.value.split(',').map(coord => coord.trim());
    if (lat && lng) {
      setLocation({ lat, lng });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString()
          });
        },
        (error) => {
          setError(`Location error: ${error.message}`);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
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
            // Create a File object from the Blob
            const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
            const dataUri = await fileToDataUri(audioFile);
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
    
    let hasInput = false;

    // Append data based on the active tab
    if (activeTab === 'image' && preview) {
      formData.append('photoDataUri', preview);
      hasInput = true;
    } else if (activeTab === 'text' && textQuery) {
      formData.append('textQuery', textQuery);
      hasInput = true;
    } else if (activeTab === 'audio' && audioDataUri) {
      formData.append('audioDataUri', audioDataUri);
      hasInput = true;
    } 

    // Add location data if enabled and available
    if (useLocation && location) {
      formData.append('location', JSON.stringify(location));
    }
    
    // Add crop selection if available
    if (selectedCrop) {
      formData.append('cropType', selectedCrop);
    }

    if (!hasInput) {
        setError("Please provide an input before starting the analysis.");
        setIsPending(false);
        return;
    }
    
    try {
      const response = await analyzeImage(formData);
      if (response.error) {
        setError(t(response.error as any) || response.error);
      } else if (response.data) {
        setResult(response.data);
        
        // Store complete analysis in localStorage for history
        if (typeof window !== 'undefined' && response.data) {
          storeAnalysisInHistory(response.data);
        }
      } else {
        setError("An unexpected error occurred: received no data and no error.");
      }
    } catch (e: any) {
      setError(e.message || "An unexpected response was received from the server.");
    } finally {
      setIsPending(false);
    }
  };
  
  const isSubmitDisabled = isPending || isRecording || (activeTab === 'image' && !preview) || (activeTab === 'text' && !textQuery.trim()) || (activeTab === 'audio' && !audioDataUri);

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
    return (
      <div className="space-y-4">
        <AnalysisResults result={result} />
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10">
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
                        {/* Crop Selection */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none">
                            {t('Select Crop Type (Optional)')}
                          </label>
                          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                            <SelectTrigger>
                              <SelectValue placeholder={t("Select a crop type")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tomato">{t('Tomato')}</SelectItem>
                              <SelectItem value="rice">{t('Rice')}</SelectItem>
                              <SelectItem value="wheat">{t('Wheat')}</SelectItem>
                              <SelectItem value="maize">{t('Maize/Corn')}</SelectItem>
                              <SelectItem value="potato">{t('Potato')}</SelectItem>
                              <SelectItem value="other">{t('Other')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {t('Selecting a crop type can help improve prediction accuracy.')}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                            {preview ? (
                            <div className="relative group w-full max-w-lg mx-auto">
                                <Image
                                src={preview}
                                alt="Image preview"
                                width={600}
                                height={400}
                                sizes="(max-width: 640px) 100vw, 600px"
                                className="rounded-lg object-contain border w-full h-auto max-h-[70vh]"
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
                        
                        {/* Location Input */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="use-location"
                              checked={useLocation}
                              onChange={(e) => setUseLocation(e.target.checked)}
                            />
                            <label htmlFor="use-location" className="text-sm font-medium leading-none">
                              {t('Use my current location for real-time weather and soil data')}
                            </label>
                          </div>
                          
                          {useLocation && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={getCurrentLocation}
                                >
                                  <MapPin className="h-4 w-4 mr-2" />
                                  {t('Get Current Location')}
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                  {location ? `${location.lat}, ${location.lng}` : t('Location not set')}
                                </span>
                              </div>
                              
                              <div className="text-sm text-muted-foreground">
                                <p>{t('Or enter coordinates manually:')}</p>
                                <Input
                                  type="text"
                                  placeholder="17.3850, 78.4867"
                                  onChange={handleLocationChange}
                                  className="mt-1"
                                />
                                <p className="mt-1">{t('Format: latitude, longitude')}</p>
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
                        {/* Crop Selection */}
                        <div className="space-y-2 mb-4">
                          <label className="text-sm font-medium leading-none">
                            {t('Select Crop Type (Optional)')}
                          </label>
                          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                            <SelectTrigger>
                              <SelectValue placeholder={t("Select a crop type")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tomato">{t('Tomato')}</SelectItem>
                              <SelectItem value="rice">{t('Rice')}</SelectItem>
                              <SelectItem value="wheat">{t('Wheat')}</SelectItem>
                              <SelectItem value="maize">{t('Maize/Corn')}</SelectItem>
                              <SelectItem value="potato">{t('Potato')}</SelectItem>
                              <SelectItem value="other">{t('Other')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {t('Selecting a crop type can help improve prediction accuracy.')}
                          </p>
                        </div>
                        
                        <Textarea 
                            value={textQuery}
                            onChange={(e) => setTextQuery(e.target.value)}
                            placeholder={t("e.g., 'My tomato leaves have yellow spots and brown edges.'")}
                            className="min-h-[200px]"
                        />
                        
                        {/* Location Input */}
                        <div className="mt-4 space-y-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="use-location-text"
                              checked={useLocation}
                              onChange={(e) => setUseLocation(e.target.checked)}
                            />
                            <label htmlFor="use-location-text" className="text-sm font-medium leading-none">
                              {t('Use my current location for real-time weather and soil data')}
                            </label>
                          </div>
                          
                          {useLocation && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={getCurrentLocation}
                                >
                                  <MapPin className="h-4 w-4 mr-2" />
                                  {t('Get Current Location')}
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                  {location ? `${location.lat}, ${location.lng}` : t('Location not set')}
                                </span>
                              </div>
                              
                              <div className="text-sm text-muted-foreground">
                                <p>{t('Or enter coordinates manually:')}</p>
                                <Input
                                  type="text"
                                  placeholder="17.3850, 78.4867"
                                  onChange={handleLocationChange}
                                  className="mt-1"
                                />
                                <p className="mt-1">{t('Format: latitude, longitude')}</p>
                              </div>
                            </div>
                          )}
                        </div>
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
                        
                        {/* Crop Selection */}
                        <div className="space-y-2 w-full">
                          <label className="text-sm font-medium leading-none">
                            {t('Select Crop Type (Optional)')}
                          </label>
                          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                            <SelectTrigger>
                              <SelectValue placeholder={t("Select a crop type")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tomato">{t('Tomato')}</SelectItem>
                              <SelectItem value="rice">{t('Rice')}</SelectItem>
                              <SelectItem value="wheat">{t('Wheat')}</SelectItem>
                              <SelectItem value="maize">{t('Maize/Corn')}</SelectItem>
                              <SelectItem value="potato">{t('Potato')}</SelectItem>
                              <SelectItem value="other">{t('Other')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {t('Selecting a crop type can help improve prediction accuracy.')}
                          </p>
                        </div>
                        
                        {/* Location Input */}
                        <div className="w-full mt-4 space-y-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="use-location-audio"
                              checked={useLocation}
                              onChange={(e) => setUseLocation(e.target.checked)}
                            />
                            <label htmlFor="use-location-audio" className="text-sm font-medium leading-none">
                              {t('Use my current location for real-time weather and soil data')}
                            </label>
                          </div>
                          
                          {useLocation && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={getCurrentLocation}
                                >
                                  <MapPin className="h-4 w-4 mr-2" />
                                  {t('Get Current Location')}
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                  {location ? `${location.lat}, ${location.lng}` : t('Location not set')}
                                </span>
                              </div>
                              
                              <div className="text-sm text-muted-foreground">
                                <p>{t('Or enter coordinates manually:')}</p>
                                <Input
                                  type="text"
                                  placeholder="17.3850, 78.4867"
                                  onChange={handleLocationChange}
                                  className="mt-1"
                                />
                                <p className="mt-1">{t('Format: latitude, longitude')}</p>
                              </div>
                            </div>
                          )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <div className="py-4">
              {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('Analysis Failed')}</AlertTitle>
                    <AlertDescription>{t(error as any) || error}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitDisabled} 
                  className="w-full sm:w-auto"
                >
                    {isPending ? t('Analyzing...') : t('Start Analysis')}
                </Button>
            </div>
        </Tabs>
    </form>
  );
}