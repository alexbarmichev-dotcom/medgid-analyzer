import Header from '@/components/site/Header';
import Hero from '@/components/site/Hero';
import HowItWorks from '@/components/site/HowItWorks';
import Features from '@/components/site/Features';
import Security from '@/components/site/Security';
import Disclaimer from '@/components/site/Disclaimer';
import Pricing from '@/components/site/Pricing';
import StartFlow from '@/components/site/StartFlow';
import Feedback from '@/components/site/Feedback';
import Footer from '@/components/site/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Security />
        <Disclaimer />
        <Pricing />
        <StartFlow />
        <Feedback />
      </main>
      <Footer />
    </div>
  );
};

export default Index;