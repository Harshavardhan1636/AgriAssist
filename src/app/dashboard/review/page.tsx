
'use client';

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reviewQueue as initialReviewQueue } from "@/lib/mock-data";
import Image from "next/image";
import { ThumbsDown, ThumbsUp, ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "@/context/i18n-context";
import { useToast } from "@/hooks/use-toast";

export default function ReviewPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [reviewQueue, setReviewQueue] = useState(initialReviewQueue);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleDecision = (isCorrect: boolean) => {
    const reviewedItem = reviewQueue[currentIndex];
    
    // In a real app, you would send this feedback to your backend
    // for storage, notifying the farmer, and for model retraining.
    console.log({
      caseId: reviewedItem.id,
      aiWasCorrect: isCorrect,
      expertLabel: isCorrect ? reviewedItem.predictions[0].label : (document.getElementById(`correction-${reviewedItem.id}`) as HTMLInputElement)?.value,
      notes: (document.getElementById(`notes-${reviewedItem.id}`) as HTMLTextAreaElement)?.value,
    });

    toast({
        title: t('Feedback Submitted'),
        description: `${t('Case')} #${reviewedItem.id.split('_')[1]} ${t('has been processed.')}`,
    });

    // Remove the item from the queue and move to the next
    setReviewQueue(prev => prev.filter(item => item.id !== reviewedItem.id));
    if (currentIndex >= reviewQueue.length - 1) {
        setCurrentIndex(0);
    }
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % reviewQueue.length);
  }

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + reviewQueue.length) % reviewQueue.length);
  }

  const currentItem = reviewQueue.length > 0 ? reviewQueue[currentIndex] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{t('Agronomist Review Queue')}</h1>
        <p className="text-muted-foreground">
          {t('These analyses have low confidence scores and require expert review.')}
        </p>
      </div>

      {!currentItem ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center h-96">
            <CardHeader>
                <CardTitle>{t('Queue is Clear!')}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{t('There are no analyses pending review. Great job!')}</p>
            </CardContent>
        </Card>
      ) : (
        <>
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    {t('Viewing case')} {currentIndex + 1} {t('of')} {reviewQueue.length}
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={goToPrevious} disabled={reviewQueue.length <= 1}>
                        <ArrowLeft />
                    </Button>
                    <Button variant="outline" size="icon" onClick={goToNext} disabled={reviewQueue.length <= 1}>
                        <ArrowRight />
                    </Button>
                </div>
            </div>
            <Card key={currentItem.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{t('Case')} #{currentItem.id.split('_')[1]}</CardTitle>
                <CardDescription>
                  {t('AI Prediction:')} <strong>{t(currentItem.predictions[0].label as any)}</strong> {t('with')} <Badge variant="destructive">{Math.round(currentItem.predictions[0].confidence * 100)}%</Badge> {t('confidence')}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <Image
                  src={currentItem.image}
                  alt={`Review case ${currentItem.id}`}
                  width={600}
                  height={400}
                  className="rounded-lg border object-cover w-full aspect-video"
                  data-ai-hint={currentItem.imageHint}
                />
                <div className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor={`correction-${currentItem.id}`}>{t('Correct Label (if AI is wrong)')}</Label>
                        <Input id={`correction-${currentItem.id}`} placeholder={t(currentItem.predictions[0].label as any)} />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor={`notes-${currentItem.id}`}>{t('Notes for Farmer & Retraining')}</Label>
                        <Textarea id={`notes-${currentItem.id}`} placeholder={t('Add observations, mention subtle visual cues for the model...')} className="min-h-[150px]" />
                     </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-4 border-t pt-6">
                <Button variant="destructive" onClick={() => handleDecision(false)}><ThumbsDown className="mr-2"/>{t('Submit Correction')}</Button>
                <Button variant="default" onClick={() => handleDecision(true)}><ThumbsUp className="mr-2"/>{t('Approve AI')}</Button>
              </CardFooter>
            </Card>
        </>
      )}
    </div>
  );
}
