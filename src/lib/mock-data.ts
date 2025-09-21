import type { AnalysisResult } from './types';

export const mockHistory: AnalysisResult[] = [
  {
    id: 'case_001',
    timestamp: '2024-07-20T10:30:00Z',
    image: 'https://picsum.photos/seed/102/600/400',
    imageHint: 'diseased tomato leaf',
    crop: 'Tomato',
    predictions: [
      { label: 'Tomato Late Blight', confidence: 0.92 },
      { label: 'Tomato Early Blight', confidence: 0.05 },
      { label: 'Healthy', confidence: 0.03 },
    ],
    severity: { percentage: 45, band: 'Medium' },
    gradCamImage: 'https://picsum.photos/seed/102/600/400', // In a real app, this would be a data URI
    risk: { score: 0.75, explanation: 'High humidity and recent detections increase risk.' },
    status: 'Completed',
  },
  {
    id: 'case_002',
    timestamp: '2024-07-20T09:15:00Z',
    image: 'https://picsum.photos/seed/104/600/400',
    imageHint: 'diseased corn leaf',
    crop: 'Maize',
    predictions: [
      { label: 'Maize Common Rust', confidence: 0.61 },
      { label: 'Maize Gray Leaf Spot', confidence: 0.25 },
      { label: 'Healthy', confidence: 0.14 },
    ],
    severity: { percentage: 15, band: 'Low' },
    gradCamImage: 'https://picsum.photos/seed/104/600/400',
    risk: { score: 0.45, explanation: 'Moderate risk due to stable weather conditions.' },
    status: 'Pending Review',
  },
  {
    id: 'case_003',
    timestamp: '2024-07-19T17:00:00Z',
    image: 'https://picsum.photos/seed/103/600/400',
    imageHint: 'diseased potato leaf',
    crop: 'Potato',
    predictions: [
      { label: 'Potato Early Blight', confidence: 0.98 },
      { label: 'Healthy', confidence: 0.01 },
      { label: 'Potato Late Blight', confidence: 0.01 },
    ],
    severity: { percentage: 25, band: 'Medium' },
    gradCamImage: 'https://picsum.photos/seed/103/600/400',
    risk: { score: 0.60, explanation: 'Increased detections in the area.' },
    status: 'Completed',
  },
  {
    id: 'case_004',
    timestamp: '2024-07-18T11:45:00Z',
    image: 'https://picsum.photos/seed/101/600/400',
    imageHint: 'healthy tomato leaf',
    crop: 'Tomato',
    predictions: [
      { label: 'Healthy', confidence: 0.99 },
      { label: 'Tomato Late Blight', confidence: 0.01 },
      { label: 'Tomato Early Blight', confidence: 0.00 },
    ],
    severity: { percentage: 2, band: 'Low' },
    gradCamImage: 'https://picsum.photos/seed/101/600/400',
    risk: { score: 0.15, explanation: 'Low risk, plant appears healthy.' },
    status: 'Completed',
  },
    {
    id: 'case_005',
    timestamp: '2024-07-17T14:20:00Z',
    image: 'https://picsum.photos/seed/105/600/400',
    imageHint: 'diseased potato leaf',
    crop: 'Potato',
    predictions: [
      { label: 'Potato Late Blight', confidence: 0.55 },
      { label: 'Potato Early Blight', confidence: 0.40 },
      { label: 'Healthy', confidence: 0.05 },
    ],
    severity: { percentage: 65, band: 'High' },
    gradCamImage: 'https://picsum.photos/seed/105/600/400',
    risk: { score: 0.85, explanation: 'High severity and favorable weather for blight spread.' },
    status: 'Pending Review',
  },
];

export const reviewQueue = mockHistory.filter(item => item.status === 'Pending Review');
