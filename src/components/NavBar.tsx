"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href === "/home" && pathname === "/");

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 bg-transparent text-white h-14 sm:h-16 px-4 sm:px-6 flex items-center">
        
        <div className="hidden md:flex flex-1 justify-center gap-8 uppercase tracking-wide">
      
          
        </div>

        {/* Right: Mint / Burger */}
        <div className="flex-1 flex justify-end items-center gap-2">
          <Link
                href="/mint"
                 className="hidden sm:inline-block rounded-full bg-white text-black px-4 py-1.5 hover:bg-gray-200 transition"
                >
                  Mint
         </Link>
          <button
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded
                       bg-white/10 hover:bg-white/15 border border-white/15"
          >
            <span className="sr-only">Menu</span>
            <div className="relative w-5 h-5">
              <span className={`absolute inset-x-0 top-1 h-[2px] bg-white transition ${open ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-white transition ${open ? "opacity-0" : ""}`} />
              <span className={`absolute inset-x-0 bottom-1 h-[2px] bg-white transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`md:hidden fixed inset-x-0 top-14 sm:top-16 z-40 origin-top
                    bg-black/85 border-t border-white/10 backdrop-blur-[2px]
                    transition-transform duration-200 ${open ? "translate-y-0" : "-translate-y-4 pointer-events-none opacity-0"}`}
      >
        <div className="px-4 py-4 space-y-2">
          <Link href="/home" onClick={() => setOpen(false)} className="block py-2 text-white/90">Home</Link>
          <Link
            href="/mint"
            onClick={() => setOpen(false)}
            className="mt-3 inline-block rounded-full bg-white text-black px-4 py-2"
          >
            Mint
          </Link>
        </div>
      </div>
    </>
  );
}
