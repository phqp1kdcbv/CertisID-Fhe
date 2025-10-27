import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { KYCForm } from "@/components/KYCForm";
import { Footer } from "@/components/Footer";

const Index = () => {
  const scrollToForm = () => {
    const form = document.getElementById('kyc-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero onGetStarted={scrollToForm} />
        <KYCForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
