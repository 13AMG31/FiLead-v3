import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fi.Lead",
  description: "Menús digitales y fidelización con NFC y QR"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
