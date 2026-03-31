import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { APP_NAME, APP_DESCRIPTION, LOGO_URL } from "@/lib/constants/brand";

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
const siteUrlObj = new URL(SITE_URL);
const logoUrl = `${SITE_URL}${"/logo-bg.png"}`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#f8fafc",
};

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `${APP_NAME} | %s`,
  },
  description: APP_DESCRIPTION,
  metadataBase: siteUrlObj,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: logoUrl,
    shortcut: logoUrl,
    apple: logoUrl,
  },
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: SITE_URL,
    type: "website",
    images: [{ url: logoUrl, alt: APP_NAME, width: 200, height: 200 }],
  },
  twitter: {
    card: "summary",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [{ url: logoUrl, width: 200, height: 200 }],
  },
};

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthSessionProvider } from "@/components/session-provider";
import { PWARegister } from "@/components/pwa-register";
import { SiteVisitRecorder } from "@/components/site-visit-recorder";
import { InstallPwaLoginPrompt } from "@/components/InstallPwaLoginPrompt";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Some browsers are less consistent with metadata.icons; add explicit icon link. */}
        <script
          type="application/ld+json"
          // Organization JSON-LD improves basic entity understanding in search results.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: APP_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}${LOGO_URL}`,
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <PWARegister />
          <SiteVisitRecorder />
          <AuthSessionProvider>
            <TooltipProvider>
              <Toaster />
              <InstallPwaLoginPrompt />
              {children}
            </TooltipProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html >
  );
}
