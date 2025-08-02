# Site Context Integration Guide

## Overview
The Site Context Provider manages global site state across the application, providing caching, offline support, and optimized API calls.

## Integration Steps

### 1. Add SiteProvider to App Layout

Update your `app/layout.tsx` to include the SiteProvider:

```tsx
import { SiteProvider } from "@/contexts/SiteContext";

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <ErrorBoundary>
          <AuthProvider>
            <SiteProvider>
              {children}
            </SiteProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### 2. Update Dashboard Layout

For authenticated routes, ensure the provider is available:

```tsx
// app/dashboard/layout.tsx
import { SiteProvider } from "@/contexts/SiteContext";

export default function DashboardLayout({ children }) {
  return (
    <SiteProvider>
      <div className="dashboard-layout">
        {children}
      </div>
    </SiteProvider>
  );
}
```

### 3. Using the Context in Components

#### Option A: Use with Context (Recommended)
```tsx
import { useCurrentSite } from '@/contexts/SiteContext';

export default function MyComponent() {
  const { currentSite, isLoading, error, refreshCurrentSite } = useCurrentSite();
  
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!currentSite) return <NoSiteMessage />;
  
  return (
    <div>
      <h1>{currentSite.name}</h1>
      <button onClick={refreshCurrentSite}>Refresh</button>
    </div>
  );
}
```

#### Option B: Direct Usage (Existing Implementation)
If you need to maintain backward compatibility, you can keep the existing implementation that directly fetches data.

### 4. Site Search Integration
```tsx
import { useSiteSearch } from '@/contexts/SiteContext';

export default function SiteSearchComponent() {
  const { searchSites } = useSiteSearch();
  const [results, setResults] = useState([]);
  
  const handleSearch = async (query: string) => {
    const sites = await searchSites({ siteName: query });
    setResults(sites);
  };
  
  return (
    // Search UI
  );
}
```

### 5. Site Switching
```tsx
import { useSiteContext } from '@/contexts/SiteContext';

export default function SiteSwitcher() {
  const { switchSite } = useSiteContext();
  
  const handleSiteChange = async (siteId: string) => {
    try {
      await switchSite(siteId);
      // Site switched successfully
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    // Site switcher UI
  );
}
```

## Features

### Caching
- Site data is cached for 5 minutes in localStorage
- Cache is automatically invalidated on site switch
- Manual cache clearing available via `clearCache()`

### Offline Support
- Cached data is shown while fresh data loads in background
- Works offline with previously cached data

### Optimistic Updates
- UI updates immediately on site switch
- Rollback on error

### Error Handling
- Comprehensive error states
- Graceful fallbacks for missing data

## Migration Path

To migrate existing components:

1. Replace direct Supabase queries with context hooks
2. Remove redundant loading/error states (handled by context)
3. Update refresh logic to use `refreshCurrentSite()`

## Example Migration

Before:
```tsx
const [siteInfo, setSiteInfo] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchSiteInfo();
}, []);

const fetchSiteInfo = async () => {
  // Direct Supabase queries
};
```

After:
```tsx
const { currentSite: siteInfo, isLoading: loading, refreshCurrentSite } = useCurrentSite();
// No need for useEffect or manual fetching
```

## Best Practices

1. **Use the custom hooks** - Don't access context directly
2. **Handle loading states** - Always show loading indicators
3. **Handle empty states** - Users might not have a site assigned
4. **Cache wisely** - Clear cache when necessary
5. **Error boundaries** - Wrap components that use context