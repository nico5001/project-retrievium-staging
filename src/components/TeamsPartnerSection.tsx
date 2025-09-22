
"use client";
import Image from "next/image";

type Socials = {
  x?: string;       
  github?: string;  
  site?: string;   
};

type Member = {
  name: string;
  role: string;
  bio?: string;
  avatar?: string; 
  socials?: Socials;
};

type Partner = {
  name: string;
  logo?: string;    
  url?: string;
};

type Props = {
  id?: string;
  title?: string;
  subtitle?: string;
  team?: Member[];
  partnersTitle?: string;
  partners?: Partner[];
};

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M18 2h3l-7.5 8.57L22 22h-6.5L10 14.9 4.5 22H2l8.5-9.71L2 2h6.5L14 8.53 18 2Z" />
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path fillRule="evenodd" d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.08 3.29 9.38 7.86 10.9.58.1.79-.25.79-.56v-2c-3.2.71-3.88-1.38-3.88-1.38-.54-1.36-1.33-1.73-1.33-1.73-1.09-.75.08-.73.08-.73 1.21.09 1.85 1.25 1.85 1.25 1.07 1.84 2.8 1.31 3.48 1 .1-.79.42-1.31.76-1.61-2.55-.29-5.23-1.27-5.23-5.64 0-1.25.44-2.27 1.16-3.07-.12-.29-.5-1.47.11-3.06 0 0 .96-.31 3.15 1.17a10.8 10.8 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.61 1.59.23 2.77.11 3.06.72.8 1.16 1.82 1.16 3.07 0 4.38-2.69 5.35-5.25 5.64.43.37.82 1.1.82 2.22v3.29c0 .31.2.66.8.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" clipRule="evenodd"/>
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H17a3 3 0 013 3v.5a3 3 0 01-3 3h-1m-6 0H7a3 3 0 01-3-3V9a3 3 0 013-3h3.5M9 12h6" />
  </svg>
);

const DEFAULT_TEAM: Member[] = [
  {
    name: "Cairo",
    role: "Project Owner",
    bio: "Founder of Project Retrievium.",
    avatar: "/images/team/cairo.png",
    socials: { x: "https://x.com/heyitscairo/", site: "https://project-retrievium.gitbook.io/project-retrievium" },
  },
  {
    name: "Caramel",
    role: "Graphics Designer & NFT Artist",
    bio: "Designer of the Retrievium NFT collection and visual identity.",
    avatar: "/images/team/caramel.png",
    socials: { x: "https://x.com/" },
  },
  
  {
    name: "PKY",
    role: "Community Lead",
    bio: "Experienced Moderator & Community Manager | Server Layout Specialist",
    avatar: "/images/team/pky.png",
    socials: { x: "https://x.com/0xpikoy" },
  },
  {
    name: "Ace",
    role: "Community Lead",
    bio: "Web3 Enthusiast |  Experienced Community Manager & Moderator | Driving growth, engagement & trust across blockchain, GameFi & NFT communities | Passionate about building strong ecosystems in the decentralized space.",
    avatar: "/images/team/ace.png",
    socials: { x: "https://x.com/cryptoaceph" },
  },
  {
    name: "AquaDash",
    role: "Laboratory Moderator",
    bio: "The wave that never breaks, the dash that never stops",
    avatar: "/images/team/aquadash.jpg",
    socials: { x: "https://x.com/AquaDash25" },

  },
  {
    name: "Gianne",
    role: "Laboratory Moderator",
    bio: "Experienced moderator driven by desire to innovate while casually exploring the space",
    avatar: "/images/team/gianne.jpg",
    socials: { x: "https://x.com/anne_rgg" },
  },

];



export default function TeamPartnersSection({
  id = "team",
  title = "Team & Partners",
  subtitle = "People building the world and those helping power it.",
  team = DEFAULT_TEAM,
}: Props) {
  return (
    <section id={id} className="relative w-screen py-20 md:py-28">
      
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_800px_at_50%_-10%,rgba(80,180,255,0.10),transparent_60%)]"
      />
      <div className="mx-auto max-w-7xl px-6">
        <header className="mb-10 md:mb-14 text-center">
          <h2 className="font-ethno text-3xl md:text-4xl text-white tracking-wide uppercase">
            {title}
          </h2>
          <div className="mx-auto mt-3 h-1 w-24 rounded-full bg-cyan-300/70" />
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">{subtitle}</p>
        </header>

        
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-7">
          {team.map((m, i) => (
            <article
              key={i}
              className="relative rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur-md p-5 md:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15">
                  {m.avatar ? (
                    <Image
                      src={m.avatar}
                      alt={m.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center bg-white/10 text-white/70">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold">{m.name}</h3>
                  <p className="text-white/70 text-sm">{m.role}</p>
                </div>
              </div>
              {m.bio && <p className="mt-4 text-white/70 leading-relaxed">{m.bio}</p>}

              {/* socials */}
              {(m.socials?.x || m.socials?.github || m.socials?.site) && (
                <div className="mt-4 flex items-center gap-3 text-white/70">
                  {m.socials?.x && (
                    <a href={m.socials.x} target="_blank" rel="noreferrer" className="hover:text-white transition" aria-label={`${m.name} on X`}>
                      <XIcon />
                    </a>
                  )}
                  {m.socials?.github && (
                    <a href={m.socials.github} target="_blank" rel="noreferrer" className="hover:text-white transition" aria-label={`${m.name} on GitHub`}>
                      <GitHubIcon />
                    </a>
                  )}
                  {m.socials?.site && (
                    <a href={m.socials.site} target="_blank" rel="noreferrer" className="hover:text-white transition" aria-label={`${m.name} website`}>
                      <LinkIcon />
                    </a>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
