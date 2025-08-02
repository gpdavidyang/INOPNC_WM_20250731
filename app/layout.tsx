import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { TouchModeProvider } from "@/contexts/TouchModeContext";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "INOPNC Work Management",
  description: "Work Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <ErrorBoundary>
          <FontSizeProvider>
            <TouchModeProvider>
              <AuthProvider>
                {children}
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
              </AuthProvider>
            </TouchModeProvider>
          </FontSizeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}