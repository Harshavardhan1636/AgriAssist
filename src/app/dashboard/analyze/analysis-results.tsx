'use client';

import type { FullAnalysisResponse } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, LabelList, RadialBar, RadialBarChart } from 'recharts';

interface AnalysisResultsProps {
  result: FullAnalysisResponse;
}

const getSeverityColor = (percentage: number) => {
  if (percentage > 50) return "hsl(var(--destructive))";
  if (percentage > 20) return "hsl(var(--accent))";
  return "hsl(var(--primary))";
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  const { classification, severity, explanation, forecast, originalImage } = result;
  const topPrediction = classification.predictions[0];

  const severityData = [
    { name: 'severity', value: severity.severityPercentage, fill: getSeverityColor(severity.severityPercentage) }
  ];
  
  const riskData = [
    { name: 'risk', value: forecast.riskScore * 100, fill: getSeverityColor(forecast.riskScore * 100) }
  ];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Analysis Complete</CardTitle>
          <CardDescription>
            AI analysis suggests the most likely disease is <strong>{topPrediction.label}</strong> with {Math.round(topPrediction.confidence * 100)}% confidence.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Explainable AI (Grad-CAM)</CardTitle>
              <CardDescription>The highlighted areas show what the AI focused on to make its diagnosis.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-center font-medium mb-2">Original Image</h4>
                <Image src={originalImage} alt="Original crop" width={400} height={400} className="rounded-lg border object-cover aspect-square" />
              </div>
              <div>
                <h4 className="text-center font-medium mb-2">AI Focus (Grad-CAM)</h4>
                <Image src={explanation.gradCAMOverlay} alt="Grad-CAM explanation" width={400} height={400} className="rounded-lg border object-cover aspect-square" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Disease Predictions</CardTitle>
              <CardDescription>Top potential diseases identified by the model.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {classification.predictions.map((pred, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-sm">{pred.label}</span>
                    <span className="text-sm text-muted-foreground">{Math.round(pred.confidence * 100)}%</span>
                  </div>
                  <Progress value={pred.confidence * 100} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Severity Assessment</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
               <ChartContainer config={{}} className="mx-auto aspect-square h-[200px]">
                <RadialBarChart data={severityData} startAngle={90} endAngle={-270} innerRadius="70%" outerRadius="100%">
                  <RadialBar dataKey="value" background={{ fill: 'hsl(var(--muted))' }} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-3xl font-bold">
                    {Math.round(severity.severityPercentage)}%
                  </text>
                   <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-sm">
                    {severity.severityBand}
                  </text>
                </RadialBarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outbreak Risk Forecast (7-Day)</CardTitle>
            </CardHeader>
            <CardContent>
               <ChartContainer config={{}} className="mx-auto aspect-square h-[200px]">
                <RadialBarChart data={riskData} startAngle={90} endAngle={-270} innerRadius="70%" outerRadius="100%">
                  <RadialBar dataKey="value" background={{ fill: 'hsl(var(--muted))' }} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-3xl font-bold">
                    {Math.round(forecast.riskScore * 100)}%
                  </text>
                   <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-sm">
                    Risk Score
                  </text>
                </RadialBarChart>
              </ChartContainer>
              <Accordion type="single" collapsible className="w-full mt-4">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Why this score?</AccordionTrigger>
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
