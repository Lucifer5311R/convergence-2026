import { useState, useCallback, useEffect } from 'react';
import './App.css';
import LoadingScreen from './components/LoadingScreen';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Events from './components/Events';
import Schedule from './components/Schedule';
import Legacy from './components/Legacy';
import Participants from './components/Participants';
import Committee from './components/Committee';
import Gallery from './components/Gallery';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import RegistrationModal from './components/RegistrationModal';
import BackToTop from './components/BackToTop';
import EventPage from './components/EventPage';
import WhyAttend from './components/WhyAttend';
import HowItWorks from './components/HowItWorks';
import Admin from './components/Admin';
import Results from './components/Results';

export default function App() {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
      if (window.location.hash === '#/register') {
        setRegisterOpen(true);
      } else {
        setRegisterOpen(false);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const openRegister = useCallback(() => {
    window.location.hash = '#/register';
  }, []);

  const closeRegister = useCallback(() => {
    // If we were on event page, go back to that event page, otherwise go home
    if (window.location.hash === '#/register') {
      window.history.back();
    } else {
      setRegisterOpen(false);
    }
  }, []);

  const scrollToEvents = useCallback(() => {
    const el = document.getElementById('events');
    if (el) {
      const offset = 72;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  const eventMatch = hash.match(/^#\/event\/(\d+)/);
  const eventId = eventMatch ? eventMatch[1] : null;
  const isAdmin = hash === '#/admin';
  const isResults = hash === '#/results' || hash === '#results';

  if (isAdmin) return <Admin />;
  if (isResults) return <Results />;

  return (
    <>
      <LoadingScreen />
      
      {eventId ? (
        <EventPage eventId={eventId} onBack={() => { window.location.hash = '#events'; }} />
      ) : (
        <>
          <Navbar onRegisterClick={openRegister} />
          <main>
            <Hero onRegisterClick={openRegister} onExploreClick={scrollToEvents} />
            <About />
            <WhyAttend />
            <Events />
            <HowItWorks />
            <Schedule />
            <Legacy />
            <Results />
            <Participants />
            <Committee />
            <Gallery />
            <FAQ />
          </main>
          <Footer />
        </>
      )}

      <BackToTop />
      <RegistrationModal isOpen={registerOpen} onClose={closeRegister} />
    </>
  );
}
