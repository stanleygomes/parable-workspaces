import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import favicon from './img/logo.png'

export const metadata: Metadata = {
  title: "Parable Workspaces",
  description:
    "The best way to manage your vscode, cursor and antigravity workspaces.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href={favicon} type="image/png" />
      </head>
      <body className={`${GeistMono.className} antialiased bg-black text-[#33ff00]`}>{children}</body>
    </html>
  );
}
