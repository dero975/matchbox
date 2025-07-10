import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth.tsx";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, User, Circle, CheckCircle, Heart, Calendar, MapPin, RefreshCw } from "lucide-react";
import type { Message, User as UserType, Match } from "@shared/schema";

interface MessageWithSender extends Message {
  sender: UserType;
}

interface MatchWithUsers extends Match {
  user1: UserType;
  user2: UserType;
}

export default function Chat() {
  const [, setLocation] = useLocation();
  const { matchId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: match } = useQuery<MatchWithUsers>({
    queryKey: ["/api/matches", matchId],
    enabled: !!matchId,
  });

  const { data: messages, refetch: refetchMessages } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/matches", matchId, "messages"],
    enabled: !!matchId,
    refetchInterval: 3000, // Refresh every 3 seconds for real-time feel
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, messageType = "text" }: { content: string; messageType?: string }) => {
      const response = await apiRequest("POST", `/api/matches/${matchId}/messages`, {
        content,
        messageType,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches", matchId, "messages"] });
      setNewMessage("");
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'invio del messaggio",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessageMutation.mutate({ content: newMessage.trim() });
    }
  };

  const handleQuickReply = (message: string) => {
    sendMessageMutation.mutate({ 
      content: message, 
      messageType: "predefined" 
    });
  };

  if (!matchId || !match || !user) {
    return (
      <div className="min-h-screen matchbox-gradient flex items-center justify-center">
        <div className="text-white text-center">
          <User className="h-12 w-12 mx-auto mb-4" />
          <p>Chat non trovata</p>
          <Button 
            onClick={() => setLocation("/match")}
            className="mt-4 matchbox-button"
          >
            Torna ai Match
          </Button>
        </div>
      </div>
    );
  }

  const otherUser = match.userId1 === user.id ? match.user2 : match.user1;
  const isOnline = Math.random() > 0.5; // Simulate online status

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Chat Header */}
      <header className="bg-primary text-white p-4 shadow-lg flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/match")}
          className="text-white hover:bg-white/20 mr-3"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        
        <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mr-3">
          <User className="h-5 w-5 text-accent-foreground" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold">{otherUser.nickname}</h3>
          <div className="flex items-center text-sm text-white/80">
            <Circle className={`h-2 w-2 mr-1 ${isOnline ? "fill-green-400 text-green-400" : "fill-gray-400 text-gray-400"}`} />
            {isOnline ? "Online" : "Offline"}
            {otherUser.location && (
              <>
                <span className="mx-2">•</span>
                <MapPin className="h-3 w-3 mr-1" />
                {otherUser.location}
              </>
            )}
          </div>
        </div>
        
        <div className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
          {match.compatibility}% Match
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages && messages.length > 0 ? (
          messages.map((message) => {
            const isOwnMessage = message.senderId === user.id;
            
            return (
              <div 
                key={message.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  isOwnMessage 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-gray-100 text-gray-800 rounded-tl-none"
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <div className={`text-xs mt-1 ${
                    isOwnMessage ? "text-white/70" : "text-gray-500"
                  }`}>
                    {new Date(message.createdAt).toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                    {isOwnMessage && (
                      <CheckCircle className="inline h-3 w-3 ml-1" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Inizia la conversazione!</h3>
            <p className="text-gray-500">Questo è l'inizio della vostra chat</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="mb-4">
          <h4 className="font-semibold text-primary mb-2 text-sm">Risposte Rapide:</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickReply("👍 D'accordo!")}
              className="text-xs"
            >
              👍 D'accordo!
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickReply("📅 Quando ci vediamo?")}
              className="text-xs"
            >
              📅 Quando?
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickReply("📍 Incontriamoci qui")}
              className="text-xs"
            >
              📍 Dove?
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickReply("🔄 Altro scambio?")}
              className="text-xs"
            >
              🔄 Altro scambio?
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickReply("💯 Perfetto!")}
              className="text-xs"
            >
              💯 Perfetto!
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickReply("❌ Non mi interessa")}
              className="text-xs"
            >
              ❌ Non interessato
            </Button>
          </div>
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Scrivi un messaggio..."
            className="flex-1 rounded-full border-2 border-gray-200 focus:border-primary"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="bg-primary hover:bg-primary/90 rounded-full"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Trade Proposal Section */}
      {messages && messages.length > 0 && (
        <div className="bg-accent/10 border-t border-accent/20 p-4">
          <Card className="p-4 bg-gradient-to-r from-accent/10 to-primary/10 border-2 border-accent/30">
            <div className="text-center mb-3">
              <div className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center">
                <Heart className="mr-1 h-4 w-4" />
                Proposta di Scambio
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-700 mb-3">
                Vuoi proporre uno scambio con {otherUser.nickname}?
              </p>
              <Button className="matchbox-button">
                <Heart className="mr-2 h-4 w-4" />
                Crea Proposta
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
