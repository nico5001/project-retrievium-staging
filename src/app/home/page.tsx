import Link from "next/link";
import ParallaxSection from "@/components/ParallaxSection";
import LoreToggle from "@/components/LoreToggle";
import RoadmapSection from "@/components/RoadmapSection";
import FAQSection from "@/components/FAQSection";
import PerksSection from "@/components/PerksSection";
import TeamsPartnersSection from "@/components/TeamsPartnerSection";

export default function Home() {
  return (
    <>

      <ParallaxSection bgImage="/images/home.jpg">
        
        <div className="min-h-[100svh] grid place-content-center">
          
          <div className="translate-y-[8vh] text-center w-full max-w-[1300px] px-4 sm:px-6 mx-auto">
            <h1
              className="
                font-ethno uppercase text-white
                text-[clamp(38px,4.2vw,84px)]
                leading-[1.02] tracking-[0.01em]
                lg:whitespace-nowrap
                max-w-[min(1200px,92vw)] mx-auto
                drop-shadow-[0_3px_14px_rgba(0,0,0,.75)]
              "
            >
              WHOOF SIDE ARE YOU?
            </h1>

            <p className="mt-5 text-white max-w-2xl mx-auto drop-shadow-[0_2px_10px_rgba(0,0,0,.65)]">
              “An IP-driven Web3 world on Ronin Network. Mint to access drops, events, and holder-only votes as the Retrievium story and utility evolve with the community.”
            </p>
      
            <div className="mt-6 flex justify-center gap-3 flex-col sm:flex-row">
              <Link
                href="/mint"
                className="w-full sm:w-auto text-center rounded-lg bg-white text-black px-5 py-2 font-semibold shadow-md hover:bg-white/90 transition"
              >
                Mint Now
              </Link>
              <a
                href="https://discord.gg/projectretrievium"
                target="_blank"
                rel="noopener noreferrer"
                 className="rounded-lg border border-white/70 text-white px-5 py-2 font-semibold hover:bg-white/10 transition"
                >
                Join Community
                </a>

                <a
                  href="https://project-retrievium.gitbook.io/project-retrievium"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto text-center rounded-lg border border-white/70 text-white px-5 py-2 font-semibold hover:bg-white/10 transition"
                >
                  Whitepaper
                </a>

                

            </div>
          </div>
        </div>
                      

      </ParallaxSection>

      
      <LoreToggle />
      <PerksSection/>
      <RoadmapSection />
      <TeamsPartnersSection/>
      <FAQSection />
    </>
  );
}
