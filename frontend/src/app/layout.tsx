import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travel Taipei API Dashboard",
  description: "Frontend dashboard connected to Travel Taipei backend APIs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
