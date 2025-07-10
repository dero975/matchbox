import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Zap, Users, MapPin, MessageCircle, RefreshCw, Heart, X } from "lucide-react";
import type { User } from "@shared/schema";

interface PotentialMatch {
  user: User;
  compatibility: number;
  possibleTrades: number;
}

export default function MatchPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const { data: potentialMatches = [], isLoading, refetch } = useQuery<PotentialMatch[]>({
    queryKey: ["/api/matches/potential"],
  });

  const { data: existingMatches = [] } = useQuery({
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
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-orange-600";
  };

  const getMatchIcon = (percentage: number) => {
    if (percentage >= 90) return "🔥";
    if (percentage >= 70) return "⭐";
    return "👍";
  };

  if (isLoading) {
    return (
      <div className="mobile-empty">
        <Zap className="h-12 w-12 mx-auto mb-4 animate-pulse text-yellow-500" />
        <p className="mobile-body">Cercando match perfetti...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Header */}
      <div className="mobile-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="mobile-title flex items-center">
              <Zap className="mr-2 h-6 w-6 text-yellow-500" />
              Trova Match
            </h2>
            <p className="mobile-body">Per Calciatori Panini 2024/25</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
            className="btn-secondary"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="mobile-grid-2 gap-3">
          <div className="text-center bg-teal-50 rounded-xl p-3">
            <div className="text-xl font-bold text-teal-600">{potentialMatches.length}</div>
            <div className="text-xs text-gray-600">Match trovati</div>
          </div>
          <div className="text-center bg-green-50 rounded-xl p-3">
            <div className="text-xl font-bold text-green-600">{existingMatches.length}</div>
            <div className="text-xs text-gray-600">Match attivi</div>
          </div>
        </div>
      </div>

      {/* Mobile Matches List */}
      {potentialMatches.length > 0 ? (
        <div className="space-y-3">
          {potentialMatches.map((match) => (
            <div key={match.user.id} className="mobile-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-teal-100 rounded-full p-3">
                    <Users className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <div className="mobile-subtitle">{match.user.nickname}</div>
                    <div className="mobile-body flex items-center">
                      <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                      {match.user.location}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getMatchPercentageColor(match.compatibility)}`}>
                    {match.compatibility}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {getMatchIcon(match.compatibility)} Match
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="mobile-body">
                  <strong>{match.possibleTrades}</strong> scambi possibili 1:1
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Le tue doppie per le sue mancanti
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleMatch(match)}
                  disabled={createMatchMutation.isPending}
                  className="btn-primary flex-1"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Proponi Scambio
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="aspect-square"
                  onClick={() => {
                    toast({
                      title: "Utente saltato",
                      description: "Non verrà più mostrato per oggi",
                    });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mobile-empty">
          <Users className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="mobile-title text-gray-600 mb-2">Nessun match trovato</h3>
          <p className="mobile-body text-gray-500 mb-6">
            Aggiungi più figurine alla tua collezione per trovare utenti compatibili
          </p>
          <Button 
            onClick={() => setLocation("/archive")}
            className="btn-primary"
          >
            Gestisci Figurine
          </Button>
        </div>
      )}

      {/* Mobile Existing Matches */}
      {existingMatches.length > 0 && (
        <div className="mobile-card">
          <h3 className="mobile-title mb-4">Match Attivi</h3>
          <div className="space-y-2">
            {existingMatches.slice(0, 3).map((match: any) => (
              <div key={match.id} className="mobile-list-item">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 rounded-full p-2">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="mobile-subtitle">
                        {match.user1?.nickname === user?.nickname ? match.user2?.nickname : match.user1?.nickname}
                      </div>
                      <div className="text-xs text-gray-500">
                        {match.compatibility}% compatibilità
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => setLocation(`/chat/${match.id}`)}
                    className="btn-secondary"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {existingMatches.length > 3 && (
            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => setLocation("/chat")}
            >
              Vedi tutti ({existingMatches.length})
            </Button>
          )}
        </div>
      )}
    </div>
  );
}