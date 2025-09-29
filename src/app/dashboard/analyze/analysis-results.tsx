
'use client';

import { useState, useEffect } from 'react';
import type { FullAnalysisResponse, ChatMessage as ChatMessageType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import { useI18n } from '@/context/i18n-context';
import { Bot, User, Send, CheckCircle, AlertTriangle, Wind, Sprout } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { askFollowUpQuestion } from './actions';
import type { AskFollowUpQuestionOutput } from './actions';
import { RadialChart } from '@/components/ui/radial-chart';
import { Badge } from '@/components/ui/badge';
import { mockConversations } from '@/lib/mock-data';


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


export default function AnalysisResults({ result }: AnalysisResultsProps) {
  const { classification, severity, explanation, forecast, recommendations, locale, conversationId } = result;
  const topPrediction = classification.predictions[0];
  const { t } = useI18n();

  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    // When viewing a past analysis, load its chat history from mock data.
    // In a real app, this would be part of the initial data fetch for the page.
    const existingConversation = mockConversations.find(c => c.id === conversationId);
    if (existingConversation) {
      setChatHistory(existingConversation.messages);
    }
  }, [conversationId]);


  const analysisContext = JSON.stringify({
    disease: topPrediction.label,
    confidence: topPrediction.confidence,
    severity: severity,
    risk: forecast.riskScore,
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('Analysis Complete')}</CardTitle>
          <CardDescription>
             {t('AI analysis suggests the most likely disease is')} <strong>{t(topPrediction.label as any)}</strong> {t('with')} {Math.round(topPrediction.confidence * 100)}% {t('confidence')}.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3 space-y-6">
           <Card>
            <CardHeader>
              <CardTitle>{t('Step-by-Step Recommendations')}</CardTitle>
              <CardDescription>{t('Follow these ethical and effective steps to treat the issue.')}</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations?.recommendations?.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                    {recommendations.recommendations.map((rec, index) => (
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
              <CardTitle>{t('Conversational Assistant')}</CardTitle>
              <CardDescription>{t('Ask a follow-up question about your analysis.')}</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[150px]">
              <div className="space-y-4">
                  {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                      {msg.sender === 'bot' && <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><Bot className="h-5 w-5" /></div>}
                      <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <p className="text-sm">{t(msg.text as any)}</p>
                      </div>
                      {msg.sender === 'user' && <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><User className="h-5 w-5" /></div>}
                    </div>
                  ))}
                  {isAsking && <div className="flex items-start gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><Bot className="h-5 w-5 animate-pulse" /></div><div className="rounded-lg px-4 py-2 bg-muted"><p className="text-sm">{t('Thinking...')}</p></div></div>}
              </div>
            </CardContent>
            <CardFooter>
                 <form onSubmit={handleFollowUpSubmit} className="flex w-full items-center gap-2">
                    <Input 
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder={t('Ask a question...')}
                      disabled={isAsking}
                    />
                    <Button type="submit" size="icon" disabled={isAsking}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('Severity Assessment')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <RadialChart 
                value={severity.severityPercentage}
                mainText={`${Math.round(severity.severityPercentage)}%`}
                subText={t(severity.severityBand as 'Low' | 'Medium' | 'High')}
              />
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle>{t('Explainable AI (Grad-CAM)')}</CardTitle>
            </CardHeader>
            <CardContent>
                <Image src={explanation.gradCAMOverlay} alt="Grad-CAM explanation" width={400} height={400} className="rounded-lg border object-cover aspect-square w-full" />
                <p className="text-xs text-muted-foreground mt-2">{t('The highlighted areas show what the AI focused on to make its diagnosis.')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('14-Day Forecast')}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadialChart 
                value={forecast.riskScore * 100}
                mainText={`${Math.round(forecast.riskScore * 100)}%`}
                subText={t('Risk Score')}
              />
              <Accordion type="single" collapsible className="w-full mt-4">
                <AccordionItem value="item-1">
                  <AccordionTrigger>{t('Why this score?')}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm">{t(forecast.explanation as any)}</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>{t('Preventive Actions')}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-sm">
                      {forecast?.preventiveActions?.length > 0 ? forecast.preventiveActions.map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Wind className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                          <span>{t(action as any)}</span>
                        </li>
                      )) : (
                        <li>{t('No preventive actions available.')}</li>
                      )}
                    </ul>
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
