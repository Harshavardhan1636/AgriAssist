'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Plus, 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  CheckCircle, 
  Clock, 
  User, 
  MapPin,
  Leaf,
  TrendingUp,
  Award,
  Droplets
} from 'lucide-react';
import { useI18n } from '@/context/i18n-context';
import { mockKnowledgeProblems, mockKnowledgeSolutions, mockBestPractices, mockSuccessStories } from '@/lib/mock-data';
import { formatDistanceToNow, format } from 'date-fns';
import BestPracticesDatabase from './best-practices';
import SuccessStoryShowcase from './success-stories';

export default function KnowledgeSharingPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('problems');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOrganicOnly, setShowOrganicOnly] = useState(false);
  const [showLowCarbonOnly, setShowLowCarbonOnly] = useState(false);
  const [showWaterConservingOnly, setShowWaterConservingOnly] = useState(false);

  // Filter items based on search query and environmental filters
  const filteredProblems = mockKnowledgeProblems.filter(problem => 
    problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.crop.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(problem => {
    if (showOrganicOnly && (!problem.organicTreatmentAlternatives || problem.organicTreatmentAlternatives.length === 0)) {
      return false;
    }
    if (showLowCarbonOnly && (!problem.environmentalImpact || (problem.environmentalImpact.carbonFootprint || 0) > 10)) {
      return false;
    }
    if (showWaterConservingOnly && (!problem.environmentalImpact || (problem.environmentalImpact.waterUsage || 0) > 3000)) {
      return false;
    }
    return true;
  });

  const filteredSolutions = mockKnowledgeSolutions.filter(solution => 
    solution.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    solution.description.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(solution => {
    if (showOrganicOnly && !solution.isOrganic) {
      return false;
    }
    if (showLowCarbonOnly && (!solution.environmentalImpact || (solution.environmentalImpact.carbonFootprint || 0) > 5)) {
      return false;
    }
    if (showWaterConservingOnly && (!solution.environmentalImpact || (solution.environmentalImpact.waterUsage || 0) > 2000)) {
      return false;
    }
    return true;
  });

  const filteredBestPractices = mockBestPractices.filter(practice => 
    practice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    practice.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    practice.crop.toLowerCase().includes(searchQuery.toLowerCase())
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

  const filteredSuccessStories = mockSuccessStories.filter(story => 
    story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.crop.toLowerCase().includes(searchQuery.toLowerCase())
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Solved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Solved':
        return 'default';
      case 'In Progress':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="grid gap-6 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{t('Farmer Knowledge Sharing')}</h1>
          <p className="text-muted-foreground">
            {t('Share problems, solutions, and best practices with fellow farmers')}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('Share a Problem')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('Search problems, solutions, and best practices...')}
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="problems" className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            {t('Problems')}
          </TabsTrigger>
          <TabsTrigger value="solutions" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {t('Solutions')}
          </TabsTrigger>
          <TabsTrigger value="practices" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            {t('Best Practices')}
          </TabsTrigger>
          <TabsTrigger value="stories" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('Success Stories')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="problems" className="mt-6">
          <div className="grid gap-4">
            {filteredProblems.map((problem) => (
              <Card key={problem.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {problem.title}
                        <Badge variant={getStatusVariant(problem.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(problem.status)}
                            {t(problem.status)}
                          </div>
                        </Badge>
                        {problem.organicTreatmentAlternatives && problem.organicTreatmentAlternatives.length > 0 && (
                          <Badge variant="default" className="bg-green-500">
                            <Leaf className="h-3 w-3 mr-1" />
                            {t('Organic Options')}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {problem.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Leaf className="h-4 w-4" />
                      {t(problem.crop)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {problem.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {problem.isAnonymous ? t('Anonymous') : problem.postedBy}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {problem.views} {t('views')}
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {problem.upvotes}
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsDown className="h-4 w-4" />
                      {problem.downvotes}
                    </div>
                    {problem.environmentalImpact && (
                      <>
                        {problem.environmentalImpact.carbonFootprint !== undefined && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {problem.environmentalImpact.carbonFootprint} kg CO₂
                          </div>
                        )}
                        {problem.environmentalImpact.waterUsage !== undefined && (
                          <div className="flex items-center gap-1">
                            <Droplets className="h-4 w-4" />
                            {problem.environmentalImpact.waterUsage} L
                          </div>
                        )}
                        {problem.environmentalImpact.biodiversityImpact && (
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            {t(problem.environmentalImpact.biodiversityImpact)}
                          </div>
                        )}
                      </>
                    )}
                    <div>
                      {formatDistanceToNow(new Date(problem.postedAt), { addSuffix: true })}
                    </div>
                  </div>
                  {problem.organicTreatmentAlternatives && problem.organicTreatmentAlternatives.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium">{t('Organic Treatment Alternatives')}:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {problem.organicTreatmentAlternatives.map((alternative, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {alternative}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="solutions" className="mt-6">
          <div className="grid gap-4">
            {filteredSolutions.map((solution) => (
              <Card key={solution.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {solution.title}
                        {solution.verifiedByExpert && (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t('Expert Verified')}
                          </Badge>
                        )}
                        {solution.isOrganic && (
                          <Badge variant="default" className="bg-green-500">
                            <Leaf className="h-3 w-3 mr-1" />
                            {t('Organic')}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {solution.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {solution.isAnonymous ? t('Anonymous') : solution.postedBy}
                    </div>
                    {solution.verifiedByExpert && solution.expertName && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        {t('Verified by')} {solution.expertName}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {solution.upvotes}
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsDown className="h-4 w-4" />
                      {solution.downvotes}
                    </div>
                    {solution.environmentalImpact && (
                      <>
                        {solution.environmentalImpact.carbonFootprint !== undefined && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {solution.environmentalImpact.carbonFootprint} kg CO₂
                          </div>
                        )}
                        {solution.environmentalImpact.waterUsage !== undefined && (
                          <div className="flex items-center gap-1">
                            <Droplets className="h-4 w-4" />
                            {solution.environmentalImpact.waterUsage} L
                          </div>
                        )}
                        {solution.environmentalImpact.biodiversityImpact && (
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            {t(solution.environmentalImpact.biodiversityImpact)}
                          </div>
                        )}
                      </>
                    )}
                    <div>
                      {formatDistanceToNow(new Date(solution.postedAt), { addSuffix: true })}
                    </div>
                  </div>
                  {solution.organicTreatmentAlternatives && solution.organicTreatmentAlternatives.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium">{t('Organic Treatment Alternatives')}:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {solution.organicTreatmentAlternatives.map((alternative, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {alternative}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="practices" className="mt-6">
          <BestPracticesDatabase />
        </TabsContent>

        <TabsContent value="stories" className="mt-6">
          <SuccessStoryShowcase />
        </TabsContent>
      </Tabs>
    </div>
  );
}