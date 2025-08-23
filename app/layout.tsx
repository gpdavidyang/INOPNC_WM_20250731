import type { Metadata } from "next";
// import { Inter } from "next/font/google"; // Google Fonts 비활성화
import "./globals.css";
import "../styles/override.css"; // ← UI/CSS 오버라이드 (NotoSansKR Medium, 파랑 hover 등)
// import "@/styles/sunlight-mode.css"; // Sunlight Mode CSS 비활성화
// import "@/styles/font-optimization.css"; // 폰트 최적화 CSS 비활성화
import { AuthProvider } from "@/providers/auth-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { TouchModeProvider } from "@/contexts/TouchModeContext";
import { ContrastModeProvider } from "@/contexts/ContrastModeContext";
import { SunlightModeProvider } from "@/contexts/SunlightModeContext";
import { EnvironmentalProvider } from "@/contexts/EnvironmentalContext";
import { SkipNavigation } from "@/components/ui/skip-navigation";
import { Toaster } from 'sonner';
import { ThemeInitializer } from "@/components/theme-initializer";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";
import { NotificationPermission } from "@/components/pwa/notification-permission";
import { DeepLinkProvider } from "@/components/providers/deep-link-provider";
import { PerformanceMonitoringProvider } from "@/components/providers/performance-monitoring-provider";
import { ThemeProvider } from "next-themes";

// const inter = Inter({ subsets: ["latin"] }); // Google Fonts 비활성화

export const metadata: Metadata = {
  title: "INOPNC Work Management",
  description: "건설 현장 작업 일지 및 자재 관리를 위한 통합 관리 시스템",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "INOPNC WM"
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "INOPNC WM",
    "application-name": "INOPNC WM",
    "msapplication-TileColor": "#2563eb",
    "msapplication-config": "none"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2563eb"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans">
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <FontSizeProvider>
              <TouchModeProvider>
                <ContrastModeProvider>
                  <SunlightModeProvider>
                    <EnvironmentalProvider>
                      <ThemeInitializer />
                      <SkipNavigation />
                      <AuthProvider>
                        <PerformanceMonitoringProvider>
                          <DeepLinkProvider />
                          {children}
                          <OfflineIndicator />
                          <InstallPrompt />
                          <ServiceWorkerRegistration />
                          <NotificationPermission />
                        </PerformanceMonitoringProvider>
                      </AuthProvider>
                      <Toaster 
                        position="top-right"
                        richColors
                        closeButton
                        toastOptions={{
                          duration: 4000,
                          style: {
                            borderRadius: '8px',
                          }
                        }}
                      />
                    </EnvironmentalProvider>
                  </SunlightModeProvider>
                </ContrastModeProvider>
              </TouchModeProvider>
            </FontSizeProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
