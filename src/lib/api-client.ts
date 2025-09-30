/**
 * API Client for AgriAssist Backend Integration
 * 
 * This module provides a centralized way to interact with all backend APIs.
 * It handles authentication, error handling, and response formatting.
 */

import type { 
  FullAnalysisResponse, 
  AnalysisResult, 
  Conversation, 
  CommunityOutbreak, 
  StoreProduct, 
  WeatherForecast 
} from './types';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    
    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add any additional headers from options
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return result;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // Authentication APIs
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Analysis APIs
  async analyzeImage(formData: FormData) {
    return this.request<FullAnalysisResponse>('/analyze', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async getAnalyses(params: {
    page?: number;
    limit?: number;
    crop?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<{
      analyses: AnalysisResult[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/analyses?${searchParams}`);
  }

  async getAnalysis(id: string) {
    return this.request<{
      analysis: FullAnalysisResponse;
      conversation: Conversation | null;
      metadata: {
        id: string;
        timestamp: string;
        status: string;
        crop: string;
      };
    }>(`/analyses/${id}`);
  }

  async updateAnalysisStatus(id: string, status: 'Completed' | 'Pending Review') {
    return this.request(`/analyses/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteAnalysis(id: string) {
    return this.request(`/analyses/${id}`, {
      method: 'DELETE',
    });
  }

  // Conversation APIs
  async getConversations(params: { page?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<{
      conversations: Conversation[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/conversations?${searchParams}`);
  }

  async sendMessage(conversationId: string, question: string, analysisContext?: string, language = 'en') {
    return this.request<{
      userMessage: { sender: 'user'; text: string; timestamp: string };
      botMessage: { sender: 'bot'; text: string; timestamp: string };
      answer: string;
    }>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ question, analysisContext, language }),
    });
  }

  async getConversationMessages(conversationId: string) {
    return this.request<{
      messages: Array<{ sender: 'user' | 'bot'; text: string; timestamp: string }>;
    }>(`/conversations/${conversationId}/messages`);
  }

  // Review Queue APIs
  async getReviewQueue(params: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<{
      queue: any[];
      pagination: any;
      stats: {
        pending: number;
        reviewed: number;
        total: number;
      };
    }>(`/review-queue?${searchParams}`);
  }

  async submitReview(analysisId: string, review: {
    aiWasCorrect: boolean;
    expertLabel?: string;
    notes?: string;
  }) {
    return this.request(`/review-queue/${analysisId}`, {
      method: 'POST',
      body: JSON.stringify(review),
    });
  }

  // Community Outbreak APIs
  async getOutbreaks(params: {
    lat?: number;
    lng?: number;
    radius?: number;
    riskLevel?: string;
    disease?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<{
      outbreaks: CommunityOutbreak[];
      summary: {
        total: number;
        high: number;
        medium: number;
        low: number;
      };
    }>(`/outbreaks?${searchParams}`);
  }

  async reportOutbreak(outbreak: {
    disease: string;
    crop: string;
    location: string;
    latitude: number;
    longitude: number;
    description?: string;
  }) {
    return this.request(`/outbreaks`, {
      method: 'POST',
      body: JSON.stringify(outbreak),
    });
  }

  // Product APIs
  async getProducts(params: {
    disease?: string;
    crop?: string;
    type?: string;
    govtApproved?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<{
      products: StoreProduct[];
      pagination: any;
      filters: any;
      recommendations?: {
        message: string;
        priority: string;
      };
    }>(`/products?${searchParams}`);
  }

  // Order APIs
  async checkout(order: {
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>;
    shippingAddress: {
      name: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      phone: string;
    };
    paymentMethod?: 'stripe' | 'razorpay' | 'cod';
  }) {
    return this.request<{
      orderId: string;
      checkoutUrl?: string;
      paymentId: string;
      totalAmount: number;
      message: string;
    }>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  // Farm Data APIs
  async getWeatherData(params: {
    location?: string;
    lat?: string;
    lng?: string;
    days?: number;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<{
      location: string;
      forecast: WeatherForecast[];
      current: {
        temperature: number;
        humidity: number;
        windSpeed: number;
        condition: string;
        pressure: number;
        visibility: number;
      };
      alerts: Array<{
        type: string;
        severity: string;
        message: string;
        validUntil: string;
      }>;
    }>(`/farm-data/weather?${searchParams}`);
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing or custom instances
export { ApiClient };

// Helper hook for React components
export function useApiClient() {
  return apiClient;
}

// Error handling utilities
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: any): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (typeof error === 'object' && error.error) {
    return error.error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}