import { Google_Sans } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const googleSans = Google_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-google-sans",
});

export const metadata: Metadata = {
  title: "Langpros pro-in",
  description: "Manage projects and inventory efficiently",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={googleSans.className}>{children}</body>
    </html>
  );
}
