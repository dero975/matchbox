import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth.tsx";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Package, Plus, Minus, Check, X, Eye, Archive } from "lucide-react";
import type { Album, UserFigurine, Figurine } from "@shared/schema";

export default function ArchivePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedAlbum, setSelectedAlbum] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: albums, isLoading: albumsLoading } = useQuery<Album[]>({
    queryKey: ["/api/albums"],
  });

  const { data: userFigurines, isLoading: figurinesLoading } = useQuery<(UserFigurine & { figurine: Figurine })[]>({
    queryKey: ["/api/user/figurines", selectedAlbum],
    enabled: !!selectedAlbum,
  });

  const { data: allFigurines } = useQuery<Figurine[]>({
    queryKey: ["/api/albums", selectedAlbum, "figurines"],
    enabled: !!selectedAlbum,
  });

  const updateFigurineMutation = useMutation({
    mutationFn: async ({ figurineId, possiede, doppione }: { figurineId: number; possiede: boolean; doppione: boolean }) => {
      // Find existing user figurine or create new one
      const existing = userFigurines?.find(uf => uf.figurineId === figurineId);
      
      if (existing) {
        const response = await apiRequest("PUT", `/api/user/figurines/${existing.id}`, { possiede, doppione });
        return response.json();
      } else {
        const response = await apiRequest("POST", `/api/user/figurines`, { 
          figurineId, 
          possiede, 
          doppione 
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/figurines"] });
      toast({
        title: "Successo",
        description: "Figurina aggiornata",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento della figurina",
        variant: "destructive",
      });
    },
  });

  if (albumsLoading) {
    return (
      <div className="mobile-empty">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="mobile-body">Caricamento collezioni...</p>
      </div>
    );
  }

  const filteredFigurines = allFigurines?.filter(figurine => {
    const matchesSearch = figurine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         figurine.idFig.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         figurine.team?.toLowerCase().includes(searchQuery.toLowerCase());

    const userFig = userFigurines?.find(uf => uf.figurineId === figurine.id);
    
    if (statusFilter === "owned") return userFig?.possiede;
    if (statusFilter === "missing") return !userFig?.possiede;
    if (statusFilter === "doubles") return userFig?.doppione;
    
    return matchesSearch;
  }).filter(figurine => {
    return figurine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           figurine.idFig.toLowerCase().includes(searchQuery.toLowerCase()) ||
           figurine.team?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getFigurineStatus = (figurine: Figurine) => {
    const userFig = userFigurines?.find(uf => uf.figurineId === figurine.id);
    if (!userFig) return { possiede: false, doppione: false };
    return { possiede: userFig.possiede, doppione: userFig.doppione };
  };

  const totalCards = allFigurines?.length || 0;
  const ownedCards = userFigurines?.filter(uf => uf.possiede).length || 0;
  const doubleCards = userFigurines?.filter(uf => uf.doppione).length || 0;

  return (
    <div className="space-y-4">
      {/* Mobile Album Selection */}
      <div className="mobile-card">
        <h2 className="mobile-title mb-4 flex items-center">
          <Package className="mr-2 h-5 w-5" />
          Scegli una Collezione
        </h2>
        
        {albums && albums.length > 0 ? (
          <div className="space-y-3">
            {albums.map((album) => (
              <button
                key={album.id}
                onClick={() => setSelectedAlbum(album.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedAlbum === album.id
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 bg-white active:scale-[0.98]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Package className={`h-6 w-6 ${selectedAlbum === album.id ? "text-teal-600" : "text-gray-400"}`} />
                  {selectedAlbum === album.id && <Check className="h-5 w-5 text-teal-600" />}
                </div>
                <h3 className="mobile-subtitle">{album.name}</h3>
                <p className="mobile-body">{album.description}</p>
                <div className="text-xs text-gray-500 mt-2">
                  {album.totalCards} figurine totali
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mobile-empty py-8">
            <Package className="h-16 w-16 text-gray-300 mb-4" />
            <p className="mobile-body">Nessuna collezione disponibile</p>
          </div>
        )}
      </div>

      {/* Mobile Album Stats */}
      {selectedAlbum && (
        <div className="mobile-card">
          <h3 className="mobile-title mb-4">Statistiche Collezione</h3>
          <div className="mobile-grid-3 gap-3">
            <div className="text-center bg-teal-50 rounded-xl p-3">
              <div className="text-xl font-bold text-teal-600">{ownedCards}</div>
              <div className="text-xs text-gray-600">Possedute</div>
            </div>
            <div className="text-center bg-yellow-50 rounded-xl p-3">
              <div className="text-xl font-bold text-yellow-600">{doubleCards}</div>
              <div className="text-xs text-gray-600">Doppie</div>
            </div>
            <div className="text-center bg-gray-50 rounded-xl p-3">
              <div className="text-xl font-bold text-gray-600">{totalCards - ownedCards}</div>
              <div className="text-xs text-gray-600">Mancanti</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-teal-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${totalCards > 0 ? (ownedCards / totalCards) * 100 : 0}%` }}
              />
            </div>
            <div className="text-center text-sm text-gray-600 mt-2">
              {totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0}% completato
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search and Filters */}
      {selectedAlbum && (
        <div className="mobile-card">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca figurine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtra per stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le figurine</SelectItem>
                <SelectItem value="owned">Possedute</SelectItem>
                <SelectItem value="missing">Mancanti</SelectItem>
                <SelectItem value="doubles">Doppie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Mobile Figurines List */}
      {selectedAlbum && (
        <div className="mobile-card">
          <h3 className="mobile-title mb-4">Figurine</h3>
          
          {figurinesLoading ? (
            <div className="mobile-empty py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="mobile-body">Caricamento figurine...</p>
            </div>
          ) : filteredFigurines && filteredFigurines.length > 0 ? (
            <div className="space-y-2">
              {filteredFigurines.map((figurine) => {
                const status = getFigurineStatus(figurine);
                return (
                  <div 
                    key={figurine.id}
                    className={`mobile-list-item ${status.possiede ? 'bg-green-50' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="mobile-subtitle">
                            {figurine.idFig} - {figurine.name}
                          </div>
                          <div className="flex space-x-1">
                            {status.possiede && (
                              <span className="status-badge bg-green-100 text-green-800 text-xs">
                                ✅ Posseduta
                              </span>
                            )}
                            {status.doppione && (
                              <span className="status-badge bg-yellow-100 text-yellow-800 text-xs">
                                🔁 Doppione
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mobile-body">
                          {figurine.team && (
                            <span className="text-teal-600">{figurine.team}</span>
                          )}
                          {figurine.category && (
                            <span className="text-gray-500 ml-2">• {figurine.category}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant={status.possiede ? "default" : "outline"}
                          onClick={() => updateFigurineMutation.mutate({
                            figurineId: figurine.id,
                            possiede: !status.possiede,
                            doppione: status.doppione
                          })}
                          disabled={updateFigurineMutation.isPending}
                        >
                          {status.possiede ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant={status.doppione ? "secondary" : "outline"}
                          onClick={() => updateFigurineMutation.mutate({
                            figurineId: figurine.id,
                            possiede: status.possiede,
                            doppione: !status.doppione
                          })}
                          disabled={updateFigurineMutation.isPending}
                        >
                          {status.doppione ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mobile-empty py-8">
              <Archive className="h-16 w-16 text-gray-300 mb-4" />
              <p className="mobile-body">Nessuna figurina trovata</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}