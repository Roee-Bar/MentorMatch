import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MentorMatch - Project Supervisor Matching System",
  description: "A platform for matching students with appropriate project supervisors at Braude College",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

