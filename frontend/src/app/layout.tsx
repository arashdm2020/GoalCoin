import type { Metadata, Viewport } from "next";
import { Orbitron, Exo_2 } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import AnimatedBackground from "../components/AnimatedBackground";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  display: 'swap',
});

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "GoalCoin - 90 Day Fitness Challenge",
  description: "Transform your fitness journey with GoalCoin's 90-Day Challenge. Earn rewards, track progress, and join a global community.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GoalCoin",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFD700",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#FFD700" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GoalCoin" />
      </head>
            <body
        className={`${orbitron.variable} ${exo2.variable} font-sans antialiased`}
      >
                        <AnimatedBackground />
        <Providers>{children}</Providers>
        <div id="watermark-container" style={{ position: 'fixed', right: 0, bottom: 0, zIndex: -1, width: '200px', height: '200px' }}>
          {/* Watermark animation will go here */}
        </div>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then(reg => console.log('[SW] Registered:', reg.scope))
                  .catch(err => console.error('[SW] Registration failed:', err));
              });
            }
          `
        }} />
      </body>
    </html>
  );
}
