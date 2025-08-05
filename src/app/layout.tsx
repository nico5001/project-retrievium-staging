import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "aos/dist/aos.css";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import { Toaster } from "sonner";
import { ToastProvider } from "@/components/ui/toast";
import ClientWrapper from "../components/ClientWrapper";
import Carousel     from "../components/Carousel";
import Link from "next/link";
import { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "NFT Minting template",
	description: "A minting template powered by thirdweb",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={inter.className}>
			 <ThirdwebProvider>
          <ToastProvider>
            <Toaster position="bottom-center" />

            {/* NAV: logo left / links center / mint button right */}
            <nav className="bg-gray-900 text-white flex items-center px-8 py-4">
              {/* Logo placeholder */}
              <div className="flex-1">
                <img src="/images/logo-new-cyan.png" alt="Logo" className="h-8 w-auto"/>
              </div>

              {/* Centered links */}
              <div className="flex-1 flex justify-center gap-8 uppercase tracking-wide">
                <Link href="/home" className="hover:underline">Home</Link>
                <Link href="/community" className="hover:underline">Community</Link>
              </div>

              {/* Mint button on the right */}
              <div className="flex-1 flex justify-end">
                <Link
                  href="/mint"
                  className="bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition"
                >
                  Mint
                </Link>
              </div>
            </nav>

            {/* wrap all pages for AOS & Thirdweb */}
            <ClientWrapper>{children}</ClientWrapper>
          </ToastProvider>
        </ThirdwebProvider>
			</body>
		</html>
	);
}
