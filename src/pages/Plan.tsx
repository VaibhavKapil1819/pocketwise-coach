import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Check, Sparkles, Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";

interface DailyAction {
  id: string;
  action: string;
  impact: string;
  completed: boolean;
}

interface WeeklyAction {
  id: string;
  action: string;
  target: string;
  progress: number;
}

const Plan = () => {
  const [loading, setLoading] = useState(true);
  const [dailyActions, setDailyActions] = useState<DailyAction[]>([
    { id: "1", action: "Skip morning coffee", impact: "+₹180 → +2 days faster", completed: false },
    { id: "2", action: "Pack lunch instead of ordering", impact: "+₹250 → +3 days faster", completed: false },
    { id: "3", action: "Use metro instead of cab", impact: "+₹150 → +2 days faster", completed: false },
  ]);
  
  const [weeklyActions, setWeeklyActions] = useState<WeeklyAction[]>([
    { id: "1", action: "Cut dining expenses", target: "Stay under ₹1,500", progress: 65 },
    { id: "2", action: "Freelance hours", target: "Complete 2 projects", progress: 50 },
    { id: "3", action: "Auto-save setup", target: "Enable ₹5,000/month", progress: 0 },
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setLoading(false);
  };

  const toggleDailyAction = (id: string) => {
    setDailyActions(prev =>
      prev.map(action =>
        action.id === id ? { ...action, completed: !action.completed } : action
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const completedDaily = dailyActions.filter(a => a.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 pb-24">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            Your Action Plan
          </h1>
          <p className="text-muted-foreground">
            Complete actions to accelerate your goals
          </p>
        </div>

        {/* Daily Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="glass border-none">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Today's Actions
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {completedDaily}/{dailyActions.length} completed
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dailyActions.map((action, idx) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    action.completed
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/20 hover:border-primary/50"
                  }`}
                  onClick={() => toggleDailyAction(action.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      action.completed
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}>
                      {action.completed && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold mb-1 ${action.completed ? "line-through text-muted-foreground" : ""}`}>
                        {action.action}
                      </p>
                      <p className="text-sm text-muted-foreground">{action.impact}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                This Week's Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {weeklyActions.map((action, idx) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{action.action}</p>
                      <p className="text-sm text-muted-foreground">{action.target}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {action.progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${action.progress}%` }}
                      transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                      className="h-full bg-primary"
                    />
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Suggestion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <Card className="glass border-none gradient-primary">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 text-white">
                <Sparkles className="h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold mb-2">AI Insight</p>
                  <p className="text-sm opacity-90">
                    You're on track! Complete 2 more daily actions this week to hit your
                    Japan Trip goal 5 days earlier. Keep up the momentum! 🚀
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Plan;
