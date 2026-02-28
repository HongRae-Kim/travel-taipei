import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travel Taipei Live Dashboard",
  description: "Weather, exchange, phrase and place recommendation dashboard for Taipei travel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
