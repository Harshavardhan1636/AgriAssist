
'use client';

import { useState } from 'react';
import type { FullAnalysisResponse } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import { useI18n } from '@/context/i18n-context';
import { Bot, User, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { askFollowUpQuestion } from './actions';
import type { AskFollowUpQuestionOutput } from './actions';
import { RadialChart } from '@/components/ui/radial-chart';


interface AnalysisResultsProps {
  result: FullAnalysisResponse;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  const { classification, severity, explanation, forecast, recommendations, locale } = result;
  const topPrediction = classification.predictions[0];
  const { t } = useI18n();

  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);

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

    const newAiMessage: ChatMessage = { sender: 'bot', text: response.answer };
    setChatHistory(prev => [...prev, newAiMessage]);
    setIsAsking(false);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('Analysis Complete')}</CardTitle>
          <CardDescription>
             {t('AI analysis suggests the most likely disease is')} <strong>{topPrediction.label}</strong> {t('with')} {Math.round(topPrediction.confidence * 100)}% {t('confidence')}.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-8">
           <Card>
            <CardHeader>
              <CardTitle>{t('Step-by-Step Recommendations')}</CardTitle>
              <CardDescription>{t('Follow these steps to treat the issue.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {recommendations.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{index + 1}</div>
                    <p className="flex-1 pt-0.5 text-sm">{rec}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('Conversational Assistant')}</CardTitle>
              <CardDescription>{t('Ask a follow-up question about your analysis.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                  {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                      {msg.sender === 'bot' && <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><Bot className="h-5 w-5" /></div>}
                      <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <p className="text-sm">{msg.text}</p>
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

        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('Severity Assessment')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <RadialChart 
                value={severity.severityPercentage}
                mainText={`${Math.round(severity.severityPercentage)}%`}
                subText={severity.severityBand}
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
              <CardTitle>{t('Outbreak Risk Forecast (7-Day)')}</CardTitle>
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
                    {forecast.explanation}
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
