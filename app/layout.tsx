import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { FontSizeProvider } from "@/providers/font-size-provider";

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
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="light">
          <FontSizeProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </FontSizeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}