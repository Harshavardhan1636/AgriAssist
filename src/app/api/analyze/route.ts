import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Import AI flows
import { classifyPlantDisease } from '@/ai/flows/classify-plant-disease';
import { diagnoseWithText } from '@/ai/flows/diagnose-with-text';
import { assessDiseaseSeverity } from '@/ai/flows/assess-disease-severity';
import { forecastOutbreakRisk } from '@/ai/flows/forecast-outbreak-risk';
import { explainClassificationWithGradCAM } from '@/ai/flows/explain-classification-with-grad-cam';
import { generateRecommendations } from '@/ai/flows/generate-recommendations';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';

import type { FullAnalysisResponse } from '@/lib/types';

const analyzeSchema = z.object({
  photoDataUri: z.string().optional(),
  textQuery: z.string().optional(),
  audioDataUri: z.string().optional(),
  locale: z.string().default('en'),
  userId: z.string().optional(), // Will be extracted from auth token in production
}).refine(data => !!data.photoDataUri || !!data.textQuery || !!data.audioDataUri, {
  message: "Either an image, a text query, or an audio recording must be provided."
});

export async function POST(request: NextRequest) {
  try {
    // TODO: Extract user ID from JWT token
    // const userId = await getUserIdFromToken(request);
    const userId = 'demo-user-id'; // Mock user ID

    const formData = await request.formData();
    
    const rawPhotoDataUri = formData.get('photoDataUri') as string | null;
    const rawTextQuery = formData.get('textQuery') as string | null;
    const rawAudioDataUri = formData.get('audioDataUri') as string | null;
    const locale = (formData.get('locale') as string) || 'en';

    const validatedFields = analyzeSchema.safeParse({ 
      photoDataUri: rawPhotoDataUri, 
      textQuery: rawTextQuery,
      audioDataUri: rawAudioDataUri, 
      locale,
      userId
    });

    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid input: Please upload an image or describe the issue.",
          details: validatedFields.error.flatten()
        },
        { status: 400 }
      );
    }
    
    let { photoDataUri, textQuery, audioDataUri } = validatedFields.data;

    let classification;
    let usedPhoto = photoDataUri;
    let textDescription = textQuery || '';

    // Main logic for multimodal input
    if (audioDataUri) {
      console.log("Transcribing audio...");
      const transcriptionResult = await transcribeAudio({ audioDataUri });
      textDescription = transcriptionResult.transcription;
      console.log(`Transcription result: ${textDescription}`);
    }

    if (photoDataUri) {
      console.log("Analyzing with image...");
      classification = await classifyPlantDisease({ photoDataUri, language: locale });
    } else if (textDescription) {
      console.log("Analyzing with text...");
      const textDiagnosis = await diagnoseWithText({ query: textDescription, language: locale });
      classification = { predictions: textDiagnosis.predictions };
      // Use a placeholder image since none was provided
      usedPhoto = "https://picsum.photos/seed/placeholder/600/400";
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid input: Please upload an image or describe the issue." },
        { status: 400 }
      );
    }

    if (!classification || !classification.predictions || classification.predictions.length === 0) {
      console.error("Classification failed to return predictions.");
      return NextResponse.json(
        { success: false, error: "The AI model could not identify a disease. Please try again." },
        { status: 500 }
      );
    }

    const topPrediction = classification.predictions[0];
    console.log("Top prediction:", topPrediction);
    
    const soilType = 'Loam'; // Mock data - would come from user profile or sensor data
    
    const [severity, explanation, forecast] = await Promise.all([
      // Assess Severity
      assessDiseaseSeverity({ photoDataUri: usedPhoto!, description: textDescription, language: locale })
        .catch(e => { 
          console.error("Severity assessment failed:", e); 
          return { severityPercentage: 0, severityBand: 'Unknown' as const, confidence: 0 }; 
        }),
      
      // Explain with Grad-CAM (or fallback for text)
      explainClassificationWithGradCAM({ photoDataUri: usedPhoto!, classificationResult: topPrediction.label })
        .catch(e => { 
          console.error("Grad-CAM explanation failed:", e); 
          return { gradCAMOverlay: usedPhoto! }; 
        }),
      
      // Forecast Risk
      forecastOutbreakRisk({
        disease: topPrediction.label,
        historicalDetections: [1, 0, 2, 1, 3, 0, 4, 2, 3, 1, 5, 2, 4, 3], // Mock data
        weatherFeatures: { temperature: 28, humidity: 82, rainfall: 8 }, // Mock data
        cropType: 'Tomato', // Mock data - would come from user input or image analysis
        soilType,
        language: locale,
      }).catch(e => { 
        console.error("Risk forecast failed:", e); 
        return { riskScore: 0, explanation: 'Not available', preventiveActions: [] }; 
      }),
    ]);

    // Generate Recommendations using the results from the other flows
    const recommendations = await generateRecommendations({ 
      disease: topPrediction.label, 
      severity: severity.severityBand, 
      cropType: 'Tomato', // Mock data
      language: locale,
      forecastSummary: `Risk score is ${forecast.riskScore}. ${forecast.explanation}`,
      soilType: soilType,
    }).catch(e => { 
      console.error("Recommendations generation failed:", e); 
      return { recommendations: [] }; 
    });
    
    const conversationId = uuidv4();
    const analysisId = uuidv4();
    
    // TODO: Save to Firestore
    const analysisResult: FullAnalysisResponse = {
      classification,
      severity,
      explanation,
      forecast,
      recommendations,
      originalImage: usedPhoto!,
      locale,
      conversationId,
    };

    // TODO: Save analysis to Firestore
    /*
    await saveAnalysisToFirestore({
      id: analysisId,
      userId,
      conversationId,
      input: {
        type: photoDataUri ? 'image' : audioDataUri ? 'audio' : 'text',
        photoDataUri,
        textQuery: textDescription,
        audioDataUri,
        locale
      },
      results: analysisResult,
      status: topPrediction.confidence < 0.7 ? 'Pending Review' : 'Completed',
      crop: 'Tomato', // Mock data
      timestamp: new Date()
    });

    // Create conversation record
    await createConversationInFirestore({
      id: conversationId,
      analysisId,
      userId,
      title: `Analysis: ${topPrediction.label}`,
      analysisContext: JSON.stringify(analysisResult),
      messages: [],
      createdAt: new Date(),
      lastMessageAt: new Date()
    });
    */
    
    console.log("Full analysis complete.");
    return NextResponse.json({
      success: true,
      data: analysisResult
    });

  } catch (error: any) {
    console.error("Full analysis pipeline failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "An unexpected error occurred during analysis." 
      },
      { status: 500 }
    );
  }
}

// TODO: Implement authentication middleware
/*
async function getUserIdFromToken(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization token provided');
  }

  const token = authHeader.substring(7);
  
  // Verify Firebase ID token
  const decodedToken = await admin.auth().verifyIdToken(token);
  return decodedToken.uid;
}
*/

// TODO: Implement Firestore operations
/*
async function saveAnalysisToFirestore(analysis: any) {
  const db = getFirestore();
  await setDoc(doc(db, 'analyses', analysis.id), analysis);
}

async function createConversationInFirestore(conversation: any) {
  const db = getFirestore();
  await setDoc(doc(db, 'conversations', conversation.id), conversation);
}
*/