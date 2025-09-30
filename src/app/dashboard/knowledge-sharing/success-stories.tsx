'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { mockSuccessStories } from '@/lib/mock-data';
import { format } from 'date-fns';

export default function SuccessStoryShowcase() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [isAddingStory, setIsAddingStory] = useState(false);
  const [showOrganicOnly, setShowOrganicOnly] = useState(false);
  const [showLowCarbonOnly, setShowLowCarbonOnly] = useState(false);
  const [showWaterConservingOnly, setShowWaterConservingOnly] = useState(false);
  
  // Filter success stories based on search query, region, crop, and environmental filters
  const filteredStories = mockSuccessStories.filter(story => 
    (searchQuery === '' || 
     story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     story.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
     story.farmerName.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedRegion === 'all' || story.region === selectedRegion) &&
    (selectedCrop === 'all' || story.crop === selectedCrop)
  ).filter(story => {
    if (showOrganicOnly && !story.isOrganic) {
      return false;
    }
    if (showLowCarbonOnly && (!story.environmentalImpact || (story.environmentalImpact.carbonFootprint || 0) > 5)) {
      return false;
    }
    if (showWaterConservingOnly && (!story.environmentalImpact || (story.environmentalImpact.waterUsage || 0) > 2000)) {
      return false;
    }
    return true;
  });

  // Get unique regions and crops for filter dropdowns
  const regions = Array.from(new Set(mockSuccessStories.map(s => s.region)));
  const crops = Array.from(new Set(mockSuccessStories.map(s => s.crop)));

  const handleAddStory = () => {
    setIsAddingStory(true);
  };

  if (isAddingStory) {
    return <AddSuccessStoryForm onCancel={() => setIsAddingStory(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{t('Success Stories')}</h2>
          <p className="text-muted-foreground">
            {t('Learn from fellow farmers who achieved remarkable results')}
          </p>
        </div>
        <Button onClick={handleAddStory}>
          <Plus className="h-4 w-4 mr-2" />
          {t('Share Your Story')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('Search success stories...')}
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

      <div className="grid gap-6">
        {filteredStories.map((story) => (
          <Card key={story.id}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {story.title}
                    {story.verifiedByExpert && (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('Expert Verified')}
                      </Badge>
                    )}
                    {story.isOrganic && (
                      <Badge variant="default" className="bg-green-500">
                        <Leaf className="h-3 w-3 mr-1" />
                        {t('Organic')}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {story.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{story.farmerName}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4" />
                    {story.location}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Leaf className="h-4 w-4" />
                    {t(story.crop)}
                  </div>
                  {story.environmentalImpact && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">{t('Environmental Impact')}:</p>
                      <div className="flex flex-wrap gap-2">
                        {story.environmentalImpact.carbonFootprint !== undefined && (
                          <Badge variant="secondary" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {story.environmentalImpact.carbonFootprint} kg CO₂
                          </Badge>
                        )}
                        {story.environmentalImpact.waterUsage !== undefined && (
                          <Badge variant="secondary" className="text-xs">
                            <Droplets className="h-3 w-3 mr-1" />
                            {story.environmentalImpact.waterUsage} L
                          </Badge>
                        )}
                        {story.environmentalImpact.biodiversityImpact && (
                          <Badge variant="secondary" className="text-xs">
                            <Award className="h-3 w-3 mr-1" />
                            {t(story.environmentalImpact.biodiversityImpact)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {(story.organicTreatmentAlternatives && story.organicTreatmentAlternatives.length > 0) || story.waterConservationTechnique || story.biodiversityImpactDescription ? (
                    <div className="mt-3">
                      {story.organicTreatmentAlternatives && story.organicTreatmentAlternatives.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm font-medium">{t('Organic Treatment Alternatives')}:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {story.organicTreatmentAlternatives.map((alternative, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {alternative}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {story.waterConservationTechnique && (
                        <div className="mb-2">
                          <p className="text-sm font-medium">{t('Water Conservation Technique')}:</p>
                          <Badge variant="outline" className="text-xs">
                            {story.waterConservationTechnique}
                          </Badge>
                        </div>
                      )}
                      {story.biodiversityImpactDescription && (
                        <div>
                          <p className="text-sm font-medium">{t('Biodiversity Impact')}:</p>
                          <p className="text-xs text-muted-foreground">{story.biodiversityImpactDescription}</p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">{t('Before Yield')}</div>
                    <div className="font-bold">{story.beforeYield} {t('tons/ha')}</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">{t('After Yield')}</div>
                    <div className="font-bold">{story.afterYield} {t('tons/ha')}</div>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">{t('Improvement')}</div>
                    <div className="font-bold text-green-700">+{story.yieldImprovement}%</div>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">{t('Cost Savings')}</div>
                    <div className="font-bold text-blue-700">{story.costSavings}%</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {story.upvotes}
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsDown className="h-4 w-4" />
                  {story.downvotes}
                </div>
                <div>
                  {t('Posted')} {format(new Date(story.postedAt), 'PPP')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AddSuccessStoryForm({ onCancel }: { onCancel: () => void }) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [location, setLocation] = useState('');
  const [crop, setCrop] = useState('Unknown');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [beforeYield, setBeforeYield] = useState('');
  const [afterYield, setAfterYield] = useState('');
  const [timePeriod, setTimePeriod] = useState('');
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
        <CardTitle>{t('Share Your Success Story')}</CardTitle>
        <CardDescription>
          {t('Inspire others by sharing your farming success journey')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('Story Title')}</Label>
            <Input
              id="title"
              placeholder={t('Give your success story a title')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">{t('Story Description')}</Label>
            <Textarea
              id="description"
              placeholder={t('Tell us about your journey and what made the difference')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="farmerName">{t('Your Name')}</Label>
              <Input
                id="farmerName"
                placeholder={t('Enter your name')}
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">{t('Location')}</Label>
              <Input
                id="location"
                placeholder={t('District, State')}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
          </div>
          
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="problem">{t('Problem Faced')}</Label>
              <Textarea
                id="problem"
                placeholder={t('What challenges were you facing?')}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                required
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="solution">{t('Solution Implemented')}</Label>
              <Textarea
                id="solution"
                placeholder={t('What did you do to solve the problem?')}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                required
                rows={2}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="beforeYield">{t('Before Yield')} ({t('tons/ha')})</Label>
              <Input
                id="beforeYield"
                type="number"
                placeholder="e.g., 10"
                value={beforeYield}
                onChange={(e) => setBeforeYield(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="afterYield">{t('After Yield')} ({t('tons/ha')})</Label>
              <Input
                id="afterYield"
                type="number"
                placeholder="e.g., 25"
                value={afterYield}
                onChange={(e) => setAfterYield(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timePeriod">{t('Time Period')}</Label>
              <Input
                id="timePeriod"
                placeholder={t('e.g., 6 months, 1 year')}
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
        <CardContent className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            {t('Cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('Sharing...') : t('Share Story')}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}