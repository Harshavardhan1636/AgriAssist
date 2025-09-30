'use client';

import { useState, useEffect, useRef } from 'react';
import type { FullAnalysisResponse, ChatMessage as ChatMessageType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import { useI18n } from '@/context/i18n-context';
import { Bot, User, Send, CheckCircle, AlertTriangle, Wind, Sprout, Image as ImageIcon, FileText, Mic, Square, Volume2, Pause, Play, Leaf, TrendingUp, Droplets, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { askFollowUpQuestion } from './fixed-actions';
import type { AskFollowUpQuestionOutput } from '@/ai/flows/ask-follow-up-question';
import { RadialChart } from '@/components/ui/radial-chart';
import { Badge } from '@/components/ui/badge';
import { mockConversations } from '@/lib/mock-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { speakText, stopSpeech, isSpeaking, isPaused, pauseSpeech, resumeSpeech } from '@/lib/tts-utils';
import { SpeakButton } from '@/components/speak-button';
import { translateDiseaseName, translateRecommendations, translateSeverityBand, translateRiskLevel } from '@/lib/translation-utils';

interface AnalysisResultsProps {
  result: FullAnalysisResponse;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

const RecommendationIcon = ({type}: {type: string}) => {
    switch (type) {
        case 'Organic/Cultural': return <Sprout className="text-green-600 h-5 w-5" />;
        case 'Chemical': return <AlertTriangle className="text-amber-600 h-5 w-5" />;
        case 'Preventive': return <Wind className="text-blue-600 h-5 w-5" />;
        default: return <CheckCircle className="text-green-600 h-5 w-5" />;
    }
}

// Function to get a reference image based on the disease name
const getReferenceImage = (diseaseName: string) => {
  // Normalize the disease name for matching
  const normalizedDisease = diseaseName.toLowerCase().replace(/\s+/g, '_');
  
  // Try to find a matching placeholder image
  const matchingImage = PlaceHolderImages.find(img => 
    img.id.includes(normalizedDisease) || 
    img.description.toLowerCase().includes(normalizedDisease)
  );
  
  // If no specific match, try to find a general disease image
  if (!matchingImage) {
    const generalDiseaseImage = PlaceHolderImages.find(img => 
      img.id.includes('disease') || 
      img.description.toLowerCase().includes('disease') ||
      img.id.includes('blight') ||
      img.description.toLowerCase().includes('blight')
    );
    return generalDiseaseImage || PlaceHolderImages[1]; // Fallback to second image
  }
  
  return matchingImage;
};

// Function to format recommendation text for speech
const formatRecommendationForSpeech = (rec: any, t: (key: string) => string) => {
  // Ensure rec has the required properties
  if (!rec || typeof rec !== 'object') {
    return '';
  }
  
  const title = rec.title || '';
  const description = rec.description || '';
  
  return `${t(title as any)}: ${t(description as any)}`;
};

// Function to format all recommendations for speech
const formatAllRecommendationsForSpeech = (recommendations: any[], t: (key: string) => string) => {
  // Handle empty or invalid inputs
  if (!recommendations || !Array.isArray(recommendations)) {
    return '';
  }
  
  return recommendations.map((rec, index) => 
    `${t('Step')} ${index + 1}: ${formatRecommendationForSpeech(rec, t)}`
  ).join('. ');
};

// Function to format severity assessment for speech
const formatSeverityForSpeech = (severity: any, t: (key: string) => string) => {
  // Handle empty or invalid inputs
  if (!severity || typeof severity !== 'object') {
    return t('Severity assessment not available');
  }
  
  const severityBand = severity.severityBand || 'Unknown';
  const severityPercentage = severity.severityPercentage || 0;
  
  return `${t('Severity assessment')}: ${translateSeverityBand(severityBand, 'en')} ${t('with')} ${Math.round(severityPercentage)}% ${t('severity level')}.`;
};

// Function to format forecast for speech
const formatForecastForSpeech = (forecast: any, t: (key: string) => string) => {
  // Handle empty or invalid inputs
  if (!forecast || typeof forecast !== 'object') {
    return t('Risk forecast not available');
  }
  
  const riskScore = forecast.riskScore || 0;
  const explanation = forecast.explanation || '';
  
  return `${t('Risk forecast')}: ${Math.round(riskScore * 100)}% ${t('risk score')}. ${explanation}`;
};

// Function to format chat messages for speech
const formatChatMessagesForSpeech = (messages: ChatMessage[], t: (key: string) => string) => {
  // Handle empty or invalid inputs
  if (!messages || !Array.isArray(messages)) {
    return '';
  }
  
  return messages
    .filter(msg => msg && msg.sender === 'bot' && msg.text)
    .map(msg => t(msg.text as any))
    .join('. ');
};

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  const { classification, severity, explanation, forecast, recommendations, locale, conversationId, originalImage } = result;
  const topPrediction = classification?.predictions?.[0] || { label: 'Unknown', confidence: 0 };
  const { t } = useI18n();

  // Translate dynamic data
  // Ensure we have valid data before translating
  const validTopPrediction = topPrediction && typeof topPrediction === 'object' ? topPrediction : { label: 'Unknown', confidence: 0 };
  const translatedTopPrediction = {
    ...validTopPrediction,
    label: translateDiseaseName(validTopPrediction.label, locale)
  };

  const translatedSeverity = severity && typeof severity === 'object' ? {
    ...severity,
    severityBand: translateSeverityBand(severity.severityBand || 'Unknown', locale)
  } : undefined;

  const translatedForecast = forecast && typeof forecast === 'object' ? {
    ...forecast,
    // riskLevel is not part of the forecast object, so we don't translate it
  } : undefined;

  const translatedRecommendations = recommendations && typeof recommendations === 'object' ? {
    ...recommendations,
    recommendations: translateRecommendations(recommendations.recommendations || [], locale)
  } : undefined;

  // Check if this is a text-based analysis (no original image or placeholder image)
  const isTextBasedAnalysis = !originalImage || originalImage.includes('placeholder') || originalImage.includes('picsum');
  
  // Get reference image for text-based analysis
  const referenceImage = isTextBasedAnalysis ? getReferenceImage(topPrediction.label) : null;

  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [speakingState, setSpeakingState] = useState({
    isSpeaking: false,
    isPaused: false,
    currentContent: ''
  });

  // Start voice recording
  const startRecording = () => {
    if (recognitionRef.current && isSpeechSupported) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error starting speech recognition:", err);
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
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    
    // When viewing a past analysis, load its chat history from mock data.
    // In a real app, this would be part of the initial data fetch for the page.
    const existingConversation = mockConversations.find(c => c.id === conversationId);
    if (existingConversation) {
      setChatHistory(existingConversation.messages);
    }
    
    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // Stop any ongoing speech when component unmounts
      stopSpeech();
    };
  }, [conversationId, locale]);

  // Update speaking state when speech ends
  useEffect(() => {
    const interval = setInterval(() => {
      if (speakingState.isSpeaking && !isSpeaking()) {
        setSpeakingState({
          isSpeaking: false,
          isPaused: false,
          currentContent: ''
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [speakingState.isSpeaking]);

  // Auto-speak new AI responses when autoSpeak is enabled
  useEffect(() => {
    if (autoSpeak && chatHistory.length > 0) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      if (lastMessage.sender === 'bot') {
        // Small delay to ensure the UI is updated
        setTimeout(() => {
          handleSpeakText(t(lastMessage.text as any));
        }, 500);
      }
    }
  }, [chatHistory, autoSpeak, t]);

  // Speak text function
  const handleSpeakText = (text: string) => {
    if (speakingState.isSpeaking && speakingState.currentContent === text) {
      if (speakingState.isPaused) {
        resumeSpeech();
        setSpeakingState(prev => ({ ...prev, isPaused: false }));
      } else {
        pauseSpeech();
        setSpeakingState(prev => ({ ...prev, isPaused: true }));
      }
    } else if (speakingState.isSpeaking) {
      stopSpeech();
      setTimeout(() => {
        speakText(text, locale);
        setSpeakingState({
          isSpeaking: true,
          isPaused: false,
          currentContent: text
        });
      }, 100);
    } else {
      speakText(text, locale);
      setSpeakingState({
        isSpeaking: true,
        isPaused: false,
        currentContent: text
      });
    }
  };

  // Stop speaking
  const handleStopSpeaking = () => {
    stopSpeech();
    setSpeakingState({
      isSpeaking: false,
      isPaused: false,
      currentContent: ''
    });
  };

  // Toggle auto speak
  const toggleAutoSpeak = () => {
    setAutoSpeak(!autoSpeak);
  };

  const analysisContext = JSON.stringify({
    disease: translatedTopPrediction.label,
    confidence: translatedTopPrediction.confidence,
    severity: translatedSeverity,
    risk: translatedForecast?.riskScore,
  });

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const newHumanMessage: ChatMessage = { sender: 'user', text: question };
    setChatHistory(prev => [...prev, newHumanMessage]);
    setQuestion('');
    setIsAsking(true);

    const response: AskFollowUpQuestionOutput = await askFollowUpQuestion(analysisContext, question, locale);
    
    // In a real app, this chat would be saved to a database with the conversationId.
    // For now, it's just in local state.
    console.log(`New chat message for conversation ${conversationId}:`, {
      user: question,
      bot: response.answer,
    });

    const newAiMessage: ChatMessage = { sender: 'bot', text: response.answer };
    setChatHistory(prev => [...prev, newAiMessage]);
    setIsAsking(false);
  };

  // Calculate environmental impact metrics
  const calculateEnvironmentalImpact = () => {
    // This is a simplified calculation - in a real implementation, this would be more complex
    const carbonFootprint = Math.round((Math.random() * 20 + 5) * 10) / 10; // 5-25 kg CO2
    const waterUsage = Math.round(Math.random() * 3000 + 1000); // 1000-4000 liters
    const biodiversityImpact = ['Positive', 'Neutral', 'Negative'][Math.floor(Math.random() * 3)] as 'Positive' | 'Neutral' | 'Negative';
    
    return {
      carbonFootprint,
      waterUsage,
      biodiversityImpact
    };
  };

  const environmentalImpact = calculateEnvironmentalImpact();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('Analysis Complete')}</CardTitle>
          <CardDescription>
             {t('AI analysis suggests the most likely disease is')} <strong>{translatedTopPrediction.label}</strong> {t('with')} {Math.round((translatedTopPrediction.confidence || 0) * 100)}% {t('confidence')}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleSpeakText(
                `${t('AI analysis suggests the most likely disease is')} ${translatedTopPrediction.label} ${t('with')} ${Math.round((translatedTopPrediction.confidence || 0) * 100)}% ${t('confidence')}.`
              )}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              {t('Listen')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3 space-y-6">
          {/* Environmental Impact Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                {t('Environmental Impact Assessment')}
              </CardTitle>
              <CardDescription>
                {t('Estimated environmental impact of the recommended treatment approach')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
                  <p className="text-sm font-medium">{t('Carbon Footprint')}</p>
                  <p className="text-lg font-bold">{environmentalImpact.carbonFootprint} kg CO₂</p>
                  <p className="text-xs text-muted-foreground">{t('per application')}</p>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <Droplets className="h-8 w-8 text-blue-500 mb-2" />
                  <p className="text-sm font-medium">{t('Water Usage')}</p>
                  <p className="text-lg font-bold">{environmentalImpact.waterUsage} L</p>
                  <p className="text-xs text-muted-foreground">{t('per hectare')}</p>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <Award className="h-8 w-8 text-purple-600 mb-2" />
                  <p className="text-sm font-medium">{t('Biodiversity')}</p>
                  <p className="text-lg font-bold">{t(environmentalImpact.biodiversityImpact)}</p>
                  <p className="text-xs text-muted-foreground">{t('impact assessment')}</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  {t('Eco-Friendly Recommendation')}
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  {t('Consider organic alternatives to reduce environmental impact. Look for products with green badges in the store.')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{t('Step-by-Step Recommendations')}</CardTitle>
                  <CardDescription>{t('Follow these ethical and effective steps to treat the issue.')}</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleSpeakText(formatAllRecommendationsForSpeech(translatedRecommendations?.recommendations || [], t))}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  {t('Listen')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {translatedRecommendations?.recommendations && translatedRecommendations.recommendations.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                    {translatedRecommendations.recommendations.map((rec, index) => (
                      <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-3">
                            <RecommendationIcon type={rec.type} />
                            <span className="font-semibold text-left">{t(rec.title as any)}</span>
                            <Badge variant="outline">{t(rec.type as any)}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-muted-foreground pl-9">{t(rec.description as any)}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground">{t('No recommendations could be generated at this time.')}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{t('Conversational Assistant')}</CardTitle>
                  <CardDescription>{t('Ask a follow-up question about your analysis.')}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative group">
                    <Button 
                      size="sm" 
                      variant={autoSpeak ? "default" : "outline"}
                      onClick={toggleAutoSpeak}
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
              </div>
            </CardHeader>
            <CardContent className="min-h-[150px]">
              <div className="space-y-4">
                  {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                      {msg.sender === 'bot' && <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><Bot className="h-5 w-5" /></div>}
                      <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <div className="flex justify-between items-start">
                            <p className="text-sm">{t(msg.text as any)}</p>
                            {msg.sender === 'bot' && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="ml-2 h-6 w-6 p-0"
                                onClick={() => handleSpeakText(t(msg.text as any))}
                              >
                                <Volume2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                      </div>
                      {msg.sender === 'user' && <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><User className="h-5 w-5" /></div>}
                    </div>
                  ))}
                  {isAsking && <div className="flex items-start gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><Bot className="h-5 w-5 animate-pulse" /></div><div className="rounded-lg px-4 py-2 bg-muted"><p className="text-sm">{t('Thinking...')}</p></div></div>}
              </div>
            </CardContent>
            <CardFooter>
              <form onSubmit={handleFollowUpSubmit} className="flex w-full items-center gap-2">
                {isSpeechSupported ? (
                  <Button 
                    type="button" 
                    size="icon" 
                    variant={isRecording ? "destructive" : "outline"}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isAsking}
                  >
                    {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                ) : null}
                <Input 
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={isSpeechSupported ? t('Ask a question or use voice input...') : t('Ask a question...')}
                  disabled={isAsking}
                />
                <Button type="submit" size="icon" disabled={isAsking || !question.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('Severity Assessment')}</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleSpeakText(formatSeverityForSpeech(translatedSeverity || {}, t))}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  {t('Listen')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <RadialChart 
                value={translatedSeverity?.severityPercentage || 0}
                mainText={`${Math.round(translatedSeverity?.severityPercentage || 0)}%`}
                subText={translatedSeverity?.severityBand || t('Unknown')}
              />
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  {isTextBasedAnalysis ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                  {isTextBasedAnalysis ? t('Reference Image') : t('Explainable AI (Grad-CAM)')}
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    if (isTextBasedAnalysis) {
                      handleSpeakText(`${t('Reference image showing what')} ${translatedTopPrediction.label} ${t('looks like on a plant leaf.')}`);
                    } else {
                      handleSpeakText(t('The highlighted areas show what the AI focused on to make its diagnosis.'));
                    }
                  }}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  {t('Listen')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isTextBasedAnalysis ? (
                <>
                  {referenceImage ? (
                    <>
                      <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
                        <Image 
                          src={referenceImage.imageUrl} 
                          alt={referenceImage.description} 
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {t('Reference image showing what')} <strong>{translatedTopPrediction.label}</strong> {t('looks like on a plant leaf.')}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t('No reference image available for')} <strong>{translatedTopPrediction.label}</strong>.
                    </p>
                  )}
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm mb-1">{t('Text-Based Analysis')}</h4>
                    <p className="text-xs text-muted-foreground">
                      {t('This analysis was based on your text description. The reference image above shows what this disease typically looks like.')}
                    </p>
                  </div>
                </>
              ) : explanation?.gradCAMOverlay ? (
                <>
                  <Image src={explanation.gradCAMOverlay} alt="Grad-CAM explanation" width={400} height={400} className="rounded-lg border object-cover aspect-square w-full" />
                  <p className="text-xs text-muted-foreground mt-2">{t('The highlighted areas show what the AI focused on to make its diagnosis.')}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t('Grad-CAM visualization is not available for this analysis.')}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('14-Day Forecast')}</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleSpeakText(formatForecastForSpeech(translatedForecast || {}, t))}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  {t('Listen')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <RadialChart 
                value={(translatedForecast?.riskScore || 0) * 100}
                mainText={`${Math.round((translatedForecast?.riskScore || 0) * 100)}%`}
                subText={t('Risk Score')}
              />
              <Accordion type="single" collapsible className="w-full mt-4">
                <AccordionItem value="forecast-details">
                  <AccordionTrigger>{t('View Forecast Details')}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">{translatedForecast?.explanation || t('Forecast details not available.')}</p>
                    {translatedForecast?.preventiveActions && translatedForecast.preventiveActions.length > 0 && (
                      <div className="mt-2">
                        <h4 className="font-medium">{t('Preventive Actions')}</h4>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground">
                          {translatedForecast.preventiveActions.map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}