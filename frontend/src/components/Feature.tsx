import { Box, Lock, Search, Settings, Sparkles } from "lucide-react";
import { GlowingEffect } from "./ui/glowing-effect";

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  
}
export function Features() {
  return (
   <>
   <div className=" p-10 md:text-6xl text-5xl font-bold text-center ">
Feat<span className="text-[#246BFD]">ures</span> 
   </div>
    <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2 p-10 mb-10">
      <GridItem
        area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
        icon={<Box className="h-5 w-5 text-[#246BFD]" />}
        title="Containerized & Secure"
        description="Your code runs in isolated Docker containers to ensure full security."
      />

      <GridItem
        area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
        icon={<Settings className="h-5 w-5 text-[#246BFD]" />}
        title="Custom Build Commands"
        description="Configure any framework: React, Next.js, Astro, Vue and more."
      />

      <GridItem
        area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
        icon={<Lock className="h-5 w-5 text-[#246BFD]" />}
        title="Optimized for Performance"
        description="Global CDN, build caching, and blazing fast previews."
      />

      <GridItem
        area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
        icon={<Sparkles className="h-5 w-5 text-[#246BFD]" />}
        title="One-click Deploy"
        description="Hook up GitHub and deploy instantly without complex setup."
      />

      <GridItem
        area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
        icon={<Search className="h-5 w-5 text-[#246BFD]" />}
        title="Instant Redeploys"
        description="Every push to your repo triggers an automated build and deploy."
      />
    </ul>
   </>
  );
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-2xl border border-[#1E293B] p-2 transition ">
        <GlowingEffect
           blur={0}
          borderWidth={3}
          spread={80}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 rounded-xl p-6">
          <div className="flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-[#1E293B] p-2 bg-[#1E293B]">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-white md:text-2xl">
                {title}
              </h3>
              <p className="text-sm text-[#AFBCD5] md:text-base">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};