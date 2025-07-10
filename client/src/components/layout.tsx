import { useAuth } from "@/lib/auth.tsx";
import { useLocation } from "wouter";
import BottomNav from "@/components/bottom-nav";
import Logo from "@/components/logo";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  // Pages that should not show bottom navigation
  const hideBottomNav = ["/login", "/chat"].some(path => 
    location.startsWith(path)
  ) || !isAuthenticated;

  return (
    <div className="mobile-app">
      {/* Mobile Header - only show when authenticated */}
      {isAuthenticated && !location.startsWith("/login") && (
        <header className="mobile-header">
          <Logo size="small" className="text-white" />
          <div className="text-sm font-medium">Matchbox</div>
        </header>
      )}
      
      {/* Mobile Content Area */}
      <main className={`${isAuthenticated && !location.startsWith("/login") ? "mobile-content" : "flex-1 overflow-y-auto bg-teal-50 p-4"}`}>
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
