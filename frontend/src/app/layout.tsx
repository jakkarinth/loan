import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบบริหารลูกหนี้เงินยืม RMUTI Surin",
  description: "Loan debtor management system for RMUTI Surin Campus"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
