import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Edit, Trash2, Save, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transaction, setTransaction] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransaction();
    fetchCategories();
  }, [id]);

  const fetchTransaction = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          category:categories(name, icon, color)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setTransaction(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*");
    if (data) setCategories(data);
  };

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date,
          category_id: transaction.category_id,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
      setEditMode(false);
      fetchTransaction();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
      navigate("/dashboard");
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
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!transaction) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Transaction Details</h1>
        </div>

        <Card className="glass border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {transaction.category?.icon} {transaction.category?.name}
              </CardTitle>
              <div className="flex gap-2">
                {!editMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditMode(true)}
                      className="rounded-full"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDelete}
                      className="rounded-full border-destructive text-destructive hover:bg-destructive hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setEditMode(false);
                        fetchTransaction();
                      }}
                      className="rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={handleUpdate}
                      className="rounded-full gradient-primary"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!editMode ? (
              <>
                <div>
                  <Label className="text-sm text-muted-foreground">Amount</Label>
                  <p
                    className={`text-3xl font-bold ${
                      transaction.type === "income" ? "text-success" : "text-expense"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}₹
                    {parseFloat(transaction.amount).toLocaleString()}
                  </p>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Type</Label>
                  <p className="text-lg font-medium capitalize">{transaction.type}</p>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Date</Label>
                  <p className="text-lg">{new Date(transaction.date).toLocaleDateString()}</p>
                </div>

                {transaction.description && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Description</Label>
                    <p className="text-sm">{transaction.description}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={transaction.amount}
                    onChange={(e) =>
                      setTransaction({ ...transaction, amount: parseFloat(e.target.value) })
                    }
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={transaction.category_id}
                    onValueChange={(value) =>
                      setTransaction({ ...transaction, category_id: value })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c) => c.type === transaction.type)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={transaction.date}
                    onChange={(e) => setTransaction({ ...transaction, date: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={transaction.description || ""}
                    onChange={(e) =>
                      setTransaction({ ...transaction, description: e.target.value })
                    }
                    className="rounded-xl resize-none"
                    rows={3}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TransactionDetail;
