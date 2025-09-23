
import type { AnalysisResult, CommunityOutbreak } from './types';

export const mockHistory: AnalysisResult[] = [
  {
    id: 'case_001',
    timestamp: '2024-07-20T10:30:00Z',
    image: 'https://picsum.photos/seed/tomato_late_blight/600/400',
    imageHint: 'diseased tomato leaf',
    crop: 'Tomato',
    predictions: [
      { label: 'Tomato Late Blight', confidence: 0.92 },
      { label: 'Tomato Early Blight', confidence: 0.05 },
      { label: 'Healthy', confidence: 0.03 },
    ],
    severity: { percentage: 45, band: 'Medium' },
    gradCamImage: 'https://picsum.photos/seed/tomato_late_blight_cam/600/400', // In a real app, this would be a data URI
    risk: { score: 0.75, explanation: 'High humidity and recent detections increase risk.' },
    status: 'Completed',
  },
  {
    id: 'case_002',
    timestamp: '2024-07-20T09:15:00Z',
    image: 'https://picsum.photos/seed/maize_rust/600/400',
    imageHint: 'diseased corn leaf',
    crop: 'Maize',
    predictions: [
      { label: 'Maize Common Rust', confidence: 0.61 },
      { label: 'Maize Gray Leaf Spot', confidence: 0.25 },
      { label: 'Healthy', confidence: 0.14 },
    ],
    severity: { percentage: 15, band: 'Low' },
    gradCamImage: 'https://picsum.photos/seed/maize_rust_cam/600/400',
    risk: { score: 0.45, explanation: 'Moderate risk due to stable weather conditions.' },
    status: 'Pending Review',
  },
  {
    id: 'case_003',
    timestamp: '2024-07-19T17:00:00Z',
    image: 'https://picsum.photos/seed/potato_early_blight/600/400',
    imageHint: 'diseased potato leaf',
    crop: 'Potato',
    predictions: [
      { label: 'Potato Early Blight', confidence: 0.98 },
      { label: 'Healthy', confidence: 0.01 },
      { label: 'Potato Late Blight', confidence: 0.01 },
    ],
    severity: { percentage: 25, band: 'Medium' },
    gradCamImage: 'https://picsum.photos/seed/potato_early_blight_cam/600/400',
    risk: { score: 0.60, explanation: 'Increased detections in the area.' },
    status: 'Completed',
  },
  {
    id: 'case_004',
    timestamp: '2024-07-18T11:45:00Z',
    image: 'https://picsum.photos/seed/healthy_tomato/600/400',
    imageHint: 'healthy tomato leaf',
    crop: 'Tomato',
    predictions: [
      { label: 'Healthy', confidence: 0.99 },
      { label: 'Tomato Late Blight', confidence: 0.01 },
      { label: 'Tomato Early Blight', confidence: 0.00 },
    ],
    severity: { percentage: 2, band: 'Low' },
    gradCamImage: 'https://picsum.photos/seed/healthy_tomato_cam/600/400',
    risk: { score: 0.15, explanation: 'Low risk, plant appears healthy.' },
    status: 'Completed',
  },
    {
    id: 'case_005',
    timestamp: '2024-07-17T14:20:00Z',
    image: 'https://picsum.photos/seed/potato_late_blight/600/400',
    imageHint: 'diseased potato leaf',
    crop: 'Potato',
    predictions: [
      { label: 'Potato Late Blight', confidence: 0.55 },
      { label: 'Potato Early Blight', confidence: 0.40 },
      { label: 'Healthy', confidence: 0.05 },
    ],
    severity: { percentage: 65, band: 'High' },
    gradCamImage: 'https://picsum.photos/seed/potato_late_blight_cam/600/400',
    risk: { score: 0.85, explanation: 'High severity and favorable weather for blight spread.' },
    status: 'Pending Review',
  },
];

export const reviewQueue = mockHistory.filter(item => item.status === 'Pending Review');


export const communityOutbreaks: CommunityOutbreak[] = [
    {
        id: 'outbreak_01',
        disease: 'Wheat Brown Rust',
        crop: 'Wheat',
        location: 'Karnal, Haryana',
        latitude: 29.6857,
        longitude: 76.9905,
        detectedCases: 42,
        riskLevel: 'High',
        firstReported: '2024-07-18T10:00:00Z',
    },
    {
        id: 'outbreak_02',
        disease: 'Rice Blast',
        crop: 'Rice',
        location: 'Guntur, Andhra Pradesh',
        latitude: 16.3067,
        longitude: 80.4365,
        detectedCases: 25,
        riskLevel: 'Medium',
        firstReported: '2024-07-20T14:00:00Z',
    },
    {
        id: 'outbreak_03',
        disease: 'Maize Common Rust',
        crop: 'Maize',
        location: 'Nashik, Maharashtra',
        latitude: 19.9975,
        longitude: 73.7898,
        detectedCases: 15,
        riskLevel: 'Low',
        firstReported: '2024-07-21T09:00:00Z',
    },
    {
        id: 'outbreak_04',
        disease: 'Tomato Late Blight',
        crop: 'Tomato',
        location: 'Solan, Himachal Pradesh',
        latitude: 30.9083,
        longitude: 77.0996,
        detectedCases: 88,
        riskLevel: 'High',
        firstReported: '2024-07-15T11:30:00Z',
    }
];
