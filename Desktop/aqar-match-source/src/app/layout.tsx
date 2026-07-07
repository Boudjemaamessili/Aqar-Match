import type { Metadata } from "next";
import { Cairo, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/components/platform/LanguageContext";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "عقار Match — أول منصة عقارية للمطابقة الذكية في الجزائر",
  description:
    "عقار Match يربطك مباشرة بالعرض الذي يناسبك — دون كشف بياناتك لأحد. منصة المطابقة العقارية الذكية في الجزائر.",
  keywords: [
    "عقار Match",
    "عقارات الجزائر",
    "مطابقة عقارية",
    "بيع عقار",
    "إيجار عقار",
  ],
  authors: [{ name: "عقار Match" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <LanguageProvider>{children}</LanguageProvider>
        <Toaster />
      </body>
    </html>
  );
}
