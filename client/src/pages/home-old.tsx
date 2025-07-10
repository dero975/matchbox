import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth.tsx";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { Bell, Zap, Users, Archive, Settings } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const { data: albums } = useQuery({
    queryKey: ["/api/albums"],
    enabled: isAuthenticated,
  });

  const { data: userFigurines } = useQuery({
    queryKey: ["/api/user/figurines"],
    enabled: isAuthenticated,
  });

  const { data: potentialMatches } = useQuery({
    queryKey: ["/api/matches/potential"],
    enabled: isAuthenticated,
  });

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

  const totalCards = userFigurines?.length || 0;
  const doubles = userFigurines?.filter(uf => uf.status === 'double').length || 0;
  const matches = potentialMatches?.length || 0;

  return (
    <div className="space-y-4">
      {/* Mobile Welcome Card */}
      <div className="mobile-card">
        <div className="text-center mb-4">
          <h2 className="mobile-title">Ciao {user?.nickname}! 👋</h2>
          <p className="mobile-subtitle">Pronti per nuovi scambi?</p>
        </div>
        
        {/* Mobile Quick Stats */}
        <div className="mobile-grid-3 gap-3 mb-4">
          <div className="text-center bg-teal-50 rounded-xl p-3">
            <div className="text-xl font-bold text-teal-600">{totalCards}</div>
            <div className="text-xs text-gray-600">Figurine</div>
          </div>
          <div className="text-center bg-yellow-50 rounded-xl p-3">
            <div className="text-xl font-bold text-yellow-600">{doubles}</div>
            <div className="text-xs text-gray-600">Doppie</div>
          </div>
          <div className="text-center bg-green-50 rounded-xl p-3">
            <div className="text-xl font-bold text-green-600">{matches}</div>
            <div className="text-xs text-gray-600">Match</div>
          </div>
        </div>
      </div>

      {/* Mobile Quick Actions */}
      <div className="mobile-grid-2 gap-3">
        <button 
          onClick={() => setLocation("/match")}
          className="mobile-card text-center p-4 active:scale-95 transition-transform"
        >
          <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <div className="mobile-subtitle">Trova Match</div>
          <div className="text-xs text-gray-500">{matches} disponibili</div>
        </button>
        
        <button 
          onClick={() => setLocation("/archive")}
          className="mobile-card text-center p-4 active:scale-95 transition-transform"
        >
          <Archive className="h-8 w-8 text-teal-600 mx-auto mb-2" />
          <div className="mobile-subtitle">Le Mie Figurine</div>
          <div className="text-xs text-gray-500">{totalCards} figurine</div>
        </button>
      </div>

      {/* Mobile Recent Matches */}
      {potentialMatches && potentialMatches.length > 0 && (
        <div className="mobile-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="mobile-title">Nuovi Match</h3>
            <span className="status-badge bg-yellow-100 text-yellow-800">
              {matches} Nuovi
            </span>
          </div>
          
            <div className="space-y-2">
              {Array.isArray(potentialMatches) && potentialMatches.slice(0, 2).map((match, index) => (
                <div 
                  key={index}
                  className="mobile-list-item"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-teal-600 p-2 rounded-lg">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">Utente {index + 1}</div>
                      <div className="text-sm text-gray-600">Scambi disponibili</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">85%</div>
                      <div className="text-xs text-gray-500">Match</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile Collections Overview */}
      {Array.isArray(albums) && albums.length > 0 && (
        <div className="mobile-card">
          <h3 className="mobile-title mb-4">Le Tue Collezioni</h3>
          <div className="mobile-grid-2 gap-3">
            {albums.slice(0, 2).map((album, index) => (
              <div key={index} className="bg-teal-50 rounded-xl p-3">
                <div className="bg-teal-100 rounded-lg h-16 mb-2 flex items-center justify-center">
                  <Archive className="h-6 w-6 text-teal-600" />
                </div>
                <div className="mobile-subtitle">{album.name || 'Collezione'}</div>
                <div className="text-xs text-gray-600">0/{album.totalCards || 0} carte</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
              <Zap className="h-6 w-6 mx-auto mb-1" />
              <span className="text-sm font-semibold">Match</span>
            </div>
          </Button>
          <Button 
            onClick={() => setLocation("/settings")}
            className="matchbox-button-secondary h-16"
          >
            <div className="text-center">
              <Settings className="h-6 w-6 mx-auto mb-1" />
              <span className="text-sm font-semibold">Impostazioni</span>
            </div>
          </Button>
        </div>
      </main>
    </div>
  );
}
