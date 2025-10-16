import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Plus, Target, Trash2, TrendingUp, Wallet, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Goal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  category: string;
  status: string;
  prediction?: string;
}

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    target_amount: "",
    deadline: "",
    category: "Savings",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Calculate predictions for each goal
      const goalsWithPredictions = await Promise.all((data || []).map(async (goal) => {
        const progress = (goal.current_amount / goal.target_amount) * 100;
        const remaining = goal.target_amount - goal.current_amount;
        
        // Simple prediction based on average monthly savings
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, date')
          .eq('user_id', user.id)
          .eq('type', 'income')
          .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
        
        const avgMonthlySavings = transactions?.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;
        const monthsToGoal = avgMonthlySavings > 0 ? Math.ceil(remaining / avgMonthlySavings) : 0;
        
        return {
          ...goal,
          prediction: monthsToGoal > 0 ? `${monthsToGoal} month${monthsToGoal > 1 ? 's' : ''} at current rate` : 'Keep adding to reach your goal!'
        };
      }));
      
      setGoals(goalsWithPredictions);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddGoal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        title: formData.title,
        target_amount: parseFloat(formData.target_amount),
        deadline: formData.deadline,
        category: formData.category,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Goal created successfully!",
      });

      setShowAddDialog(false);
      setFormData({ title: "", target_amount: "", deadline: "", category: "Savings" });
      fetchGoals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from("goals")
        .update({ status: "cancelled" })
        .eq("id", goalId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Goal deleted",
      });

      fetchGoals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Goals</h1>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-none">
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Goal Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Save for vacation"
                  />
                </div>
                <div>
                  <Label>Target Amount (₹)</Label>
                  <Input
                    type="number"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <Label>Deadline</Label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddGoal} className="w-full gradient-primary">
                  Create Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {goals.length === 0 ? (
          <Card className="glass border-none">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No goals yet. Create your first goal!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              return (
                <Card key={goal.id} className="glass border-none">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Target: ₹{goal.target_amount.toLocaleString()}
                        </p>
                        {goal.deadline && (
                          <p className="text-xs text-muted-foreground">
                            Deadline: {new Date(goal.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                   <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-primary" />
                          <span className="font-semibold">₹{goal.current_amount.toLocaleString()}</span>
                          <span className="text-muted-foreground">/ ₹{goal.target_amount.toLocaleString()}</span>
                        </div>
                        <span className="text-primary font-semibold">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      
                      {progress < 100 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          <span>₹{(goal.target_amount - goal.current_amount).toLocaleString()} remaining</span>
                        </div>
                      )}

                      {goal.prediction && progress < 100 && (
                        <div className="mt-3 p-3 bg-primary/10 rounded-lg">
                          <p className="text-xs font-medium text-primary flex items-center gap-2">
                            <Sparkles className="h-3 w-3" />
                            AI Prediction: {goal.prediction}
                          </p>
                        </div>
                      )}
                      
                      {progress >= 100 && (
                        <div className="text-xs text-success font-semibold flex items-center gap-1">
                          🎉 Goal achieved!
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Goals;