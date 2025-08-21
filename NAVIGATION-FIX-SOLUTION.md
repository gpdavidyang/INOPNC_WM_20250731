# Navigation Fix Solution for Vercel Deployment

## Executive Summary
The navigation works locally but fails on Vercel deployment due to **service worker caching old routes**. The console shows RSC (React Server Components) requests failing for dashboard routes.

## Root Cause
1. **Service Worker Cache**: The service worker (v1.1.1) is aggressively caching navigation requests
2. **Old Deployment Domain**: The errors reference `v0-inopnc-20250811.vercel.app` (10 days old)
3. **RSC Request Failures**: Next.js RSC requests with `_rsc` parameters are being cached/blocked

## Immediate Solution

### Option 1: Quick Fix (Recommended)
Run this command to fix immediately:
```bash
./scripts/quick-deployment-fix.sh
```

This script:
- Updates service worker cache version
- Commits and pushes changes
- Triggers new Vercel deployment

### Option 2: Manual Fix
```bash
# 1. Update service worker version in public/sw.js
# Change these lines to new version numbers:
const CACHE_NAME = 'inopnc-wm-v1.3.0'
const STATIC_CACHE = 'inopnc-static-v1.3.0'
const API_CACHE = 'inopnc-api-v1.3.0'

# 2. Commit and push
git add public/sw.js
git commit -m "Fix navigation: Force service worker cache refresh"
git push origin main

# 3. Wait for Vercel deployment (2-3 minutes)
```

## Browser Cleanup (Required)

After deployment, users MUST clear their browser cache:

### Chrome/Edge:
1. Press F12 to open DevTools
2. Go to Application tab
3. Storage → Clear site data
4. Service Workers → Unregister all workers
5. Hard refresh: Ctrl+Shift+R

### Safari:
1. Develop menu → Empty Caches
2. Hold Shift and click Reload

### Firefox:
1. Ctrl+Shift+Delete
2. Select "Cache" and "Offline Website Data"
3. Clear Now

## Testing After Fix

1. **Test in Incognito/Private Window** (no cache)
2. **Check Console** for any remaining errors
3. **Test All Menu Items**:
   - 홈(빠른메뉴)
   - 출력현황
   - 작업일지
   - 문서함
   - 내정보

## Why This Happened

1. **Service Worker Lifecycle**: Service workers cache aggressively for offline support
2. **Navigation Changes**: Recent navigation updates weren't reflected due to cached service worker
3. **RSC Caching**: Next.js RSC requests were being incorrectly cached

## Prevention for Future

### 1. Auto-Version Service Worker
Add to your deployment pipeline:
```javascript
// In build script
const version = new Date().toISOString();
// Update sw.js with new version
```

### 2. Add Cache Busting Headers
In `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/sw.js",
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

### 3. Service Worker Update Strategy
Add to `public/sw.js`:
```javascript
// Force update on navigation changes
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
```

## Verification Commands

### Check Deployment Status
```bash
vercel list
# Look for latest deployment URL
```

### Test RSC Endpoints
```javascript
// Run in browser console
fetch('/dashboard/documents?_rsc=test', {
  headers: { 'RSC': '1' }
}).then(r => {
  console.log('Status:', r.status);
  return r.text();
}).then(console.log);
```

### Check Service Worker
```javascript
// Run in browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => {
    console.log('Version:', reg.active?.scriptURL);
    console.log('State:', reg.active?.state);
  });
});
```

## Emergency Fallback

If navigation still fails after all fixes:

### 1. Disable Service Worker Completely
```javascript
// Add to app/layout.tsx
useEffect(() => {
  if (typeof window !== 'undefined') {
    navigator.serviceWorker?.getRegistrations().then(regs => {
      regs.forEach(reg => reg.unregister());
    });
  }
}, []);
```

### 2. Force Clean Deployment
```bash
rm -rf .next .vercel node_modules/.cache
vercel --prod --force
```

### 3. Use Direct URL
Instead of clicking menu items, try direct URL navigation:
- `https://[your-domain]/dashboard/documents`
- `https://[your-domain]/dashboard/daily-reports`
- `https://[your-domain]/dashboard/attendance`

## Success Indicators

✅ No console errors about RSC requests
✅ All menu items navigate correctly
✅ Service worker shows new version number
✅ Network tab shows successful 200 responses
✅ No redirect loops

## Contact Support

If issues persist after trying all solutions:
1. Share browser console errors
2. Share network tab screenshot
3. Share service worker version from Application tab
4. Note which browser/device you're using

---

**Quick Checklist:**
- [ ] Run quick-deployment-fix.sh
- [ ] Wait for Vercel deployment
- [ ] Clear browser cache completely
- [ ] Test in incognito window
- [ ] Verify all menu items work

---

*Last Updated: 2025-08-21*
*Issue: Navigation fails on deployed version but works locally*
*Solution: Force service worker cache refresh*