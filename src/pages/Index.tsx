import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ServicesSection from "@/components/landing/ServicesSection";
import GallerySection from "@/components/landing/GallerySection";
import BookingSection from "@/components/landing/BookingSection";
import ContactSection from "@/components/landing/ContactSection";

const Index = () => {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ServicesSection />
        <GallerySection />
        <BookingSection />
        <ContactSection />
      </main>
    </>
  );
};

export default Index;
