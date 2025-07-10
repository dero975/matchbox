import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, insertUserSchema } from "@shared/schema";
import type { LoginData, InsertUser } from "@shared/schema";
import { useAuth } from "@/lib/auth.tsx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/logo";
import { ArrowLeft, User, Lock, MapPin, UserPlus, LogIn } from "lucide-react";
import { z } from "zod";

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

type RegisterData = z.infer<typeof registerSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [isRegister, setIsRegister] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      nickname: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nickname: "",
      password: "",
      confirmPassword: "",
      location: "",
    },
  });

  const onLogin = async (data: LoginData) => {
    try {
      await login(data);
      setLocation("/");
      toast({
        title: "Benvenuto!",
        description: "Login effettuato con successo",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante il login",
        variant: "destructive",
      });
    }
  };

  const onRegister = async (data: RegisterData) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await register(registerData);
      setLocation("/");
      toast({
        title: "Benvenuto!",
        description: "Account creato con successo",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante la registrazione",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen matchbox-gradient flex flex-col">
      {/* Header */}
      <div className="p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="text-white hover:bg-white/20 mb-6"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        
        <div className="text-center mb-8">
          <Logo size="medium" className="mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">
            {isRegister ? "Registrati" : "Bentornato!"}
          </h2>
          <p className="text-white/80">
            {isRegister ? "Crea il tuo account" : "Accedi al tuo account"}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 bg-white rounded-t-3xl p-6">
        <div className="max-w-sm mx-auto">
          {!isRegister ? (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
              <div>
                <Label htmlFor="nickname" className="flex items-center mb-2">
                  <User className="h-4 w-4 mr-2" />
                  Nickname
                </Label>
                <Input
                  id="nickname"
                  {...loginForm.register("nickname")}
                  placeholder="Il tuo nickname"
                  className="input-mobile"
                />
                {loginForm.formState.errors.nickname && (
                  <p className="text-red-500 text-sm mt-1">
                    {loginForm.formState.errors.nickname.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password" className="flex items-center mb-2">
                  <Lock className="h-4 w-4 mr-2" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...loginForm.register("password")}
                  placeholder="La tua password"
                  className="input-mobile"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full matchbox-button text-lg"
                disabled={loginForm.formState.isSubmitting}
              >
                <LogIn className="mr-2 h-5 w-5" />
                {loginForm.formState.isSubmitting ? "Accesso..." : "Entra in MATCHBOX"}
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-6">
              <div>
                <Label htmlFor="register-nickname" className="flex items-center mb-2">
                  <User className="h-4 w-4 mr-2" />
                  Nickname
                </Label>
                <Input
                  id="register-nickname"
                  {...registerForm.register("nickname")}
                  placeholder="Scegli un nickname"
                  className="matchbox-input"
                />
                {registerForm.formState.errors.nickname && (
                  <p className="text-red-500 text-sm mt-1">
                    {registerForm.formState.errors.nickname.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="register-password" className="flex items-center mb-2">
                  <Lock className="h-4 w-4 mr-2" />
                  Password
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  {...registerForm.register("password")}
                  placeholder="Crea una password"
                  className="matchbox-input"
                />
                {registerForm.formState.errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirm-password" className="flex items-center mb-2">
                  <Lock className="h-4 w-4 mr-2" />
                  Conferma Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  {...registerForm.register("confirmPassword")}
                  placeholder="Ripeti la password"
                  className="matchbox-input"
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="location" className="flex items-center mb-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  Zona (opzionale)
                </Label>
                <Input
                  id="location"
                  {...registerForm.register("location")}
                  placeholder="es. Roma Nord"
                  className="matchbox-input"
                />
                {registerForm.formState.errors.location && (
                  <p className="text-red-500 text-sm mt-1">
                    {registerForm.formState.errors.location.message}
                  </p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full matchbox-button text-lg"
                disabled={registerForm.formState.isSubmitting}
              >
                <UserPlus className="mr-2 h-5 w-5" />
                {registerForm.formState.isSubmitting ? "Registrazione..." : "Crea Account"}
              </Button>
            </form>
          )}
          
          {/* Toggle between login and register */}
          <div className="text-center mt-6">
            <p className="text-gray-600 mb-2">
              {isRegister ? "Hai già un account?" : "Non hai un account?"}
            </p>
            <Button
              variant="ghost"
              onClick={() => setIsRegister(!isRegister)}
              className="text-primary hover:text-primary/80 font-semibold"
            >
              {isRegister ? "Accedi qui!" : "Crealo qui!"}
            </Button>
          </div>

          {/* Privacy Note */}
          <Card className="mt-8 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center text-sm text-green-700">
                <span className="mr-2">🛡️</span>
                La tua privacy è protetta - solo nickname richiesto!
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
