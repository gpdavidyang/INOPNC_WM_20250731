// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Profiling for performance insights
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  
  // Server-specific integrations
  integrations: [
    Sentry.postgresIntegration(),
    Sentry.httpIntegration(),
  ],
  
  // Custom error filtering
  beforeSend(event, hint) {
    // Filter out known non-critical errors
    if (event.exception) {
      const error = hint.originalException
      
      // Skip connection timeout errors during high load
      if (error?.message?.includes('Connection timeout') || 
          error?.message?.includes('ECONNRESET')) {
        return null
      }
      
      // Skip RLS policy errors (expected for unauthorized access)
      if (error?.message?.includes('RLS') && 
          event.level === 'warning') {
        return null
      }
    }
    
    return event
  },
  
  // Tag all server events
  initialScope: {
    tags: {
      component: 'server',
      system: 'inopnc-wm'
    }
  },
  
  // Performance tracing
  tracePropagationTargets: [
    'localhost',
    /^https:\/\/.*\.supabase\.co/,
    /^https:\/\/inopnc.*\.vercel\.app/,
  ],
  
  // Custom metrics
  beforeSendTransaction(transaction) {
    // Add construction-specific context
    transaction.setTag('system', 'construction-management')
    
    // Track slow transactions
    if (transaction.endTimestamp && transaction.startTimestamp) {
      const duration = (transaction.endTimestamp - transaction.startTimestamp) * 1000
      if (duration > 5000) {
        transaction.setTag('slow_transaction', true)
      }
    }
    
    return transaction
  }
})