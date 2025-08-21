# Deployment Navigation Debug Guide

## Problem Summary
- **Issue**: Navigation works perfectly in local development but fails on Vercel deployment
- **Domain**: v0-inopnc-20250811.vercel.app (August 11 deployment)
- **Error Pattern**: RSC (React Server Components) requests failing with `_rsc` query parameters
- **Affected Routes**: `/dashboard/site-info`, `/dashboard/daily-reports`, `/dashboard/attendance`

## Root Causes Analysis

### 1. Service Worker Cache Issues
The service worker is caching old navigation patterns and preventing new code from loading.

**Symptoms:**
- ServiceWorker loads successfully but serves cached responses
- RSC requests fail because they're hitting cached endpoints

**Solution:**
```bash
# Run the fix script to update service worker version
./scripts/fix-deployment-navigation.sh
```

### 2. Stale Deployment Cache
The domain `v0-inopnc-20250811.vercel.app` suggests an old deployment from August 11.

**Check current deployment:**
```bash
vercel list
```

### 3. Browser Cache Issues
Browser is caching old service worker and RSC responses.

**Solution:**
1. Open Chrome DevTools (F12)
2. Go to Application tab
3. Storage -> Clear site data
4. Service Workers -> Unregister all
5. Hard refresh (Ctrl+Shift+R)

## Immediate Fix Steps

### Step 1: Update Service Worker
```bash
# This updates cache versions to force refresh
./scripts/fix-deployment-navigation.sh
```

### Step 2: Clear Build Cache
```bash
rm -rf .next
rm -rf .vercel
rm -rf node_modules/.cache
```

### Step 3: Test Build Locally
```bash
npm run build
npm run start
# Test navigation at http://localhost:3000
```

### Step 4: Deploy to Vercel
```bash
# Option 1: Deploy via CLI
vercel --prod --force

# Option 2: Push to main branch
git add .
git commit -m "Fix navigation: Update service worker and clear caches"
git push origin main
```

### Step 5: Verify Deployment
1. Wait for deployment to complete
2. Get the new deployment URL from Vercel dashboard
3. Test in incognito/private window
4. Check console for any remaining errors

## Advanced Debugging

### Check RSC Endpoints
RSC requests use `_rsc` query parameters. These might be cached or incorrectly routed.

```javascript
// In browser console
fetch('/dashboard/documents?_rsc=test')
  .then(r => r.text())
  .then(console.log)
  .catch(console.error)
```

### Verify Service Worker Registration
```javascript
// In browser console
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    registrations.forEach(reg => {
      console.log('SW Scope:', reg.scope);
      console.log('SW State:', reg.active?.state);
    });
  });
```

### Check Vercel Function Logs
```bash
vercel logs [your-deployment-url]
```

### Environment Variables
Ensure all required environment variables are set in Vercel:
```bash
vercel env ls production
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Prevention Strategies

### 1. Service Worker Versioning
Always update service worker cache versions when making navigation changes:
```javascript
const CACHE_NAME = 'inopnc-wm-v1.2.timestamp'
```

### 2. Disable Service Worker in Development
For testing without service worker interference:
```javascript
// In app/layout.tsx or equivalent
if (process.env.NODE_ENV === 'development') {
  navigator.serviceWorker?.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });
}
```

### 3. Add Cache Headers
In `vercel.json`, add cache control headers:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

## Testing Checklist

- [ ] Clear all browser cache and cookies
- [ ] Unregister all service workers
- [ ] Test in incognito/private window
- [ ] Test on different browser
- [ ] Check network tab for failed requests
- [ ] Verify console has no errors
- [ ] Test all navigation menu items
- [ ] Verify quick menu navigation works
- [ ] Check mobile navigation (bottom nav)

## Emergency Rollback

If issues persist after deployment:

1. **Disable Service Worker Temporarily:**
```javascript
// In public/sw.js, add at the top:
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', () => {
  self.clients.claim();
  // Clear all caches
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  });
});
```

2. **Force Redeploy:**
```bash
vercel --prod --force --no-cache
```

3. **Revert to Last Working Commit:**
```bash
git log --oneline -n 10
git revert [commit-hash]
git push origin main
```

## Contact for Help

If navigation issues persist after following this guide:
1. Check Vercel Status: https://www.vercel-status.com/
2. Review deployment logs in Vercel dashboard
3. Test with `curl` to isolate browser issues:
```bash
curl -H "Accept: text/x-component" \
  "https://[your-domain]/dashboard/documents?_rsc=test"
```

## Notes

- The `v0-inopnc-20250811` domain appears to be an old deployment
- Current date is 2025-08-21, so this is a 10-day old deployment
- Ensure you're testing on the latest deployment URL
- Consider setting up preview deployments for testing before production