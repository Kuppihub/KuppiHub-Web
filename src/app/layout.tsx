// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import "./globals.css";
import Footer from "./components/Footer";
import Header from "./components/Header";
import ScrollToTopButton from "./components/ScrollToTopButton";
import NotificationSnackbar from "./components/NotificationSnackbar";
import AppDownloadBanner from "./components/AppDownloadBanner";
import LiveCounter from "./components/LiveCounter";
import ServiceWorkerRegistrar from "./components/ServiceWorkerRegistrar";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ Metadata API
export const metadata: Metadata = {
  title: "Kuppi Hub - Study Smarter, Together!",
  description: "Student-made tutorials to help you study smarter.",
  keywords:
    "study, student help, peer learning, tutorials, exam tips, student platform, education, Kuppi Hub",
  openGraph: {
    title: "Kuppi Hub - Study Smarter, Together!",
    description: "A student-driven study platform by University of Moratuwa students to learn, share, and grow together.",
    url: "https://kuppihub.org",
    type: "website",
    images: [
      {
        url: "https://kuppihub.org/logo.png",
        width: 100,
        height: 100,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Kuppi Hub - Study Smarter, Together!",
    description: "Peer tutorials and study help by students, for students.",
    images: ["https://kuppihub.org/logo.png"],
  },
  verification: {
    google: "CfPv_Tyr1nJGEgYQxK5uqYdknw8_mae6_weHZtm3K20",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Compatibility + Viewport (metadata already covers SEO stuff) */}
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />


        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-68J1S4VW95"
          strategy="afterInteractive"
        />
        <Script id="gtag-G-68J1S4VW95" strategy="afterInteractive">
          {`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-68J1S4VW95');
`}
        </Script>

      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen flex flex-col`}
      >
        <Providers>
          <ServiceWorkerRegistrar />
          <LiveCounter />
          <AppDownloadBanner />
          <Header />

          <main className="flex-1">
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          </main>

          <Footer />
          <ScrollToTopButton />
        </Providers>

        {/* <NotificationSnackbar /> */}

        {/* ✅ Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4338559761379667"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* ✅ Google Analytics */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-2VZ3W2SDG4"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2VZ3W2SDG4');
          `}
        </Script>
      </body>
    </html>
  );
}
