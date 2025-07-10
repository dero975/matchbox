import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDeferredPrompt(null);
  };

  if (!showBanner || !deferredPrompt) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-teal-600 text-white p-4 shadow-lg">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center space-x-3">
          <img 
            src="/matchnode-192.png" 
            alt="Matchbox" 
            className="w-8 h-8 rounded-lg"
          />
          <div>
            <p className="font-semibold text-sm">Installa Matchbox</p>
            <p className="text-xs opacity-90">Aggiungi alla schermata home</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleInstall}
            size="sm"
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            <Download className="w-4 h-4 mr-1" />
            Installa
          </Button>
          <Button 
            onClick={handleDismiss}
            size="sm"
            variant="ghost"
            className="text-white hover:bg-teal-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}