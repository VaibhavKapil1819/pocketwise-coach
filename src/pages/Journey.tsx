import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import StreakWidget from "@/components/StreakWidget";
import AIActionPlan from "@/components/AIActionPlan";
import ImpactChart from "@/components/ImpactChart";
import IncomeBooster from "@/components/IncomeBooster";
import { motion } from "framer-motion";

const Journey = () => {
  const [profile, setProfile] = useState<any>(null);
  const [topGoal, setTopGoal] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const [profileRes, goalsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("goals").select("*").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false })
      ]);

      if (profileRes.error) throw profileRes.error;
      if (goalsRes.error) throw goalsRes.error;

      setProfile(profileRes.data);
      setGoals(goalsRes.data || []);
      if (goalsRes.data && goalsRes.data.length > 0) {
        setTopGoal(goalsRes.data[0]);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 pb-24">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Your Journey</h1>
          <p className="text-muted-foreground">
            Hi {profile?.full_name || "there"}! 👋
          </p>
        </div>

        {/* Streak Widget */}
        <div className="mb-6">
          <StreakWidget 
            streak={profile?.current_streak || 0}
            onLogNow={() => navigate("/money-flow")}
          />
        </div>

        {/* Hero Goal */}
        {topGoal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="glass border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold">Top Priority Goal</h2>
                  </div>
                  <span className="text-lg font-semibold text-primary">
                    {Math.round((topGoal.current_amount / topGoal.target_amount) * 100)}%
                  </span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">{topGoal.title}</h3>
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
          </motion.div>
        )}

        {/* Other Active Goals */}
        {goals.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
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
          </motion.div>
        )}

        {/* AI Action Plan */}
        <div className="mb-6">
          <AIActionPlan />
        </div>

        {/* Impact Chart */}
        <div className="mb-6">
          <ImpactChart />
        </div>

        {/* Income Booster & Risk Shield */}
        <IncomeBooster />
      </div>

      <BottomNav />
    </div>
  );
};

export default Journey;
