import type { Metadata } from "next";
import {GoogleAnalytics, GoogleTagManager} from "@next/third-parties/google";

import localFont from "next/font/local";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Photo Comparison Tool | BeforeAftr",
  description:
    "Compare two photos with BeforeAftr, an interactive slider. Upload and drag to reveal differences" +
    " between before and after images. Free, instant, and no signup required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <GoogleTagManager gtmId={`G-NSDT7S3H6R`} />
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-neutral-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
