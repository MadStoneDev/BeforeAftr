import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
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
      <body
        className={`${outfit.variable} bg-neutral-900 font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
