import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Zap, Users, MapPin, MessageCircle, RefreshCw, Search, Heart, X } from "lucide-react";
import type { User } from "@shared/schema";

interface PotentialMatch {
  user: User;
  compatibility: number;
  possibleTrades: number;
}

export default function Match() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const { data: potentialMatches, isLoading, refetch } = useQuery<PotentialMatch[]>({
    queryKey: ["/api/matches/potential"],
  });

  const { data: existingMatches } = useQuery({
    queryKey: ["/api/matches"],
  });

  const createMatchMutation = useMutation({
    mutationFn: async ({ userId2, compatibility }: { userId2: number; compatibility: number }) => {
      const response = await apiRequest("POST", "/api/matches", { userId2, compatibility });
      return response.json();
    },
    onSuccess: (newMatch) => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({
        title: "Match creato! 🎉",
        description: "Ora puoi iniziare a chattare",
      });
      setLocation(`/chat/${newMatch.id}`);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nella creazione del match",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
    toast({
      title: "Aggiornato!",
      description: "Nuovi match cercati",
    });
  };

  const handleMatch = (potentialMatch: PotentialMatch) => {
    createMatchMutation.mutate({
      userId2: potentialMatch.user.id,
      compatibility: potentialMatch.compatibility,
    });
  };

  const getMatchPercentageColor = (percentage: number) => {
    if (percentage >= 90) return "from-green-400 to-green-600";
    if (percentage >= 70) return "from-yellow-400 to-yellow-600";
    return "from-orange-400 to-orange-600";
  };

  const getMatchIcon = (percentage: number) => {
    if (percentage >= 90) return "🔥";
    if (percentage >= 70) return "⭐";
    return "👍";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen matchbox-gradient flex items-center justify-center">
        <div className="text-white text-center">
          <Zap className="h-12 w-12 mx-auto mb-4 animate-pulse lightning-icon" />
          <p>Cercando match perfetti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen matchbox-gradient">
      {/* Header */}
      <header className="bg-primary/90 text-white p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <Zap className="mr-2 lightning-icon" />
              Trova Match
            </h2>
            <p className="text-white/80">Ciao {user?.nickname}! Trova persone per scambiare</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-white hover:bg-white/20"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
        
        {/* Location Display */}
        <div className="flex items-center justify-center space-x-2 bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
          <MapPin className="h-4 w-4" />
          <span className="font-semibold">{user?.location || "Posizione non impostata"}</span>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Stats Card */}
        <Card className="matchbox-card p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{potentialMatches?.length || 0}</div>
              <div className="text-sm text-gray-600">Match trovati</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent-foreground">{existingMatches?.length || 0}</div>
              <div className="text-sm text-gray-600">Match attivi</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {potentialMatches?.filter(m => m.compatibility >= 80).length || 0}
              </div>
              <div className="text-sm text-gray-600">Super match</div>
            </div>
          </div>
        </Card>

        {/* Potential Matches */}
        {potentialMatches && potentialMatches.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Match Suggeriti</h3>
              <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
                {potentialMatches.length} trovati
              </span>
            </div>
            
            {potentialMatches.map((match) => {
              const isAlreadyMatched = existingMatches?.some(
                (em: any) => em.userId1 === match.user.id || em.userId2 === match.user.id
              );

              return (
                <Card key={match.user.id} className="matchbox-card overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary p-3 rounded-xl">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-primary text-lg">{match.user.nickname}</h4>
                          {match.user.location && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {match.user.location}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`bg-gradient-to-r ${getMatchPercentageColor(match.compatibility)} text-white px-3 py-1 rounded-full font-bold text-sm flex items-center`}>
                          <span className="mr-1">{getMatchIcon(match.compatibility)}</span>
                          {match.compatibility}% Match
                        </div>
                      </div>
                    </div>

                    {/* Trade Info */}
                    <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-4 mb-4 border-2 border-primary/10">
                      <div className="flex items-center justify-center text-sm text-primary font-semibold">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {match.possibleTrades} scambi possibili
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      {isAlreadyMatched ? (
                        <Button 
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => {
                            const existingMatch = existingMatches?.find(
                              (em: any) => em.userId1 === match.user.id || em.userId2 === match.user.id
                            );
                            if (existingMatch) {
                              setLocation(`/chat/${existingMatch.id}`);
                            }
                          }}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Chat Attiva
                        </Button>
                      ) : (
                        <>
                          <Button 
                            onClick={() => handleMatch(match)}
                            disabled={createMatchMutation.isPending}
                            className="flex-1 matchbox-button"
                          >
                            <Heart className="mr-2 h-4 w-4" />
                            {createMatchMutation.isPending ? "Creando..." : "Crea Match!"}
                          </Button>
                          <Button 
                            variant="outline"
                            size="icon"
                            className="border-gray-300 hover:bg-gray-100"
                          >
                            <X className="h-4 w-4 text-gray-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="matchbox-card p-8">
            <div className="text-center">
              <div className="text-6xl text-gray-300 mb-4">
                <Search className="mx-auto h-16 w-16" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Nessun match trovato</h3>
              <p className="text-gray-500 mb-4">
                Aggiungi più figurine alla tua collezione per trovare più persone con cui scambiare!
              </p>
              <Button 
                onClick={() => setLocation("/archive")}
                className="matchbox-button"
              >
                Vai all'Archivio
              </Button>
            </div>
          </Card>
        )}

        {/* Tips Card */}
        <Card className="matchbox-card p-6 bg-gradient-to-r from-accent/10 to-primary/10">
          <h3 className="font-bold text-primary mb-3 flex items-center">
            <Zap className="mr-2 h-5 w-5 lightning-icon" />
            Consigli per più match
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
              Aggiungi le figurine che cerchi come "Mancanti"
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
              Segna le tue doppie per aumentare le possibilità di scambio
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
              Imposta la tua zona per trovare persone vicine
            </li>
          </ul>
        </Card>
      </main>
    </div>
  );
}
