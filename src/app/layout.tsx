import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "aos/dist/aos.css";
import "./globals.css";

import { ThirdwebProvider } from "thirdweb/react";
import { ToastProvider } from "@/hooks/use-toast";        // ✅ hooks provider (context for useToast)
import { Toaster } from "@/components/ui/toaster";        // ✅ shadcn toaster renderer
import ClientWrapper from "../components/ClientWrapper";
import localFont from "next/font/local";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Retrievium",
  description: "A pfp collection on Ronin with evolving lore and utility.",
};

export const ethnocentric = localFont({
  src: [
    { path: "../../public/fonts/ethnocentric/Ethnocentric-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/ethnocentric/Ethnocentric-Italic.woff2",   weight: "400", style: "italic" },
  ],
  variable: "--font-ethno",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${ethnocentric.variable} bg-black`}>
        <ThirdwebProvider>
          
          <ToastProvider>
            
            <nav
              className="fixed inset-x-0 top-0 z-50 bg-transparent text-white h-16 sm:h-20 px-6 sm:px-8 flex items-center"
              style={{ backdropFilter: "none", WebkitBackdropFilter: "none" }}
            >
              <div className="flex-1">
                <Link href="/home">
                  <img
                    src="/images/PR-YELLOW-LOGO.png"
                    alt="Project Retrievium"
                    className="h-10 sm:h-12 md:h-14 w-auto cursor-pointer hover:opacity-80 transition"
                  />
                </Link>
              </div>
              <div className="flex-1 hidden md:flex justify-center gap-8 uppercase tracking-wide" />
              <div className="flex-1 flex justify-end">
                <Link
                  href="/mint"
                  className="rounded-full bg-white text-black px-4 py-2 hover:bg-gray-200 transition"
                >
                  Mint
                </Link>
              </div>
            </nav>

            <ClientWrapper>{children}</ClientWrapper>

            
            <Toaster />
          </ToastProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
