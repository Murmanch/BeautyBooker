import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <nav className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="font-heading font-bold text-xl text-rose-gold">Косметология Мурманск</h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button 
                onClick={() => scrollToSection('services')}
                className="text-deep-charcoal hover:text-rose-gold px-3 py-2 text-sm font-medium transition-colors"
              >
                Услуги
              </button>
              <button 
                onClick={() => scrollToSection('booking')}
                className="text-deep-charcoal hover:text-rose-gold px-3 py-2 text-sm font-medium transition-colors"
              >
                Запись
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="text-deep-charcoal hover:text-rose-gold px-3 py-2 text-sm font-medium transition-colors"
              >
                О мастере
              </button>
              <Button 
                onClick={handleLogin}
                className="bg-rose-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-gold/90 transition-all"
              >
                Войти
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-deep-charcoal hover:text-rose-gold"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button 
                onClick={() => scrollToSection('services')}
                className="block w-full text-left text-deep-charcoal hover:text-rose-gold px-3 py-2 text-base font-medium transition-colors"
              >
                Услуги
              </button>
              <button 
                onClick={() => scrollToSection('booking')}
                className="block w-full text-left text-deep-charcoal hover:text-rose-gold px-3 py-2 text-base font-medium transition-colors"
              >
                Запись
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="block w-full text-left text-deep-charcoal hover:text-rose-gold px-3 py-2 text-base font-medium transition-colors"
              >
                О мастере
              </button>
              <Button 
                onClick={handleLogin}
                className="w-full bg-rose-gold text-white mt-2 rounded-lg font-medium hover:bg-rose-gold/90 transition-all"
              >
                Войти
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
