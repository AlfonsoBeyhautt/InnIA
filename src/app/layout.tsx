import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "InnIA — Gestión de alquileres temporales",
  description: "Plataforma de operaciones para propietarios de alquileres en Uruguay y Latinoamérica.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geist.variable} font-sans`}>{children}</body>
    </html>
  );
}
