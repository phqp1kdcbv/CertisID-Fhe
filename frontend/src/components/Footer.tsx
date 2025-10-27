import { Shield, Github, Twitter, FileText, Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="relative border-t border-border/40 bg-gradient-to-b from-transparent to-muted/30 backdrop-blur-sm mt-32">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-5 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="font-black text-2xl text-primary">
                FHE KYC
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-md">
              Revolutionary blockchain identity verification powered by Fully Homomorphic Encryption. 
              <span className="block mt-2 font-semibold text-foreground">
                Privacy-first, secure by design, verifiable by default.
              </span>
            </p>
            <div className="flex gap-3 pt-2">
              {[
                { icon: Github, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: FileText, href: "#" },
                { icon: Mail, href: "#" }
              ].map((social, index) => (
                <a 
                  key={index}
                  href={social.href}
                  className="p-3 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/10 transition-smooth group"
                >
                  <social.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-smooth" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-5 text-foreground">Product</h3>
            <ul className="space-y-3">
              {["Features", "Security", "How it Works", "Pricing", "API"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-smooth font-medium">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-5 text-foreground">Resources</h3>
            <ul className="space-y-3">
              {["Documentation", "White Paper", "Blog", "Support", "Contact"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-smooth font-medium">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/40">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              &copy; 2025 FHE KYC. All rights reserved. Built with privacy and security at the core.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth font-medium">
                Privacy Policy
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth font-medium">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
