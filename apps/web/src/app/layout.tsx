import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://amazone.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Amazone — Your One-Stop E-Commerce Platform",
    template: "%s | Amazone",
  },
  description:
    "Shop millions of products with fast delivery, secure payments, and great prices. Electronics, clothing, home goods, and more.",
  keywords: [
    "online shopping",
    "e-commerce",
    "electronics",
    "clothing",
    "deals",
    "free shipping",
  ],
  authors: [{ name: "Amazone" }],
  creator: "Amazone",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Amazone",
    title: "Amazone — Your One-Stop E-Commerce Platform",
    description:
      "Shop millions of products with fast delivery, secure payments, and great prices.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Amazone — Your One-Stop E-Commerce Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Amazone — Your One-Stop E-Commerce Platform",
    description:
      "Shop millions of products with fast delivery, secure payments, and great prices.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: BASE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
