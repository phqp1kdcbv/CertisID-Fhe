import { Shield, Lock, Database, CheckCircle2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Hero = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 left-[10%] w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-[5%] w-[600px] h-[600px] bg-secondary/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-accent/6 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm animate-slide-up">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Powered by Fully Homomorphic Encryption
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight animate-slide-up stagger-1">
              <span className="block text-foreground">Secure Your</span>
              <span className="block text-primary mt-2">
                Digital Identity
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up stagger-2">
              Revolutionary blockchain KYC powered by FHE encryption. 
              <span className="block mt-2 font-semibold text-foreground">
                Your data stays encrypted, verifiable, and truly private.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 animate-slide-up stagger-3">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="text-base px-8 py-6 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 shadow-lg"
              >
                <Shield className="w-5 h-5 mr-2" />
                Submit Encrypted KYC
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 py-6 rounded-xl border-2 hover:border-primary hover:bg-primary/5 font-semibold"
              >
                How It Works
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-20">
            {[
              {
                icon: Lock,
                title: "Fully Encrypted",
                description: "Military-grade FHE encryption protects every byte of your data before blockchain submission",
                gradient: "from-primary/10 to-accent/5"
              },
              {
                icon: Database,
                title: "Immutable Records",
                description: "Permanent, tamper-proof storage on blockchain with instant verification capabilities",
                gradient: "from-secondary/10 to-primary/5"
              },
              {
                icon: CheckCircle2,
                title: "Zero-Knowledge Proof",
                description: "Verify credentials without exposing sensitive information to anyone, anywhere",
                gradient: "from-accent/10 to-secondary/5"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className={`group relative bg-card p-8 rounded-3xl shadow-card border border-border hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 ${
                  index === 1 ? 'md:mt-8' : ''
                }`}
              >
                <div className={`w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 p-10 rounded-3xl bg-gradient-to-br from-card to-muted/30 border border-border/40 shadow-card">
            <p className="text-center text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              All information is encrypted using FHE technology before blockchain storage
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
