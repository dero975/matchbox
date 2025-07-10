import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import InstallBanner from "@/components/install-banner";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Archive from "@/pages/archive";
import Match from "@/pages/match";
import Settings from "@/pages/settings";
import Chat from "@/pages/chat";
import Layout from "@/components/layout";
import { AuthProvider, useAuth } from "@/lib/auth.tsx";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Login} />
          <Route path="/login" component={Login} />
          <Route component={Login} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/match" component={Match} />
          <Route path="/archive" component={Archive} />
          <Route path="/settings" component={Settings} />
          <Route path="/chat/:matchId" component={Chat} />
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <InstallBanner />
          <Toaster />
          <Layout>
            <Router />
          </Layout>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
