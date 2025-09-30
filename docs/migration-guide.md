# Backend Integration Migration Guide

This guide outlines how to migrate from the current mock data and server actions to the new API-based backend integration.

## Overview

The migration involves:
1. Replacing server actions with API calls
2. Updating components to use the new API client
3. Implementing proper error handling
4. Adding loading states
5. Updating authentication flow

## Phase 1: Authentication Migration

### Current Implementation
```typescript
// src/context/auth-context.tsx
const login = () => {
  localStorage.setItem('isAuthenticated', 'true');
  setIsAuthenticated(true);
};
```

### New Implementation
```typescript
// Already updated in src/context/auth-context.tsx
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  // Handle response and store token
};
```

### Migration Steps
1. ✅ Updated `src/context/auth-context.tsx` with new API-based authentication
2. ✅ Updated `src/app/login/page.tsx` to use new login flow
3. ✅ Created `/api/auth/login` and `/api/auth/logout` endpoints

## Phase 2: Analysis Pipeline Migration

### Current Implementation
```typescript
// src/app/dashboard/analyze/actions.ts
export async function analyzeImage(formData: FormData) {
  // Direct AI flow calls
  const classification = await classifyPlantDisease({ photoDataUri, language: locale });
  // ... other AI flows
}
```

### New Implementation
```typescript
// Using API client
import { apiClient } from '@/lib/api-client';

const result = await apiClient.analyzeImage(formData);
if (result.success) {
  // Handle successful analysis
} else {
  // Handle error
}
```

### Migration Steps
1. ✅ Created `/api/analyze` endpoint
2. ✅ Created API client with `analyzeImage` method
3. 🔄 **TODO**: Update `src/app/dashboard/analyze/analysis-view.tsx` to use API client
4. 🔄 **TODO**: Update error handling in analysis components

### Component Updates Needed

#### `src/app/dashboard/analyze/analysis-view.tsx`
```typescript
// Replace server action import
// import { analyzeImage } from './actions';

// With API client
import { apiClient } from '@/lib/api-client';

// Update the analysis function
const handleAnalysis = async () => {
  setIsLoading(true);
  
  const formData = new FormData();
  if (image) formData.append('photoDataUri', image);
  if (textQuery) formData.append('textQuery', textQuery);
  if (audioBlob) formData.append('audioDataUri', audioDataUri);
  formData.append('locale', locale);

  const result = await apiClient.analyzeImage(formData);
  
  if (result.success && result.data) {
    setAnalysisResult(result.data);
  } else {
    setError(result.error || 'Analysis failed');
  }
  
  setIsLoading(false);
};
```

## Phase 3: Data Fetching Migration

### Current Implementation (Mock Data)
```typescript
// Components directly import mock data
import { mockHistory, mockConversations } from '@/lib/mock-data';
```

### New Implementation (API Calls)
```typescript
// Use API client with proper loading states
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    const result = await apiClient.getAnalyses();
    if (result.success) {
      setData(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };
  
  fetchData();
}, []);
```

### Components to Update

#### 1. `src/app/dashboard/history/page.tsx`
- Replace `mockHistory` with `apiClient.getAnalyses()`
- Add loading and error states
- Implement pagination
- Add filtering functionality

#### 2. `src/app/dashboard/history/[id]/page.tsx`
- Replace mock data reconstruction with `apiClient.getAnalysis(id)`
- Handle loading and error states

#### 3. `src/app/dashboard/conversations/page.tsx`
- Replace `mockConversations` with `apiClient.getConversations()`
- Add pagination support

#### 4. `src/app/dashboard/conversations/[id]/page.tsx`
- Update to use `apiClient.getConversationMessages(id)`
- Update message sending to use `apiClient.sendMessage()`

#### 5. `src/app/dashboard/review/page.tsx`
- Replace `reviewQueue` with `apiClient.getReviewQueue()`
- Update review submission to use `apiClient.submitReview()`

#### 6. `src/app/dashboard/community/page.tsx`
- Replace `communityOutbreaks` with `apiClient.getOutbreaks()`
- Add geolocation-based filtering

#### 7. `src/app/dashboard/store/page.tsx`
- Replace `mockProducts` with `apiClient.getProducts()`
- Implement recommendation-based filtering

#### 8. `src/components/cart-sheet.tsx`
- Update checkout to use `apiClient.checkout()`

## Phase 4: Real-time Features (Future)

### WebSocket Integration
```typescript
// Future implementation for real-time updates
const useRealtimeOutbreaks = () => {
  const [outbreaks, setOutbreaks] = useState([]);
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000/ws/outbreaks');
    
    ws.onmessage = (event) => {
      const newOutbreak = JSON.parse(event.data);
      setOutbreaks(prev => [...prev, newOutbreak]);
    };
    
    return () => ws.close();
  }, []);
  
  return outbreaks;
};
```

## Migration Checklist

### Phase 1: Core Infrastructure ✅
- [x] Authentication API endpoints
- [x] Updated AuthContext
- [x] Updated login page
- [x] API client utility

### Phase 2: Analysis Pipeline ✅
- [x] Analysis API endpoint
- [x] Conversation API endpoints
- [ ] Update analysis components to use API client
- [ ] Add proper error handling

### Phase 3: Data Migration 🔄
- [ ] Update history page
- [ ] Update conversation pages
- [ ] Update review queue
- [ ] Update community page
- [ ] Update store page
- [ ] Update checkout flow

### Phase 4: Additional APIs ✅
- [x] Review queue API
- [x] Outbreaks API
- [x] Products API
- [x] Orders API
- [x] Weather API

### Phase 5: Error Handling & UX
- [ ] Global error boundary
- [ ] Loading states for all API calls
- [ ] Retry mechanisms
- [ ] Offline support
- [ ] Toast notifications for API errors

### Phase 6: Testing
- [ ] Unit tests for API client
- [ ] Integration tests for key flows
- [ ] E2E tests for critical paths

## Implementation Priority

### High Priority (Week 1)
1. Complete analysis pipeline migration
2. Update history and conversation pages
3. Implement proper error handling

### Medium Priority (Week 2)
1. Update remaining data-driven pages
2. Implement checkout flow
3. Add loading states everywhere

### Low Priority (Week 3)
1. Real-time features
2. Advanced error handling
3. Performance optimizations

## Testing Strategy

### API Testing
```typescript
// Example test for API client
describe('ApiClient', () => {
  it('should handle successful login', async () => {
    const mockResponse = { success: true, token: 'mock-token', user: {} };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await apiClient.login('test@example.com', 'password');
    expect(result.success).toBe(true);
    expect(result.data?.token).toBe('mock-token');
  });
});
```

### Component Testing
```typescript
// Example test for updated component
describe('AnalysisView', () => {
  it('should call API client on form submission', async () => {
    const mockAnalyzeImage = jest.spyOn(apiClient, 'analyzeImage');
    mockAnalyzeImage.mockResolvedValue({ success: true, data: mockAnalysisResult });

    render(<AnalysisView />);
    // Simulate form submission
    // Assert API client was called
  });
});
```

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback**: Revert to server actions by updating imports
2. **Partial Rollback**: Keep authentication changes, revert data fetching
3. **Feature Flags**: Implement feature flags to toggle between old and new implementations

## Performance Considerations

1. **Caching**: Implement response caching for frequently accessed data
2. **Pagination**: Ensure all list endpoints support pagination
3. **Debouncing**: Add debouncing for search and filter operations
4. **Lazy Loading**: Implement lazy loading for large datasets

## Security Considerations

1. **Token Management**: Secure token storage and refresh
2. **Input Validation**: Validate all inputs on both client and server
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **CORS**: Configure CORS properly for production

This migration guide provides a structured approach to transitioning from the current prototype to a production-ready application with proper backend integration.