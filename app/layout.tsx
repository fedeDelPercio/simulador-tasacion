import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Simulador de Tasación | Team Scaglia",
  description: "Herramienta profesional de tasación inmobiliaria por comparables",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} font-sans antialiased`}
    >
      <body className="min-h-full bg-neutral-50 text-neutral-800">
        {children}
      </body>
    </html>
  );
}
