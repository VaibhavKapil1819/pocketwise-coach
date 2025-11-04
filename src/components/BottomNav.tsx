import { useNavigate, useLocation } from "react-router-dom";
import { Target, Sparkles, Calendar, Settings } from "lucide-react";
import { Button } from "./ui/button";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: "/dashboard", label: "Journey", icon: Target },
    { path: "/coach", label: "AI Coach", icon: Sparkles },
    { path: "/plan", label: "Plan", icon: Calendar },
    { path: "/money-flow", label: "", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-around py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            
            return (
              <Button
                key={tab.path}
                variant="ghost"
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-1 h-auto py-2 px-4 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? "scale-110" : ""}`} />
                {tab.label && (
                  <span className="text-xs font-medium">{tab.label}</span>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
