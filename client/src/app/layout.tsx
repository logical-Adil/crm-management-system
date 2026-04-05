import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

import { AppProviders } from "@/components/providers/app-providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  // Avoid <link rel="preload" as="font"> warnings when the font applies via CSS
  // variables slightly after first paint; the stylesheet @font-face still loads normally.
  preload: false,
});

export const metadata: Metadata = {
  title: "CRM",
  description: "CRM client",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
