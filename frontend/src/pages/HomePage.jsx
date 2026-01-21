import React from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import VideoShowcase from '../components/VideoShowcase';
import Collections from '../components/Collections';
import NewArrivals from '../components/NewArrivals';
import OfficeWear from '../components/OfficeWear';
import SareeCare from '../components/SareeCare';
import Reviews from '../components/Reviews';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <VideoShowcase />
        <Collections />
        <NewArrivals />
        <OfficeWear />
        <SareeCare />
        <Reviews />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
