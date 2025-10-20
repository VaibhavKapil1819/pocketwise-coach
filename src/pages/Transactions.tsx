import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";

const Transactions = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          category:categories(name, icon, color)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
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
      const { error } = await supabase.from("transactions").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Transaction deleted successfully.",
      });

      fetchTransactions();
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
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="text-center py-8">Loading transactions...</div>
        </div>
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
          <h1 className="text-2xl font-bold">All Transactions</h1>
        </div>

        {transactions.length === 0 ? (
          <Card className="glass border-none">
            <CardContent className="py-8 text-center text-muted-foreground">
              No transactions yet. Add your first transaction to get started!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="glass border-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-xl">
                        {transaction.category?.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{transaction.category?.name}</p>
                        {transaction.description && (
                          <p className="text-sm text-muted-foreground">
                            {transaction.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transaction.date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-xl font-bold ${
                          transaction.type === "income" ? "text-success" : "text-expense"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}₹
                        {parseFloat(transaction.amount).toLocaleString()}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/transaction/${transaction.id}`)}
                        className="rounded-full h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(transaction.id)}
                        className="rounded-full h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
