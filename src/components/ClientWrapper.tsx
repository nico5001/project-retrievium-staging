"use client";

import { ReactNode, useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

export default function ClientWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return <>{children}</>;
}
