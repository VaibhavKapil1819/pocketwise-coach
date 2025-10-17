import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface TransactionsListProps {
  userId: string;
  onUpdate: () => void;
  limit?: number;
}

const TransactionsList = ({ userId, onUpdate, limit = 5 }: TransactionsListProps) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          category:categories(name, icon, color)
        `)
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(limit);

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
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading transactions...</div>;
  }

  if (transactions.length === 0) {
    return (
      <Card className="glass border-none">
        <CardContent className="py-8 text-center text-muted-foreground">
          No transactions yet. Add your first transaction to get started!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Recent Transactions</h2>
        {limit && transactions.length >= limit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/transactions")}
            className="rounded-xl"
          >
            View All
          </Button>
        )}
      </div>
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
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TransactionsList;
