'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useI18n } from '@/context/i18n-context';
import { mockKnowledgeProblems } from '@/lib/mock-data';

export default function ShareProblemForm() {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [crop, setCrop] = useState('Unknown');
  const [category, setCategory] = useState('Other');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Reset form after submission
      setTimeout(() => {
        setTitle('');
        setDescription('');
        setCrop('Unknown');
        setCategory('Other');
        setLocation('');
        setIsSubmitted(false);
      }, 3000);
    }, 1000);
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">{t('Problem Shared Successfully!')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            {t('Your problem has been shared with the community. Farmers and experts will review and provide solutions.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('Share a Problem')}</CardTitle>
        <CardDescription>
          {t('Describe your farming problem anonymously to get help from the community')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('Problem Title')}</Label>
            <Input
              id="title"
              placeholder={t('Briefly describe your problem')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">{t('Detailed Description')}</Label>
            <Textarea
              id="description"
              placeholder={t('Provide detailed information about the problem, symptoms, and any steps you have already taken')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="crop">{t('Crop')}</Label>
              <Select value={crop} onValueChange={setCrop}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Select crop')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tomato">{t('Tomato')}</SelectItem>
                  <SelectItem value="Potato">{t('Potato')}</SelectItem>
                  <SelectItem value="Maize">{t('Maize')}</SelectItem>
                  <SelectItem value="Wheat">{t('Wheat')}</SelectItem>
                  <SelectItem value="Rice">{t('Rice')}</SelectItem>
                  <SelectItem value="Unknown">{t('Unknown/Other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">{t('Category')}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Select category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pest">{t('Pest')}</SelectItem>
                  <SelectItem value="Disease">{t('Disease')}</SelectItem>
                  <SelectItem value="Nutrition">{t('Nutrition')}</SelectItem>
                  <SelectItem value="Weather">{t('Weather')}</SelectItem>
                  <SelectItem value="Soil">{t('Soil')}</SelectItem>
                  <SelectItem value="Other">{t('Other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">{t('Location')}</Label>
            <Input
              id="location"
              placeholder={t('District, State (optional)')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked === true)}
            />
            <Label htmlFor="anonymous">
              {t('Share anonymously')} ({t('Your identity will not be revealed')})
            </Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('Sharing...') : t('Share Problem')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}