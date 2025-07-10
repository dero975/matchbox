import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { Zap, Archive, Settings } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-8">
          <Logo size="large" className="mb-6" />
          <h1 className="text-4xl font-bold text-white mb-2">MATCHBOX</h1>
          <p className="text-white/90 text-lg">Scambia le tue figurine!</p>
        </div>
        
        <div className="w-full max-w-sm space-y-4">
          <Button 
            onClick={() => setLocation("/login")}
            className="btn-primary w-full"
          >
            <Zap className="mr-2 h-5 w-5" />
            Inizia Ora
          </Button>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-white/80 text-sm max-w-xs">
            Nessun dato personale richiesto. Solo nickname sicuro!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Clean white container */}
      <div className="p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ciao {user?.nickname}! 👋
          </h2>
          <p className="text-gray-600">
            Benvenuto in Matchbox
          </p>
        </div>
        
        {/* Simple navigation buttons */}
        <div className="space-y-4">
          <Button 
            onClick={() => setLocation("/match")}
            className="w-full btn-primary"
          >
            <Zap className="mr-2 h-5 w-5" />
            Trova Match
          </Button>
          
          <Button 
            onClick={() => setLocation("/archive")}
            className="w-full btn-secondary"
          >
            <Archive className="mr-2 h-5 w-5" />
            Le Mie Figurine
          </Button>
          
          <Button 
            onClick={() => setLocation("/settings")}
            className="w-full btn-outline"
          >
            <Settings className="mr-2 h-5 w-5" />
            Impostazioni
          </Button>
        </div>
      </div>
    </div>
  );
}