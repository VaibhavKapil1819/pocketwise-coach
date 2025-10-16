import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, LogOut, Wallet, BarChart3, Target, GraduationCap, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddTransactionDialog from "@/components/AddTransactionDialog";
import TransactionsList from "@/components/TransactionsList";
import Chatbot from "@/components/Chatbot";
import NotificationCenter from "@/components/NotificationCenter";
import { Session } from "@supabase/supabase-js";

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session?.user) {
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("type, amount")
        .eq("user_id", session?.user?.id);

      if (error) throw error;

      const income = transactions
        ?.filter((t) => t.type === "income")
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;

      const expense = transactions
        ?.filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;

      setStats({
        totalIncome: income,
        totalExpense: expense,
        balance: income - expense,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <NotificationCenter />
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">₹{stats.balance.toLocaleString()}</p>
                </div>
                <Wallet className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-success">
                    ₹{stats.totalIncome.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-expense">
                    ₹{stats.totalExpense.toLocaleString()}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-expense" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card
            className="glass border-none cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate("/smart-entry")}
          >
            <CardContent className="pt-6 text-center">
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold">Smart Entry</p>
              <p className="text-xs text-muted-foreground mt-1">Upload Bills</p>
            </CardContent>
          </Card>

          <Card
            className="glass border-none cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate("/analytics")}
          >
            <CardContent className="pt-6 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold">Analytics</p>
              <p className="text-xs text-muted-foreground mt-1">AI Insights</p>
            </CardContent>
          </Card>

          <Card
            className="glass border-none cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate("/goals")}
          >
            <CardContent className="pt-6 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold">Goals</p>
              <p className="text-xs text-muted-foreground mt-1">Track Progress</p>
            </CardContent>
          </Card>

          <Card
            className="glass border-none cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate("/coach")}
          >
            <CardContent className="pt-6 text-center">
              <GraduationCap className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold">Learn</p>
              <p className="text-xs text-muted-foreground mt-1">Earn XP</p>
            </CardContent>
          </Card>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          className="w-full gradient-primary text-white hover:opacity-90 transition-opacity rounded-xl py-6 mb-6"
        >
          <Plus className="h-5 w-5 mr-2" />
          Quick Add Transaction
        </Button>

        {/* Transactions List */}
        <TransactionsList userId={session?.user?.id || ""} onUpdate={fetchStats} />

        {/* Add Transaction Dialog */}
        <AddTransactionDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          userId={session?.user?.id || ""}
          onSuccess={fetchStats}
        />

        {/* Chatbot */}
        <Chatbot />
      </div>
    </div>
  );
};

export default Dashboard;
