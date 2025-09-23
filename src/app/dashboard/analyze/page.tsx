
'use client';

import AnalysisView from "./analysis-view";

export default function AnalyzePage() {
    return (
        <div className="mx-auto grid w-full max-w-6xl gap-2">
            <h1 className="text-3xl font-semibold">New Analysis</h1>
            <AnalysisView />
        </div>
    );
}
