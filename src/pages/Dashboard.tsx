import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Target, 
  BookOpen, 
  Camera, 
  LogOut, 
  PlusCircle,
  Settings,
  Loader2,
  Sparkles,
  TrendingUp
} from "lucide-react";
import AddTransactionDialog from "@/components/AddTransactionDialog";
import Chatbot from "@/components/Chatbot";
import NotificationCenter from "@/components/NotificationCenter";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);
  const [topGoal, setTopGoal] = useState<any>(null);
  const [dailyTip, setDailyTip] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      } else {
        fetchGoals(session.user.id);
        fetchProfile(session.user.id);
        generateDailyTip();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchGoals = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setGoals(data || []);
      if (data && data.length > 0) {
        setTopGoal(data[0]);
      }
    } catch (error: any) {
      console.error("Error fetching goals:", error.message);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Error fetching profile:", error.message);
    }
  };

  const generateDailyTip = () => {
    const tips = [
      "💡 Small daily saves compound into big wins",
      "🎯 Focus on one goal at a time for faster progress",
      "📊 Track progress weekly to stay motivated",
      "💪 Every rupee towards your goal counts",
      "🌟 Celebrate small milestones along the way",
      "🚀 Consistency beats intensity every time"
    ];
    setDailyTip(tips[Math.floor(Math.random() * tips.length)]);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleGoalRefresh = () => {
    if (session?.user?.id) {
      fetchGoals(session.user.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Financial Journey</h1>
            <p className="text-muted-foreground">Hi {profile?.full_name || session?.user?.email?.split("@")[0]}! 👋</p>
          </div>
          <div className="flex gap-2">
            <NotificationCenter />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/money-flow")}
              className="rounded-full"
              title="Money Flow Engine"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="rounded-full"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Daily Mentor Tip */}
        <Card className="glass border-none mb-6 gradient-primary">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-white">
              <Sparkles className="h-6 w-6" />
              <p className="text-lg font-medium">{dailyTip}</p>
            </div>
          </CardContent>
        </Card>

        {/* Hero Goal */}
        {topGoal && (
          <Card className="glass border-none mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Top Priority Goal</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/goals")}
                  className="rounded-full"
                >
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">{topGoal.title}</h3>
                  <span className="text-lg font-semibold text-primary">
                    {Math.round((topGoal.current_amount / topGoal.target_amount) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(topGoal.current_amount / topGoal.target_amount) * 100} 
                  className="h-3"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>₹{topGoal.current_amount.toLocaleString()} saved</span>
                  <span>Goal: ₹{topGoal.target_amount.toLocaleString()}</span>
                </div>
                {topGoal.deadline && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">
                      On track to reach by {new Date(topGoal.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Goals Grid */}
        {goals.length > 1 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Other Active Goals</h2>
            <div className="grid grid-cols-2 gap-4">
              {goals.slice(1, 5).map((goal) => (
                <Card
                  key={goal.id}
                  className="glass border-none cursor-pointer hover:scale-105 transition-all"
                  onClick={() => navigate("/goals")}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{goal.title}</h3>
                    <Progress 
                      value={(goal.current_amount / goal.target_amount) * 100} 
                      className="h-2 mb-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      ₹{goal.current_amount.toLocaleString()} / ₹{goal.target_amount.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card
            className="glass cursor-pointer hover:scale-105 transition-all duration-300 border-none"
            onClick={() => navigate("/smart-entry")}
          >
            <CardContent className="p-6">
              <Camera className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold text-lg mb-1">Add to Goals</h3>
              <p className="text-sm text-muted-foreground">Upload income or receipts</p>
            </CardContent>
          </Card>

          <Card
            className="glass cursor-pointer hover:scale-105 transition-all duration-300 border-none"
            onClick={() => navigate("/coach")}
          >
            <CardContent className="p-6">
              <BookOpen className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold text-lg mb-1">AI Mentor</h3>
              <p className="text-sm text-muted-foreground">Learn & grow</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Add Button */}
        <Button
          onClick={() => setDialogOpen(true)}
          className="w-full gradient-primary text-white hover:opacity-90 transition-opacity rounded-2xl py-6 mb-6"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Add to Goals
        </Button>

        {/* Add Transaction Dialog */}
        <AddTransactionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          userId={session?.user?.id}
          onSuccess={handleGoalRefresh}
        />

        {/* Chatbot */}
        <Chatbot />
      </div>
    </div>
  );
};

export default Dashboard;
