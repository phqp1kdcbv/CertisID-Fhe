import { Shield } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link, useLocation } from 'react-router-dom';

export const Header = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-2xl bg-background/70">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-primary group-hover:scale-105 transition-transform cursor-pointer">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-primary">
                FHE KYC
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Encrypted Identity</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 mr-4">
              {isHome ? (
                <a href="#kyc-form" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-smooth">
                  Submit KYC
                </a>
              ) : (
                <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-smooth">
                  Home
                </Link>
              )}
              <Link to="/documentation" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-smooth">
                Documentation
              </Link>
            </nav>
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};
