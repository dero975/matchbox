import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth.tsx";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Package, Plus, Minus, Check, X, Eye, Camera, Keyboard } from "lucide-react";
import type { Album, UserFigurine, Figurine } from "@shared/schema";

export default function Archive() {
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
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<UserFigurine> }) => {
      const response = await apiRequest("PUT", `/api/user/figurines/${id}`, updates);
      return response.json();
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

  const createFigurineMutation = useMutation({
    mutationFn: async (figurineData: { figurineId: number; status: string; quantity?: number }) => {
      const response = await apiRequest("POST", "/api/user/figurines", figurineData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/figurines"] });
      toast({
        title: "Successo",
        description: "Figurina aggiunta alla collezione",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'aggiunta della figurina",
        variant: "destructive",
      });
    },
  });

  const deleteFigurineMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/user/figurines/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/figurines"] });
      toast({
        title: "Successo",
        description: "Figurina rimossa dalla collezione",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nella rimozione della figurina",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (userFigurine: UserFigurine & { figurine: Figurine }, newStatus: string) => {
    updateFigurineMutation.mutate({
      id: userFigurine.id,
      updates: { status: newStatus },
    });
  };

  const handleQuantityChange = (userFigurine: UserFigurine & { figurine: Figurine }, change: number) => {
    const newQuantity = Math.max(1, userFigurine.quantity + change);
    updateFigurineMutation.mutate({
      id: userFigurine.id,
      updates: { quantity: newQuantity },
    });
  };

  const handleAddFigurine = (figurine: Figurine, status: string) => {
    createFigurineMutation.mutate({
      figurineId: figurine.id,
      status,
      quantity: status === 'double' ? 2 : 1,
    });
  };

  const filteredFigurines = userFigurines?.filter(uf => {
    const matchesStatus = statusFilter === "all" || uf.status === statusFilter;
    const matchesSearch = searchQuery === "" || 
      uf.figurine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uf.figurine.number.includes(searchQuery);
    return matchesStatus && matchesSearch;
  }) || [];

  const getDisplayedFigurines = () => {
    if (!selectedAlbum || !allFigurines) return [];

    if (statusFilter === "wanted") {
      // Show figurines that user doesn't have
      return allFigurines.filter(fig => {
        const userHas = userFigurines?.find(uf => uf.figurineId === fig.id);
        const matchesSearch = searchQuery === "" || 
          fig.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          fig.number.includes(searchQuery);
        return !userHas && matchesSearch;
      }).map(fig => ({
        figurine: fig,
        status: 'wanted' as const,
      }));
    }

    return filteredFigurines;
  };

  const displayedFigurines = getDisplayedFigurines();

  const getStatusCounts = () => {
    if (!userFigurines) return { owned: 0, doubles: 0, wanted: 0 };
    
    const owned = userFigurines.filter(uf => uf.status === 'owned').length;
    const doubles = userFigurines.filter(uf => uf.status === 'double').reduce((sum, uf) => sum + uf.quantity, 0);
    const totalInAlbum = allFigurines?.length || 0;
    const wanted = totalInAlbum - userFigurines.length;
    
    return { owned, doubles, wanted };
  };

  const statusCounts = getStatusCounts();

  if (albumsLoading) {
    return (
      <div className="min-h-screen matchbox-gradient flex items-center justify-center">
        <div className="text-white text-center">
          <Package className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p>Caricamento album...</p>
        </div>
      </div>
    );
  }

  if (!selectedAlbum) {
    return (
      <div className="min-h-screen matchbox-gradient">
        {/* Header */}
        <header className="bg-primary/90 text-white p-4 shadow-lg backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-4">
            <Package className="inline mr-2" />
            Il Mio Archivio
          </h2>
        </header>

        <main className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Seleziona un Album</h3>
            <p className="text-white/80">Scegli quale collezione gestire</p>
          </div>

          {albums && albums.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {albums.map((album) => (
                <Card 
                  key={album.id} 
                  className="matchbox-card cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  onClick={() => setSelectedAlbum(album.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/20 rounded-xl p-4 flex items-center justify-center">
                        <Package className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-primary text-lg">{album.name}</h4>
                        <p className="text-gray-600 text-sm">{album.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-gray-500">{album.totalCards} carte totali</span>
                        </div>
                      </div>
                      <div className="text-primary">
                        <Eye className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="matchbox-card p-8">
              <div className="text-center">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Nessun album disponibile</h3>
                <p className="text-gray-500">Gli album verranno aggiunti presto!</p>
              </div>
            </Card>
          )}
        </main>
      </div>
    );
  }

  const selectedAlbumData = albums?.find(a => a.id === selectedAlbum);

  return (
    <div className="min-h-screen matchbox-gradient">
      {/* Header */}
      <header className="bg-primary/90 text-white p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedAlbum(null)}
              className="text-white hover:bg-white/20 mr-3"
            >
              ←
            </Button>
            <div>
              <h2 className="text-xl font-bold">{selectedAlbumData?.name}</h2>
              <p className="text-sm text-white/80">Gestisci la tua collezione</p>
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cerca figurine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/90 border-white/20 focus:bg-white"
          />
        </div>
      </header>

      <main className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-green-50 border-green-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.owned}</div>
            <div className="text-xs text-green-700">Possedute</div>
          </Card>
          <Card className="bg-blue-50 border-blue-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.doubles}</div>
            <div className="text-xs text-blue-700">Doppie</div>
          </Card>
          <Card className="bg-red-50 border-red-200 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{statusCounts.wanted}</div>
            <div className="text-xs text-red-700">Mancanti</div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Card className="matchbox-card p-2 mb-6">
          <div className="flex space-x-1">
            {[
              { value: "all", label: "Tutte" },
              { value: "wanted", label: "Mancanti" },
              { value: "owned", label: "Possedute" },
              { value: "double", label: "Doppie" },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter(filter.value)}
                className={`flex-1 ${statusFilter === filter.value ? "bg-accent text-accent-foreground" : ""}`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button className="matchbox-button-secondary h-16">
            <div className="text-center">
              <Camera className="h-6 w-6 mx-auto mb-1" />
              <span className="text-sm font-semibold">Scansiona</span>
            </div>
          </Button>
          <Button className="matchbox-button-secondary h-16">
            <div className="text-center">
              <Keyboard className="h-6 w-6 mx-auto mb-1" />
              <span className="text-sm font-semibold">Inserimento</span>
            </div>
          </Button>
        </div>

        {/* Cards Grid */}
        {figurinesLoading ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Caricamento figurine...</p>
          </div>
        ) : displayedFigurines.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {displayedFigurines.map((item) => {
              const isWanted = statusFilter === "wanted" || (!('id' in item) && item.status === 'wanted');
              const figurine = 'figurine' in item ? item.figurine : item.figurine;
              const userFigurine = 'id' in item ? item : null;
              
              return (
                <Card key={figurine.id} className="trading-card p-3">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg h-32 mb-3 flex items-center justify-center">
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <h4 className="font-semibold text-primary">#{figurine.number}</h4>
                    <p className="text-sm text-gray-600 mb-2">{figurine.name}</p>
                    
                    {isWanted ? (
                      <div className="space-y-2">
                        <span className="status-wanted">Mancante</span>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddFigurine(figurine, 'owned')}
                            className="flex-1 text-xs"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Possiedo
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddFigurine(figurine, 'double')}
                            className="flex-1 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Doppia
                          </Button>
                        </div>
                      </div>
                    ) : userFigurine ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center">
                          <span className={
                            userFigurine.status === 'owned' ? 'status-owned' :
                            userFigurine.status === 'double' ? 'status-double' : 'status-wanted'
                          }>
                            {userFigurine.status === 'owned' ? 'Posseduta' :
                             userFigurine.status === 'double' ? `Doppia (${userFigurine.quantity}x)` : 'Mancante'}
                          </span>
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                          {userFigurine.status === 'double' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(userFigurine, -1)}
                                disabled={userFigurine.quantity <= 1}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-semibold px-2">{userFigurine.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(userFigurine, 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteFigurineMutation.mutate(userFigurine.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="matchbox-card p-8">
            <div className="text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {statusFilter === "all" ? "Nessuna figurina" : `Nessuna figurina ${
                  statusFilter === "wanted" ? "mancante" :
                  statusFilter === "owned" ? "posseduta" : "doppia"
                }`}
              </h3>
              <p className="text-gray-500">
                {statusFilter === "wanted" ? "Tutte le figurine sono già nella tua collezione!" :
                 "Inizia ad aggiungere le tue figurine alla collezione"}
              </p>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
