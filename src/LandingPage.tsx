import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Trust from './components/Trust';
import CTA from './components/CTA';
import Footer from './components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-secondary-container selection:text-on-secondary-container">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Trust />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
