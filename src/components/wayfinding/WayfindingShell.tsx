"use client";

import { useEffect, useRef } from "react";
import { ExploreSection } from "./ExploreSection";
import { HomeHero } from "./HomeHero";
import { WayfindingFullTutorialSection } from "./WayfindingFullTutorialSection";
import { WayfindingVideoTutorial } from "./WayfindingVideoTutorial";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export function WayfindingShell() {
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = pageRef.current;
    if (!container) return;

    const revealElements = container.querySelectorAll<HTMLElement>(".reveal-on-scroll");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="wayfinding-page">
      <SiteHeader />
      <main className="wayfinding-shell page-fade-in" ref={pageRef}>
        <HomeHero />
        <section className="explore-section">
          <div className="reveal-on-scroll">
            <ExploreSection />
          </div>
          <div className="section-overlap-stack">
            <div className="reveal-on-scroll">
              <WayfindingFullTutorialSection />
            </div>
            <div className="reveal-on-scroll">
              <WayfindingVideoTutorial videoUrl="/media/todjuanda.mp4" />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
