import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Two Truths and a Lie: Internet Edition",
  description: "Can you spot the fake headline? Test your news literacy in this engaging game of truth vs. AI-generated fiction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
