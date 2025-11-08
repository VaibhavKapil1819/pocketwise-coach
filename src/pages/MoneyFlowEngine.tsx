import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  amount: number;
  date: string;
  type: string;
  description: string | null;
  categories: {
    name: string;
    icon: string;
  } | null;
}

const MoneyFlowEngine = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });
  const { toast } = useToast();
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

      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select(`
          *,
          categories (
            name,
            icon
          )
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (txError) throw txError;
      setTransactions(txData || []);

      // Calculate stats
      const income = txData?.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;
      const expense = txData?.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;
      setStats({ income, expense, balance: income - expense });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Money Flow Engine</h1>
            <p className="text-sm text-muted-foreground">Complete transaction history</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="glass border-none p-4">
            <div className="text-xs text-muted-foreground mb-1">Total In</div>
            <div className="text-xl font-bold text-green-500">₹{stats.income.toLocaleString()}</div>
          </Card>
          <Card className="glass border-none p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Out</div>
            <div className="text-xl font-bold text-red-500">₹{stats.expense.toLocaleString()}</div>
          </Card>
          <Card className="glass border-none p-4">
            <div className="text-xs text-muted-foreground mb-1">Net Flow</div>
            <div className={`text-xl font-bold ${stats.balance >= 0 ? "text-green-500" : "text-red-500"}`}>
              ₹{stats.balance.toLocaleString()}
            </div>
          </Card>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <Card className="glass border-none p-6 text-center text-muted-foreground">
              No transactions yet
            </Card>
          ) : (
            transactions.map((tx) => (
              <Card key={tx.id} className="glass border-none p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{tx.categories?.icon || "💰"}</div>
                    <div className="flex-1">
                      <div className="font-semibold">{tx.categories?.name || "Uncategorized"}</div>
                      {tx.description && (
                        <div className="text-sm text-muted-foreground">{tx.description}</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(tx.date), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-lg font-bold ${tx.type === "income" ? "text-green-500" : "text-red-500"}`}>
                      {tx.type === "income" ? "+" : "-"}₹{parseFloat(tx.amount.toString()).toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/transaction/${tx.id}`)}
                        className="rounded-full"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tx.id)}
                        className="rounded-full hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MoneyFlowEngine;
