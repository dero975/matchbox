import { useLocation } from "wouter";
import { Zap, Archive, Settings, Home } from "lucide-react";

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    {
      path: "/",
      icon: Home,
      label: "Home",
      isActive: location === "/",
    },
    {
      path: "/match",
      icon: Zap,
      label: "Match",
      isActive: location === "/match",
    },
    {
      path: "/archive",
      icon: Archive,
      label: "Archivio",
      isActive: location === "/archive",
    },
    {
      path: "/settings",
      icon: Settings,
      label: "Profilo",
      isActive: location === "/settings",
    },
  ];

  return (
    <nav className="mobile-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            onClick={() => setLocation(item.path)}
            className={`nav-item ${item.isActive ? "active" : ""}`}
          >
            <Icon size={22} className="mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
