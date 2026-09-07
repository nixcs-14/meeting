import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Salle de Réunion UNDP",
  description: "Réservation et gestion de la salle de réunion — UNDP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-ms-bg text-ms-text font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
