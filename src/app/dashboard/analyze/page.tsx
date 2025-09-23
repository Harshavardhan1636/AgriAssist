
'use client';

import AnalysisView from "./analysis-view";
import { useI18n } from "@/context/i18n-context";

export default function AnalyzePage() {
    const { t } = useI18n();
    return (
        <div className="mx-auto grid w-full max-w-6xl gap-2">
            <h1 className="text-3xl font-semibold">{t('New Analysis Page')}</h1>
            <AnalysisView />
        </div>
    );
}
