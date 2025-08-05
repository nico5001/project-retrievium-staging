import ParallaxSection from "../../components/ParallaxSection";
import Carousel from "../../components/Carousel";


export default function Home() {
  const sample = [ "/images/nft1.png",
    "/images/nft2.png",
    "/images/nft3.png", 
    "/images/nft4.png",
    "/images/nft5.png",
    "/images/nft6.png",
    "/images/nft7.png", ];

  return (
 <>
     <ParallaxSection bgImage="/images/home.jpg" speedY={0.15} zoomSpeed={0.0005}>
     <div
   className="
     absolute
     top-[60vh]              /* 60% down from the top of the viewport */
     left-64                  /* 2 rem in from the left edge */
     transform
     -translate-y-1/2        /* pull it up by half its own height so it truly centers at 60vh */
     z-10
     max-w-3xl
   "
 >
        {/* 2) Your heading */}
        <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-4">
          Whoff Side Are You?
        </h1>

        {/* 3) Your paragraph */}
        <p className="text-white max-w-prose">
          “Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam…”
        </p>
      </div>
    </ParallaxSection>
      {/* …other content here… */}

      
    </>
  );
}
