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
import { reviewQueue } from "@/lib/mock-data";
import Image from "next/image";
import { ThumbsDown, ThumbsUp } from "lucide-react";

export default function ReviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-headline">Agronomist Review Queue</h1>
        <p className="text-muted-foreground">
          These analyses have low confidence scores and require expert review.
        </p>
      </div>

      {reviewQueue.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <CardHeader>
                <CardTitle>Queue is Clear!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">There are no analyses pending review. Great job!</p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviewQueue.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>Case #{item.id.split('_')[1]}</CardTitle>
                <CardDescription>
                  AI Prediction: <strong>{item.predictions[0].label}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <Image
                  src={item.image}
                  alt={`Review case ${item.id}`}
                  width={400}
                  height={300}
                  className="rounded-lg border object-cover w-full aspect-video"
                  data-ai-hint={item.imageHint}
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium">AI Confidence</p>
                  <Badge variant="destructive">{Math.round(item.predictions[0].confidence * 100)}%</Badge>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor={`correction-${item.id}`}>Correct Label (if needed)</Label>
                    <Input id={`correction-${item.id}`} placeholder={item.predictions[0].label} />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor={`notes-${item.id}`}>Agronomist Notes</Label>
                    <Textarea id={`notes-${item.id}`} placeholder="Add observations..." />
                 </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline"><ThumbsDown className="mr-2"/>Incorrect</Button>
                <Button><ThumbsUp className="mr-2"/>Approve AI</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
