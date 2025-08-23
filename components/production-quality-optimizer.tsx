'use client'

import { useEffect } from 'react'

export function ProductionQualityOptimizer() {
  useEffect(() => {
    // Add viewport meta tags for high DPI screens
    const viewportMeta = document.querySelector('meta[name="viewport"]')
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 
        'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover'
      )
    }

    // Add high DPI optimization styles
    const style = document.createElement('style')
    style.innerHTML = `
      /* Production Quality Optimization - Enhanced for High DPI */
      @media (-webkit-min-device-pixel-ratio: 1.5), (min-resolution: 144dpi) {
        * {
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
          text-rendering: optimizeLegibility !important;
          font-feature-settings: "kern" 1, "liga" 1, "calt" 1 !important;
          font-kerning: normal !important;
        }
        
        body {
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          perspective: 1000px;
          -webkit-perspective: 1000px;
          /* Improve font rendering on high DPI */
          -webkit-text-stroke: 0.04px;
        }
        
        img {
          /* Use high-quality image rendering */
          image-rendering: -webkit-optimize-contrast;
          image-rendering: high-quality;
          -ms-interpolation-mode: bicubic;
        }
      }
      
      /* Specific high DPI optimization for Retina displays */
      @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
        * {
          -webkit-font-smoothing: subpixel-antialiased !important;
        }
        
        img {
          image-rendering: auto;
        }
      }
      
      /* Force hardware acceleration */
      .elevation-sm, .elevation-md, .elevation-lg, .elevation-xl,
      .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl {
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
        will-change: transform;
      }
      
      /* Optimize SVG rendering */
      svg {
        shape-rendering: geometricPrecision;
        text-rendering: geometricPrecision;
      }
      
      /* Optimize button and input rendering */
      button, input, select, textarea {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      /* Prevent text size adjustment on orientation change */
      html {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
        text-size-adjust: 100%;
      }
    `
    document.head.appendChild(style)

    // Add prefetch for critical resources
    const prefetchLinks = [
      { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' }
    ]

    prefetchLinks.forEach(link => {
      const linkElement = document.createElement('link')
      linkElement.rel = link.rel
      linkElement.href = link.href
      if (link.crossOrigin) {
        linkElement.crossOrigin = link.crossOrigin
      }
      document.head.appendChild(linkElement)
    })

    return () => {
      // Cleanup on unmount
      if (style.parentNode) {
        style.parentNode.removeChild(style)
      }
    }
  }, [])

  return null
}