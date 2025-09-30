'use client';

import AnalysisView from './analysis-view';
import { useI18n } from '@/context/i18n-context';

export default function AnalyzePage() {
  const { t } = useI18n();
  
  return (
    <div className="container py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('Crop Analysis')}</h1>
          <p className="text-muted-foreground">
            {t('Analyze crop health using AI-powered tools. Upload an image, describe the issue, or record audio.')}
          </p>
        </div>
        
        <AnalysisView />
      </div>
    </div>
  );
}