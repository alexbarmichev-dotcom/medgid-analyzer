import { useEffect } from 'react';
import { useLocation } from "@/lib/router-compat";
import { emitStartIntent } from '@/lib/startFlowBus';
import { ANALYZE_URL } from '@/components/site/start-flow/uploadClient';
import Header from '@/components/site/Header';
import Hero from '@/components/site/Hero';
import Stats from '@/components/site/Stats';
import Testimonial from '@/components/site/Testimonial';
import HowItWorks from '@/components/site/HowItWorks';
import Features from '@/components/site/Features';
import Reviews from '@/components/site/Reviews';
import Articles from '@/components/site/Articles';
import Security from '@/components/site/Security';
import BrandName from '@/components/site/BrandName';
import Disclaimer from '@/components/site/Disclaimer';
import Pricing from '@/components/site/Pricing';
import StartFlow from '@/components/site/StartFlow';
import Feedback from '@/components/site/Feedback';
import Footer from '@/components/site/Footer';
import type { Article } from '@/data/articles';

const Index = ({ articles }: { articles?: Article[] }) => {
  const { hash } = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`${ANALYZE_URL}?action=cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        keepalive: true,
      }).catch(() => undefined);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hash) return;
    const timer = setTimeout(() => {
      if (hash === '#try') {
        emitStartIntent('anonymous');
        document.querySelector('#start')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [hash]);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <Header />
      <main>
        <Hero />
        <Stats />
        <Testimonial />
        <HowItWorks />
        <Features />
        <Reviews />
        <Articles initialArticles={articles} />
        <Pricing />
        <StartFlow />
        <Feedback />
        <Security />
        <BrandName />
        <Disclaimer />
      </main>
      <Footer />
    </div>
  );
};

export default Index;