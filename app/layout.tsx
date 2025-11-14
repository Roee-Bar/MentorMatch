import type { Metadata } from "next";
import "./globals.css";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export const metadata: Metadata = {
  title: "MentorMatch - Braude College",
  description: "Find your perfect project supervisor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="m-0 font-sans">
        <div className="flex flex-col min-h-screen">
          
          {/* HEADER - Shows on every page */}
          <Header />

          {/* MAIN CONTENT - This changes based on what page you're on */}
          <main className="flex-1 bg-white">
            {children}
          </main>

          {/* FOOTER - Shows on every page */}
          <Footer />
          
        </div>
      </body>
    </html>
  );
}