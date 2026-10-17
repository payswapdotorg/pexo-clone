import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { BRAND, BRAND_TAGLINE } from "@/lib/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND} — ${BRAND_TAGLINE}`,
    template: `%s — ${BRAND}`,
  },
  description:
    "Describe a video in plain language and a collaborative agent plans it, previews it, and renders it when you say go.",
  keywords: ["AI video agent", "text to video", "video generation"],
  openGraph: {
    title: `${BRAND} — ${BRAND_TAGLINE}`,
    description: "The video agent that plans, previews, and renders — with your sign-off.",
    siteName: BRAND,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
