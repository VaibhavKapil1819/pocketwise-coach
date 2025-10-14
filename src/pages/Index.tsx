import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, Target, Brain } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen text-center">
        <div className="space-y-8 animate-fade-in">
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center shadow-2xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Xpensify
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Your AI-powered financial companion for smarter spending and better saving
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button
              size="lg"
              className="gradient-primary text-white hover:opacity-90 transition-opacity rounded-2xl px-8 py-6 text-lg shadow-lg"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-2xl px-8 py-6 text-lg border-2"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
            <div className="glass p-6 rounded-3xl space-y-3 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-2xl gradient-success flex items-center justify-center mx-auto">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Smart Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Effortlessly track income and expenses with intelligent categorization
              </p>
            </div>

            <div className="glass p-6 rounded-3xl space-y-3 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mx-auto">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Goal Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Set and achieve financial goals with personalized insights
              </p>
            </div>

            <div className="glass p-6 rounded-3xl space-y-3 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-2xl gradient-expense flex items-center justify-center mx-auto">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg">AI Coach</h3>
              <p className="text-sm text-muted-foreground">
                Learn financial literacy with your personal AI mentor
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
