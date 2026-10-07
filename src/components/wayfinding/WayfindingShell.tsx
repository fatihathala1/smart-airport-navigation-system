"use client";

import { ExploreSection } from "./ExploreSection";
import { HomeHero } from "./HomeHero";
import { WayfindingFullTutorialSection } from "./WayfindingFullTutorialSection";
import { WayfindingVideoTutorial } from "./WayfindingVideoTutorial";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export function WayfindingShell() {
  return (
    <div className="wayfinding-page">
      <SiteHeader />
      <main className="wayfinding-shell">
        <HomeHero />
        <section className="explore-section">
          <ExploreSection />
          <div className="section-overlap-stack">
            <WayfindingFullTutorialSection />
            <WayfindingVideoTutorial />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
