import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth.tsx";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, User, Bell, Shield, MapPin, Key, Download, Trash2, LogOut, Check } from "lucide-react";

interface ProfileFormData {
  nickname: string;
  location: string;
}

interface NotificationSettings {
  newMatches: boolean;
  messages: boolean;
  reminders: boolean;
}

interface PrivacySettings {
  predefinedMessages: boolean;
  showLocation: boolean;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    newMatches: true,
    messages: true,
    reminders: false,
  });
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    predefinedMessages: true,
    showLocation: true,
  });

  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      nickname: user?.nickname || "",
      location: user?.location || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PUT", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Profilo aggiornato",
        description: "Le tue informazioni sono state salvate",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento del profilo",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Arrivederci!",
        description: "Logout effettuato con successo",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante il logout",
        variant: "destructive",
      });
    }
  };

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Impostazione salvata",
      description: `Notifiche ${value ? "attivate" : "disattivate"}`,
    });
  };

  const handlePrivacyChange = (key: keyof PrivacySettings, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Privacy aggiornata",
      description: "Impostazione salvata",
    });
  };

  return (
    <div className="min-h-screen matchbox-gradient">
      {/* Header */}
      <header className="bg-primary/90 text-white p-4 shadow-lg backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-4">
          <Settings className="inline mr-2" />
          Impostazioni
        </h2>
        <p className="text-white/80">Personalizza la tua esperienza MATCHBOX</p>
      </header>

      <main className="p-6 space-y-6">
        {/* Profile Section */}
        <Card className="matchbox-card p-6">
          <h3 className="font-bold text-lg text-primary mb-4 flex items-center">
            <User className="mr-2 text-primary" />
            Il tuo Profilo
          </h3>
          
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mr-4">
              <User className="h-8 w-8 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-primary">{user?.nickname}</h4>
              <p className="text-gray-600">{user?.location || "Posizione non impostata"}</p>
            </div>
          </div>
          
          <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
            <div>
              <Label htmlFor="nickname" className="flex items-center mb-2">
                <User className="h-4 w-4 mr-2" />
                Nickname
              </Label>
              <Input
                id="nickname"
                {...profileForm.register("nickname")}
                className="matchbox-input"
              />
            </div>
            
            <div>
              <Label htmlFor="location" className="flex items-center mb-2">
                <MapPin className="h-4 w-4 mr-2" />
                Zona geografica
              </Label>
              <Input
                id="location"
                {...profileForm.register("location")}
                placeholder="es. Roma Nord"
                className="matchbox-input"
              />
            </div>
            
            <Button 
              type="submit" 
              className="matchbox-button"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Salvando..." : "Aggiorna Profilo"}
            </Button>
          </form>
        </Card>

        {/* Notifications Section */}
        <Card className="matchbox-card p-6">
          <h3 className="font-bold text-lg text-primary mb-4 flex items-center">
            <Bell className="mr-2 text-accent" />
            Notifiche
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-primary">Nuovi match</h4>
                <p className="text-sm text-gray-600">Ricevi notifiche per nuovi match trovati</p>
              </div>
              <Switch
                checked={notificationSettings.newMatches}
                onCheckedChange={(checked) => handleNotificationChange("newMatches", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-primary">Nuovi messaggi</h4>
                <p className="text-sm text-gray-600">Notifiche per messaggi nelle chat</p>
              </div>
              <Switch
                checked={notificationSettings.messages}
                onCheckedChange={(checked) => handleNotificationChange("messages", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-primary">Promemoria scambi</h4>
                <p className="text-sm text-gray-600">Ricorda appuntamenti di scambio</p>
              </div>
              <Switch
                checked={notificationSettings.reminders}
                onCheckedChange={(checked) => handleNotificationChange("reminders", checked)}
              />
            </div>
          </div>
        </Card>

        {/* Privacy Section */}
        <Card className="matchbox-card p-6">
          <h3 className="font-bold text-lg text-primary mb-4 flex items-center">
            <Shield className="mr-2 text-green-600" />
            Privacy e Sicurezza
          </h3>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-primary">Messaggi predefiniti</h4>
                <p className="text-sm text-gray-600">Usa solo messaggi sicuri predefiniti</p>
              </div>
              <Switch
                checked={privacySettings.predefinedMessages}
                onCheckedChange={(checked) => handlePrivacyChange("predefinedMessages", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-primary">Mostra posizione</h4>
                <p className="text-sm text-gray-600">Condividi la tua zona geografica</p>
              </div>
              <Switch
                checked={privacySettings.showLocation}
                onCheckedChange={(checked) => handlePrivacyChange("showLocation", checked)}
              />
            </div>
          </div>
          
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span>Nessun dato personale richiesto</span>
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span>Chat protette e sicure</span>
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span>Nessuna pubblicità o tracciamento</span>
            </div>
          </div>
        </Card>

        {/* App Info */}
        <Card className="matchbox-card p-6">
          <h3 className="font-bold text-lg text-primary mb-4">
            Informazioni App
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Versione</span>
              <span className="font-semibold text-primary">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ultimo aggiornamento</span>
              <span className="font-semibold text-primary">Novembre 2024</span>
            </div>
          </div>
        </Card>

        {/* Account Actions */}
        <div className="space-y-3">
          <Button 
            variant="outline"
            className="w-full matchbox-button-secondary"
          >
            <Key className="mr-2 h-4 w-4" />
            Cambia Password
          </Button>
          
          <Button 
            variant="outline"
            className="w-full matchbox-button-secondary"
          >
            <Download className="mr-2 h-4 w-4" />
            Esporta Dati
          </Button>
          
          <Button 
            variant="outline"
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Elimina Account
          </Button>
          
          <Button 
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Esci dall'Account
          </Button>
        </div>
      </main>
    </div>
  );
}
