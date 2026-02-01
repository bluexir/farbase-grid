import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FarBase Drop",
  description: "Coinleri birleştir, skor yaz, ödül kazandır",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </head>
      <body className="bg-gray-950 text-white min-h-screen flex items-center justify-center">
        {children}
      </body>
    </html>
  );
}
