'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  ThumbsUp, 
  ThumbsDown, 
  User, 
  Leaf,
  MapPin,
  Clock
} from 'lucide-react';
import { useI18n } from '@/context/i18n-context';
import { mockKnowledgeSolutions } from '@/lib/mock-data';
import { formatDistanceToNow } from 'date-fns';

export default function ExpertVerificationPanel() {
  const { t } = useI18n();
  const [selectedSolution, setSelectedSolution] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const unverifiedSolutions = mockKnowledgeSolutions.filter(
    solution => !solution.verifiedByExpert
  );

  const handleVerify = (solutionId: string) => {
    setIsVerifying(true);
    setSelectedSolution(solutionId);
    
    // Simulate API call
    setTimeout(() => {
      setIsVerifying(false);
      setSelectedSolution(null);
      setVerificationNotes('');
    }, 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {t('Expert Verification')}
        </CardTitle>
        <CardDescription>
          {t('Review and verify community-shared solutions to help other farmers')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {unverifiedSolutions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">{t('All Solutions Verified')}</h3>
            <p className="text-muted-foreground">
              {t('There are no pending solutions to verify at this time.')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              {t('{{count}} solutions pending verification').replace('{{count}}', unverifiedSolutions.length.toString())}
            </div>
            
            {unverifiedSolutions.map((solution) => (
              <Card key={solution.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <CardTitle>{solution.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {solution.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {solution.isAnonymous ? t('Anonymous') : solution.postedBy}
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {solution.upvotes}
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsDown className="h-4 w-4" />
                      {solution.downvotes}
                    </div>
                    <div>
                      {formatDistanceToNow(new Date(solution.postedAt), { addSuffix: true })}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`notes-${solution.id}`}>
                      {t('Verification Notes')} ({t('optional')})
                    </Label>
                    <Textarea
                      id={`notes-${solution.id}`}
                      placeholder={t('Add any notes about this solution...')}
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleVerify(solution.id)}
                    disabled={isVerifying && selectedSolution === solution.id}
                    className="w-full"
                  >
                    {isVerifying && selectedSolution === solution.id ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        {t('Verifying...')}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t('Verify Solution')}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}