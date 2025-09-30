'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  ThumbsUp, 
  ThumbsDown, 
  User, 
  MapPin,
  Leaf,
  TrendingUp,
  CheckCircle,
  Droplets,
  Award
} from 'lucide-react';
import { useI18n } from '@/context/i18n-context';
import { mockBestPractices } from '@/lib/mock-data';
import { formatDistanceToNow } from 'date-fns';

export default function BestPracticesDatabase() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [isAddingPractice, setIsAddingPractice] = useState(false);
  const [showOrganicOnly, setShowOrganicOnly] = useState(false);
  const [showLowCarbonOnly, setShowLowCarbonOnly] = useState(false);
  const [showWaterConservingOnly, setShowWaterConservingOnly] = useState(false);
  
  // Filter best practices based on search query, region, crop, and environmental filters
  const filteredPractices = mockBestPractices.filter(practice => 
    (searchQuery === '' || 
     practice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     practice.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedRegion === 'all' || practice.region === selectedRegion) &&
    (selectedCrop === 'all' || practice.crop === selectedCrop)
  ).filter(practice => {
    if (showOrganicOnly && !practice.isOrganic) {
      return false;
    }
    if (showLowCarbonOnly && (!practice.environmentalImpact || (practice.environmentalImpact.carbonFootprint || 0) > 5)) {
      return false;
    }
    if (showWaterConservingOnly && (!practice.environmentalImpact || (practice.environmentalImpact.waterUsage || 0) > 2000)) {
      return false;
    }
    return true;
  });

  // Get unique regions and crops for filter dropdowns
  const regions = Array.from(new Set(mockBestPractices.map(p => p.region)));
  const crops = Array.from(new Set(mockBestPractices.map(p => p.crop)));

  const handleAddPractice = () => {
    setIsAddingPractice(true);
  };

  if (isAddingPractice) {
    return <AddBestPracticeForm onCancel={() => setIsAddingPractice(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{t('Regional Best Practices')}</h2>
          <p className="text-muted-foreground">
            {t('Discover proven farming techniques from your region')}
          </p>
        </div>
        <Button onClick={handleAddPractice}>
          <Plus className="h-4 w-4 mr-2" />
          {t('Add Best Practice')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('Search best practices...')}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showOrganicOnly ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowOrganicOnly(!showOrganicOnly)}
            className="flex items-center gap-1"
          >
            <Leaf className="h-4 w-4" />
            {t('Organic')}
          </Button>
          <Button 
            variant={showLowCarbonOnly ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowLowCarbonOnly(!showLowCarbonOnly)}
            className="flex items-center gap-1"
          >
            <TrendingUp className="h-4 w-4" />
            {t('Low Carbon')}
          </Button>
          <Button 
            variant={showWaterConservingOnly ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowWaterConservingOnly(!showWaterConservingOnly)}
            className="flex items-center gap-1"
          >
            <Droplets className="h-4 w-4" />
            {t('Water Saving')}
          </Button>
        </div>
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('Filter by region')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All Regions')}</SelectItem>
            {regions.map(region => (
              <SelectItem key={region} value={region}>{region}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCrop} onValueChange={setSelectedCrop}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('Filter by crop')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All Crops')}</SelectItem>
            {crops.map(crop => (
              <SelectItem key={crop} value={crop}>{t(crop)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredPractices.map((practice) => (
          <Card key={practice.id}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {practice.title}
                    {practice.verifiedByExpert && (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('Expert Verified')}
                      </Badge>
                    )}
                    {practice.isOrganic && (
                      <Badge variant="default" className="bg-green-500">
                        <Leaf className="h-3 w-3 mr-1" />
                        {t('Organic')}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {practice.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Leaf className="h-4 w-4" />
                  {t(practice.crop)}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {practice.region}
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {practice.postedBy}
                </div>
                {practice.successRate && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {practice.successRate}% {t('success rate')}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {practice.upvotes}
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsDown className="h-4 w-4" />
                  {practice.downvotes}
                </div>
                {practice.environmentalImpact && (
                  <>
                    {practice.environmentalImpact.carbonFootprint !== undefined && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {practice.environmentalImpact.carbonFootprint} kg CO₂
                      </div>
                    )}
                    {practice.environmentalImpact.waterUsage !== undefined && (
                      <div className="flex items-center gap-1">
                        <Droplets className="h-4 w-4" />
                        {practice.environmentalImpact.waterUsage} L
                      </div>
                    )}
                    {practice.environmentalImpact.biodiversityImpact && (
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        {t(practice.environmentalImpact.biodiversityImpact)}
                      </div>
                    )}
                  </>
                )}
                <div>
                  {formatDistanceToNow(new Date(practice.postedAt), { addSuffix: true })}
                </div>
              </div>
              {(practice.organicTreatmentAlternatives && practice.organicTreatmentAlternatives.length > 0) || practice.waterConservationTechnique ? (
                <div className="mt-3">
                  {practice.organicTreatmentAlternatives && practice.organicTreatmentAlternatives.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">{t('Organic Treatment Alternatives')}:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {practice.organicTreatmentAlternatives.map((alternative, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {alternative}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {practice.waterConservationTechnique && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">{t('Water Conservation Technique')}:</p>
                      <Badge variant="secondary" className="text-xs">
                        {practice.waterConservationTechnique}
                      </Badge>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AddBestPracticeForm({ onCancel }: { onCancel: () => void }) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [crop, setCrop] = useState('Unknown');
  const [category, setCategory] = useState('Other');
  const [region, setRegion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      onCancel();
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Add Best Practice')}</CardTitle>
        <CardDescription>
          {t('Share a proven farming technique with the community')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('Practice Title')}</Label>
            <Input
              id="title"
              placeholder={t('Give your best practice a title')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">{t('Detailed Description')}</Label>
            <Textarea
              id="description"
              placeholder={t('Describe the best practice in detail, including steps and benefits')}
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
            <Label htmlFor="region">{t('Region')}</Label>
            <Input
              id="region"
              placeholder={t('e.g., South India, North India, etc.')}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            {t('Cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('Adding...') : t('Add Practice')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}