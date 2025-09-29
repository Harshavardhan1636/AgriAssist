
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mockHistory } from '@/lib/mock-data';

export default function ConversationPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string; // This is the conversationId

    useEffect(() => {
        // This page now redirects to the unified history view, which is the canonical place
        // for viewing past analyses and their associated chats.
        const foundAnalysis = mockHistory.find(h => h.conversationId === id);
        if (foundAnalysis) {
            router.replace(`/dashboard/history/${foundAnalysis.id}`);
        } else {
            // If there's no analysis linked (e.g., a general chat started from "New Chat"),
            // we redirect to the main conversations list for now. A dedicated view could be built here.
            router.replace(`/dashboard/conversations`);
        }
    }, [id, router]);

    // Render nothing as the redirect will happen on the client.
    // A loading spinner could be placed here.
    return null;
}
