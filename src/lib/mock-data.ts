
import type { AnalysisResult, CommunityOutbreak, StoreProduct, StoreLocation, WeatherForecast, SoilData, Conversation, ReviewQueueItem, KnowledgeProblem, KnowledgeSolution, BestPractice, SuccessStory } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || `https://picsum.photos/seed/${id}/600/400`;
const getImageHint = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageHint || 'placeholder';

export const mockHistory: AnalysisResult[] = [
  {
    id: 'case_001',
    conversationId: 'convo_001',
    timestamp: '2024-07-20T10:30:00Z',
    image: getImage('tomato_late_blight_leaf'),
    imageHint: getImageHint('tomato_late_blight_leaf'),
    crop: 'Tomato',
    predictions: [
      { label: 'Tomato Late Blight', confidence: 0.92 },
      { label: 'Tomato Early Blight', confidence: 0.05 },
      { label: 'Healthy', confidence: 0.03 },
    ],
    severity: { percentage: 45, band: 'Medium' },
    gradCamImage: getImage('tomato_late_blight_cam'),
    risk: { score: 0.75, explanation: 'High humidity and recent detections increase risk.' },
    status: 'Completed',
  },
  {
    id: 'case_002',
    conversationId: 'convo_002',
    timestamp: '2024-07-20T09:15:00Z',
    image: getImage('maize_common_rust_leaf'),
    imageHint: getImageHint('maize_common_rust_leaf'),
    crop: 'Maize',
    predictions: [
      { label: 'Maize Common Rust', confidence: 0.61 },
      { label: 'Maize Gray Leaf Spot', confidence: 0.25 },
      { label: 'Healthy', confidence: 0.14 },
    ],
    severity: { percentage: 15, band: 'Low' },
    gradCamImage: getImage('maize_common_rust_cam'),
    risk: { score: 0.45, explanation: 'Moderate risk due to stable weather conditions.' },
    status: 'Pending Review',
  },
  {
    id: 'case_003',
    conversationId: 'convo_003',
    timestamp: '2024-07-19T17:00:00Z',
    image: getImage('potato_early_blight_leaf'),
    imageHint: getImageHint('potato_early_blight_leaf'),
    crop: 'Potato',
    predictions: [
      { label: 'Potato Early Blight', confidence: 0.98 },
      { label: 'Healthy', confidence: 0.01 },
      { label: 'Potato Late Blight', confidence: 0.01 },
    ],
    severity: { percentage: 25, band: 'Medium' },
    gradCamImage: getImage('potato_early_blight_cam'),
    risk: { score: 0.60, explanation: 'Increased detections in the area.' },
    status: 'Completed',
  },
  {
    id: 'case_004',
    conversationId: 'convo_004',
    timestamp: '2024-07-18T11:45:00Z',
    image: getImage('healthy_tomato_leaf'),
    imageHint: getImageHint('healthy_tomato_leaf'),
    crop: 'Tomato',
    predictions: [
      { label: 'Healthy', confidence: 0.99 },
      { label: 'Tomato Late Blight', confidence: 0.01 },
      { label: 'Tomato Early Blight', confidence: 0.00 },
    ],
    severity: { percentage: 2, band: 'Low' },
    gradCamImage: getImage('healthy_tomato_cam'),
    risk: { score: 0.15, explanation: 'Low risk, plant appears healthy.' },
    status: 'Completed',
  },
    {
    id: 'case_005',
    conversationId: 'convo_005',
    timestamp: '2024-07-17T14:20:00Z',
    image: getImage('potato_late_blight_leaf_2'),
    imageHint: getImageHint('potato_late_blight_leaf_2'),
    crop: 'Potato',
    predictions: [
      { label: 'Potato Late Blight', confidence: 0.55 },
      { label: 'Potato Early Blight', confidence: 0.40 },
      { label: 'Healthy', confidence: 0.05 },
    ],
    severity: { percentage: 65, band: 'High' },
    gradCamImage: getImage('potato_late_blight_cam_2'),
    risk: { score: 0.85, explanation: 'High severity and favorable weather for blight spread.' },
    status: 'Pending Review',
  },
];

export const reviewQueue: ReviewQueueItem[] = mockHistory
  .filter(item => item.status === 'Pending Review')
  .map(item => ({
    ...item,
    confidence: item.predictions[0]?.confidence || 0,
    reviewedAt: undefined,
    reviewedBy: undefined,
    expertLabel: undefined,
    notes: undefined,
  }));


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

export const mockProducts: StoreProduct[] = [
  {
    id: 'prod_001',
    name: 'Neem Oil Concentrate',
    description: 'A natural, organic fungicide and pesticide effective against blights and rusts. Safe for all crops.',
    price: 450,
    currency: 'INR',
    image: getImage('product_neem_oil'),
    imageHint: getImageHint('product_neem_oil'),
    type: 'Organic Fungicide',
    isGovtApproved: true,
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 2.3, // kg CO2 equivalent per application
      waterUsage: 500, // liters per hectare
      biodiversityImpact: 'Positive'
    },
    isOrganic: true,
    organicCertification: ' certified organic by Indian Organic Certification Agency'
  },
  {
    id: 'prod_002',
    name: 'Trichoderma Viride Bio Fungicide',
    description: 'A powerful bio-fungicide that protects crops from soil-borne diseases. Enhances root growth.',
    price: 750,
    currency: 'INR',
    image: getImage('product_trichoderma'),
    imageHint: getImageHint('product_trichoderma'),
    type: 'Organic Fungicide',
    isGovtApproved: true,
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 1.8, // kg CO2 equivalent per application
      waterUsage: 300, // liters per hectare
      biodiversityImpact: 'Positive'
    },
    isOrganic: true,
    organicCertification: ' certified organic by Indian Organic Certification Agency'
  },
  {
    id: 'prod_003',
    name: 'Mancozeb 75% WP',
    description: 'A widely-used contact fungicide for controlling a broad spectrum of diseases in potato and tomato.',
    price: 600,
    currency: 'INR',
    image: getImage('product_mancozeb'),
    imageHint: getImageHint('product_mancozeb'),
    type: 'Chemical Fungicide',
    isGovtApproved: true,
    toxicity: 'Medium',
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 8.5, // kg CO2 equivalent per application
      waterUsage: 800, // liters per hectare
      biodiversityImpact: 'Negative'
    },
    isOrganic: false
  },
  {
    id: 'prod_004',
    name: 'Copper Oxychloride',
    description: 'A protective fungicide used to control late blight in potatoes and tomatoes. Govt approved.',
    price: 550,
    currency: 'INR',
    image: getImage('product_copper_oxychloride'),
    imageHint: getImageHint('product_copper_oxychloride'),
    type: 'Chemical Fungicide',
    isGovtApproved: true,
    toxicity: 'Low',
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 6.2, // kg CO2 equivalent per application
      waterUsage: 600, // liters per hectare
      biodiversityImpact: 'Neutral'
    },
    isOrganic: false
  },
  {
    id: 'prod_005',
    name: 'Beauveria Bassiana Bio-insecticide',
    description: 'An eco-friendly bio-insecticide for managing a wide range of pests. Safe for beneficial insects.',
    price: 800,
    currency: 'INR',
    image: getImage('product_beauveria'),
    imageHint: getImageHint('product_beauveria'),
    type: 'Organic Insecticide',
    isGovtApproved: true,
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 2.1, // kg CO2 equivalent per application
      waterUsage: 400, // liters per hectare
      biodiversityImpact: 'Positive'
    },
    isOrganic: true,
    organicCertification: ' certified organic by Indian Organic Certification Agency'
  },
  {
    id: 'prod_006',
    name: 'Seaweed Extract Bio-stimulant',
    description: 'Promotes root growth and improves nutrient uptake, making plants healthier and more resilient.',
    price: 950,
    currency: 'INR',
    image: getImage('product_seaweed_extract'),
    imageHint: getImageHint('product_seaweed_extract'),
    type: 'Bio-stimulant',
    isGovtApproved: true,
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 3.7, // kg CO2 equivalent per application
      waterUsage: 350, // liters per hectare
      biodiversityImpact: 'Positive'
    },
    isOrganic: true,
    organicCertification: ' certified organic by Indian Organic Certification Agency'
  },
  {
    id: 'prod_007',
    name: 'Verticillium Lecanii',
    description: 'An effective organic insecticide for controlling sucking pests like aphids, jassids, and whiteflies.',
    price: 850,
    currency: 'INR',
    image: getImage('product_verticillium'),
    imageHint: getImageHint('product_verticillium'),
    type: 'Organic Insecticide',
    isGovtApproved: true,
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 1.9, // kg CO2 equivalent per application
      waterUsage: 380, // liters per hectare
      biodiversityImpact: 'Positive'
    },
    isOrganic: true,
    organicCertification: ' certified organic by Indian Organic Certification Agency'
  }
];

export const mockStoreLocations: StoreLocation[] = [
  // Hyderabad and surrounding areas
  {
    id: 'store_hyd_01',
    name: 'Shamshabad Agro Agency',
    address: 'RGI Airport Road, Shamshabad, Hyderabad',
    latitude: 17.2402,
    longitude: 78.4304,
  },
  {
    id: 'store_hyd_02',
    name: 'Ghatkesar Farmers Cooperative',
    address: 'Near ORR, Ghatkesar, Hyderabad',
    latitude: 17.4249,
    longitude: 78.6833,
  },
  {
    id: 'store_hyd_03',
    name: 'Medchal Rythu Seva Kendram',
    address: 'Main Road, Medchal, Telangana',
    latitude: 17.6338,
    longitude: 78.4833,
  },
  {
    id: 'store_hyd_04',
    name: 'Siddipet Agri Supplies',
    address: 'Bus Stand Road, Siddipet, Telangana',
    latitude: 18.1030,
    longitude: 78.8524,
  },
  {
    id: 'store_hyd_05',
    name: 'Secunderabad Pesticides',
    address: 'Market Street, Secunderabad, Hyderabad',
    latitude: 17.4399,
    longitude: 78.4983,
  },
  // Rest of India
  {
    id: 'store_haryana_01',
    name: 'Kisan Seva Kendra',
    address: '123, Main Market, Karnal, Haryana',
    latitude: 29.6857,
    longitude: 76.9905,
  },
  {
    id: 'store_ap_01',
    name: 'Agri Junction',
    address: '45, Ring Road, Guntur, Andhra Pradesh',
    latitude: 16.3067,
    longitude: 80.4365,
  },
  {
    id: 'store_mh_01',
    name: 'Farm Essentials',
    address: '78, Mumbai-Agra Highway, Nashik, Maharashtra',
    latitude: 20.00,
    longitude: 73.78,
  },
  {
    id: 'store_hp_01',
    name: 'Himachal Agro Solutions',
    address: '9, Mall Road, Solan, Himachal Pradesh',
    latitude: 30.9083,
    longitude: 77.0996,
  },
  {
    id: 'store_mh_02',
    name: 'Deccan Farm Supplies',
    address: '56, Pune-Bangalore Highway, Pune, Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
  },
  {
    id: 'store_punjab_01',
    name: 'Punjab Agro-Tech',
    address: 'Ferozepur Road, Ludhiana, Punjab',
    latitude: 30.9010,
    longitude: 75.8573,
  },
  {
    id: 'store_up_01',
    name: 'Ganga Agro Inputs',
    address: 'GT Road, Kanpur, Uttar Pradesh',
    latitude: 26.4499,
    longitude: 80.3319,
  },
  {
    id: 'store_mp_01',
    name: 'Narmada Kisan Kendra',
    address: 'Hoshangabad Road, Bhopal, Madhya Pradesh',
    latitude: 23.2599,
    longitude: 77.4126,
  },
  {
    id: 'store_ka_01',
    name: 'Cauvery Agri Center',
    address: 'Ring Road, Mysore, Karnataka',
    latitude: 12.2958,
    longitude: 76.6394,
  },
  {
    id: 'store_odisha_01',
    name: 'East Coast Farm Needs',
    address: 'Cuttack Road, Bhubaneswar, Odisha',
    latitude: 20.2961,
    longitude: 85.8245,
  }
];

export const mockForecast: WeatherForecast[] = [
    { condition: 'Partly Cloudy', temp: { max: 32, min: 24 }, humidity: 75, rainChance: 20 },
    { condition: 'Partly Cloudy', temp: { max: 33, min: 25 }, humidity: 80, rainChance: 30 },
    { condition: 'Thunderstorms', temp: { max: 30, min: 23 }, humidity: 88, rainChance: 70 },
    { condition: 'Thunderstorms', temp: { max: 29, min: 22 }, humidity: 90, rainChance: 80 },
    { condition: 'Rain', temp: { max: 28, min: 22 }, humidity: 92, rainChance: 60 },
    { condition: 'Partly Cloudy', temp: { max: 31, min: 24 }, humidity: 85, rainChance: 20 },
    { condition: 'Sunny', temp: { max: 34, min: 26 }, humidity: 70, rainChance: 10 },
    { condition: 'Sunny', temp: { max: 35, min: 27 }, humidity: 68, rainChance: 5 },
    { condition: 'Partly Cloudy', temp: { max: 34, min: 26 }, humidity: 72, rainChance: 15 },
    { condition: 'Cloudy', temp: { max: 31, min: 24 }, humidity: 78, rainChance: 25 },
    { condition: 'Rain', temp: { max: 29, min: 23 }, humidity: 85, rainChance: 55 },
    { condition: 'Thunderstorms', temp: { max: 30, min: 24 }, humidity: 88, rainChance: 65 },
    { condition: 'Partly Cloudy', temp: { max: 32, min: 25 }, humidity: 80, rainChance: 20 },
    { condition: 'Sunny', temp: { max: 34, min: 26 }, humidity: 75, rainChance: 10 },
];

export const mockSoilData: SoilData = {
    type: 'Loam',
    moisture: 28,
    ph: 6.8,
    nutrients: {
        nitrogen: 'Medium',
        phosphorus: 'High',
        potassium: 'Medium',
    }
};

export const mockConversations: Conversation[] = [
    {
        id: 'convo_001',
        analysisId: 'case_001',
        title: 'Chat about Tomato Late Blight',
        lastMessageTimestamp: '2024-07-21T11:00:00Z',
        analysisContext: JSON.stringify({
            disease: 'Tomato Late Blight',
            confidence: 0.92,
            severity: { percentage: 45, band: 'Medium' },
            risk: 0.75,
        }),
        messages: [
            { sender: 'user', text: 'What is the best organic way to treat this?' },
            { sender: 'bot', text: 'For Tomato Late Blight, a good organic first step is to spray with a copper-based fungicide or a neem oil solution. Also, be sure to remove and destroy infected leaves to prevent it from spreading.' },
            { sender: 'user', text: 'How often should I spray neem oil?' },
            { sender: 'bot', text: 'You should spray neem oil every 7-14 days, and more frequently if you are seeing heavy rain, as it can wash the oil off the leaves. Always follow the product instructions for the correct mixture.' },
        ]
    },
    {
        id: 'convo_003',
        analysisId: 'case_003',
        title: 'Chat about Potato Early Blight',
        lastMessageTimestamp: '2024-07-20T11:00:00Z',
        analysisContext: JSON.stringify({
            disease: 'Potato Early Blight',
            confidence: 0.98,
            severity: { percentage: 25, band: 'Medium' },
            risk: 0.60,
        }),
        messages: [
            { sender: 'user', text: 'Can I use the same treatment for my tomato plants?' },
            { sender: 'bot', text: 'Yes, Early Blight affects both potatoes and tomatoes, and the treatment methods are very similar. Good crop rotation, removing infected debris, and using fungicides like mancozeb or chlorothalonil are effective. For organic options, copper-based sprays are recommended.' },
        ]
    }
];

// Knowledge Sharing Platform Mock Data
export const mockKnowledgeProblems: KnowledgeProblem[] = [
  {
    id: 'prob_001',
    title: 'Tomato plants showing yellowing leaves',
    description: 'My tomato plants are showing yellowing leaves starting from the bottom. What could be the issue?',
    crop: 'Tomato',
    location: 'Hyderabad, Telangana',
    region: 'South India',
    postedAt: '2024-07-15T10:30:00Z',
    postedBy: 'anonymous_farmer_001',
    isAnonymous: true,
    category: 'Nutrition',
    upvotes: 12,
    downvotes: 2,
    status: 'Solved',
    views: 156,
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 15.5, // kg CO2 equivalent
      waterUsage: 2500, // liters per plant
      biodiversityImpact: 'Neutral'
    },
    organicTreatmentAlternatives: ['Compost application', 'Seaweed-based fertilizer', 'Neem cake']
  },
  {
    id: 'prob_002',
    title: 'Pests eating holes in potato leaves',
    description: 'I am noticing holes in my potato leaves and some small insects. What are they and how can I control them organically?',
    crop: 'Potato',
    location: 'Nashik, Maharashtra',
    region: 'West India',
    postedAt: '2024-07-20T14:15:00Z',
    postedBy: 'anonymous_farmer_002',
    isAnonymous: true,
    category: 'Pest',
    upvotes: 8,
    downvotes: 1,
    status: 'Open',
    views: 89,
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 12.3, // kg CO2 equivalent
      waterUsage: 3200, // liters per plant
      biodiversityImpact: 'Positive'
    },
    organicTreatmentAlternatives: ['Neem oil spray', 'Beneficial insect introduction', 'Handpicking']
  },
  {
    id: 'prob_003',
    title: 'Maize crop affected by heavy rains',
    description: 'Heavy rains have affected my maize crop. Some plants are showing signs of rot. What should I do?',
    crop: 'Maize',
    location: 'Karnal, Haryana',
    region: 'North India',
    postedAt: '2024-07-22T09:45:00Z',
    postedBy: 'anonymous_farmer_003',
    isAnonymous: true,
    category: 'Weather',
    upvotes: 15,
    downvotes: 0,
    status: 'In Progress',
    views: 203,
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 18.7, // kg CO2 equivalent
      waterUsage: 4500, // liters per plant
      biodiversityImpact: 'Negative'
    },
    organicTreatmentAlternatives: ['Improve drainage', 'Crop rotation', 'Organic fungicides']
  },
];

export const mockKnowledgeSolutions: KnowledgeSolution[] = [
  {
    id: 'sol_001',
    problemId: 'prob_001',
    title: 'Solution for tomato yellowing leaves',
    description: 'This is likely a nitrogen deficiency. Apply a balanced fertilizer with higher nitrogen content. Also, check for proper drainage as waterlogged soil can cause similar symptoms.',
    postedAt: '2024-07-16T11:20:00Z',
    postedBy: 'experienced_farmer_001',
    isAnonymous: false,
    upvotes: 18,
    downvotes: 1,
    verifiedByExpert: true,
    expertId: 'expert_001',
    expertName: 'Dr. Ramesh Kumar',
    expertVerifiedAt: '2024-07-17T09:30:00Z',
    helpfulCount: 15,
    notHelpfulCount: 2,
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 8.2, // kg CO2 equivalent
      waterUsage: 1200, // liters per plant
      biodiversityImpact: 'Neutral'
    },
    organicTreatmentAlternatives: ['Compost application', 'Seaweed-based fertilizer'],
    isOrganic: false
  },
  {
    id: 'sol_002',
    problemId: 'prob_001',
    title: 'Organic solution for tomato yellowing',
    description: 'Try adding compost or well-rotted manure to the soil. You can also use a seaweed-based fertilizer which provides micronutrients. Water consistently to avoid stress.',
    postedAt: '2024-07-16T14:45:00Z',
    postedBy: 'organic_farmer_001',
    isAnonymous: true,
    upvotes: 12,
    downvotes: 0,
    verifiedByExpert: false,
    helpfulCount: 9,
    notHelpfulCount: 1,
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 2.1, // kg CO2 equivalent
      waterUsage: 800, // liters per plant
      biodiversityImpact: 'Positive'
    },
    organicTreatmentAlternatives: ['Compost application', 'Seaweed-based fertilizer', 'Neem cake'],
    isOrganic: true
  },
  {
    id: 'sol_003',
    problemId: 'prob_002',
    title: 'Control potato pests organically',
    description: 'These are likely potato beetles. You can handpick them in the early morning. Neem oil spray or a mixture of soap and water can help. Introduce beneficial insects like ladybugs.',
    postedAt: '2024-07-21T10:30:00Z',
    postedBy: 'pest_control_expert_001',
    isAnonymous: false,
    upvotes: 9,
    downvotes: 0,
    verifiedByExpert: true,
    expertId: 'expert_002',
    expertName: 'Dr. Priya Sharma',
    expertVerifiedAt: '2024-07-21T15:45:00Z',
    helpfulCount: 7,
    notHelpfulCount: 0,
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 1.8, // kg CO2 equivalent
      waterUsage: 500, // liters per plant
      biodiversityImpact: 'Positive'
    },
    organicTreatmentAlternatives: ['Neem oil spray', 'Beneficial insect introduction', 'Handpicking'],
    isOrganic: true
  },
];

export const mockBestPractices: BestPractice[] = [
  {
    id: 'bp_001',
    title: 'Intercropping for pest control',
    description: 'Planting marigold around tomato plants helps repel nematodes and other pests. This traditional practice has been validated by many farmers in South India.',
    region: 'South India',
    crop: 'Tomato',
    category: 'Pest',
    postedAt: '2024-06-10T08:00:00Z',
    postedBy: 'traditional_farmer_001',
    upvotes: 42,
    downvotes: 2,
    verifiedByExpert: true,
    expertId: 'expert_003',
    expertName: 'Dr. Suresh Reddy',
    expertVerifiedAt: '2024-06-15T11:30:00Z',
    successRate: 85,
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 3.5, // kg CO2 equivalent
      waterUsage: 1800, // liters per plant
      biodiversityImpact: 'Positive'
    },
    organicTreatmentAlternatives: ['Marigold intercropping', 'Neem-based pesticides'],
    isOrganic: true,
    waterConservationTechnique: 'Mulching'
  },
  {
    id: 'bp_002',
    title: 'Drip irrigation for water conservation',
    description: 'Using drip irrigation in potato farming can save up to 40% water while maintaining yield. Install pipes with emitters near the root zone.',
    region: 'West India',
    crop: 'Potato',
    category: 'Other',
    postedAt: '2024-05-22T14:20:00Z',
    postedBy: 'progressive_farmer_001',
    upvotes: 38,
    downvotes: 1,
    verifiedByExpert: true,
    expertId: 'expert_004',
    expertName: 'Dr. Anil Patel',
    expertVerifiedAt: '2024-05-28T09:15:00Z',
    successRate: 92,
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 5.2, // kg CO2 equivalent
      waterUsage: 1200, // liters per plant
      biodiversityImpact: 'Neutral'
    },
    organicTreatmentAlternatives: ['Organic fertilizers with drip system'],
    isOrganic: false,
    waterConservationTechnique: 'Drip irrigation'
  },
  {
    id: 'bp_003',
    title: 'Soil preparation for maize',
    description: 'Deep plowing followed by two harrowings helps create a fine tilth for maize. Add well-decomposed farmyard manure at 10-15 tons per hectare before sowing.',
    region: 'North India',
    crop: 'Maize',
    category: 'Soil',
    postedAt: '2024-04-18T11:45:00Z',
    postedBy: 'seasoned_farmer_001',
    upvotes: 56,
    downvotes: 0,
    verifiedByExpert: true,
    expertId: 'expert_005',
    expertName: 'Dr. Rajesh Singh',
    expertVerifiedAt: '2024-04-22T16:30:00Z',
    successRate: 88,
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 12.8, // kg CO2 equivalent
      waterUsage: 3500, // liters per plant
      biodiversityImpact: 'Neutral'
    },
    organicTreatmentAlternatives: ['Farmyard manure', 'Green manuring'],
    isOrganic: true,
    waterConservationTechnique: 'Contour farming'
  },
];

export const mockSuccessStories: SuccessStory[] = [
  {
    id: 'ss_001',
    title: 'Tripling tomato yield with organic methods',
    description: 'By implementing integrated pest management and organic fertilization, I was able to triple my tomato yield while reducing costs.',
    farmerName: 'Rajesh Kumar',
    location: 'Bangalore, Karnataka',
    region: 'South India',
    crop: 'Tomato',
    problem: 'Low yield and high pesticide costs',
    solution: 'Switched to organic farming with neem-based pesticides and compost',
    beforeYield: 8,
    afterYield: 24,
    yieldImprovement: 200,
    costSavings: 45,
    timePeriod: '6 months',
    postedAt: '2024-07-01T12:00:00Z',
    upvotes: 89,
    downvotes: 2,
    verifiedByExpert: true,
    expertId: 'expert_006',
    expertName: 'Dr. Meena Desai',
    expertVerifiedAt: '2024-07-05T10:30:00Z',
    images: [
      getImage('success_story_1_before'),
      getImage('success_story_1_after'),
    ],
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 4.3, // kg CO2 equivalent
      waterUsage: 1500, // liters per plant
      biodiversityImpact: 'Positive'
    },
    organicTreatmentAlternatives: ['Neem-based pesticides', 'Compost', 'Beneficial insects'],
    isOrganic: true,
    waterConservationTechnique: 'Mulching',
    biodiversityImpactDescription: 'Increased beneficial insect population by 40%'
  },
  {
    id: 'ss_002',
    title: 'Drip irrigation saves water and increases potato yield',
    description: 'Installing drip irrigation system helped me save water and get better yields in my potato farm.',
    farmerName: 'Anil Patel',
    location: 'Ahmedabad, Gujarat',
    region: 'West India',
    crop: 'Potato',
    problem: 'Water scarcity and inconsistent yields',
    solution: 'Installed drip irrigation system with fertigation',
    beforeYield: 15,
    afterYield: 25,
    yieldImprovement: 67,
    costSavings: 30,
    timePeriod: '1 year',
    postedAt: '2024-06-15T09:30:00Z',
    upvotes: 76,
    downvotes: 1,
    verifiedByExpert: true,
    expertId: 'expert_007',
    expertName: 'Dr. Vijay Shah',
    expertVerifiedAt: '2024-06-20T14:45:00Z',
    images: [
      getImage('success_story_2_before'),
      getImage('success_story_2_after'),
    ],
    // Environmental metrics
    environmentalImpact: {
      carbonFootprint: 6.7, // kg CO2 equivalent
      waterUsage: 2200, // liters per plant
      biodiversityImpact: 'Neutral'
    },
    organicTreatmentAlternatives: ['Organic fertilizers with drip system'],
    isOrganic: false,
    waterConservationTechnique: 'Drip irrigation',
    biodiversityImpactDescription: 'No significant change in biodiversity'
  },
];
