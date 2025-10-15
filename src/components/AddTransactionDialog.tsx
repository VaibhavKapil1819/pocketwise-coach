import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
}

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
}

const AddTransactionDialog = ({ open, onOpenChange, userId, onSuccess }: AddTransactionDialogProps) => {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [categories, setCategories] = useState<any[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result?.toString().split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('analyze-receipt', {
          body: { imageBase64: base64 }
        });

        if (error) throw error;

        if (data.success) {
          const extracted = data.data;
          setAmount(extracted.amount?.toString() || "");
          const desc = extracted.description || extracted.merchant || "";
          setDescription(desc);
          setDate(extracted.date || date);
          
          // Smart category suggestion
          if (desc) {
            suggestCategory(desc);
          }
          
          toast({
            title: "Receipt Analyzed!",
            description: "Details extracted successfully. Category auto-suggested.",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to analyze receipt",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    if (type === "income") {
      fetchGoals();
    }
  }, [type]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("type", type);

    if (!error && data) {
      setCategories(data);
      if (data.length > 0) {
        setCategoryId(data[0].id);
      }
    }
  };

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from("goals")
      .select("id, title, target_amount, current_amount")
      .eq("user_id", userId)
      .eq("status", "active");

    if (!error && data) {
      setGoals(data);
    }
  };

  const suggestCategory = (desc: string) => {
    const lowerDesc = desc.toLowerCase();
    const categoryKeywords: { [key: string]: string[] } = {
      'Food & Dining': ['restaurant', 'cafe', 'food', 'zomato', 'swiggy', 'dinner', 'lunch'],
      'Shopping': ['amazon', 'flipkart', 'store', 'mall', 'shop'],
      'Transportation': ['uber', 'ola', 'petrol', 'fuel', 'metro', 'bus'],
      'Entertainment': ['movie', 'cinema', 'netflix', 'spotify', 'game'],
      'Healthcare': ['hospital', 'pharmacy', 'doctor', 'medical', 'clinic'],
      'Utilities': ['electricity', 'water', 'gas', 'internet', 'phone'],
    };

    for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => lowerDesc.includes(kw))) {
        const matchingCategory = categories.find(c => c.name === categoryName);
        if (matchingCategory) {
          setCategoryId(matchingCategory.id);
          return;
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        type,
        category_id: categoryId,
        amount: parseFloat(amount),
        description,
        date,
      });

      if (error) throw error;

      // Update goal if income is linked to a goal
      if (type === "income" && selectedGoalId) {
        const selectedGoal = goals.find(g => g.id === selectedGoalId);
        if (selectedGoal) {
          const newAmount = selectedGoal.current_amount + parseFloat(amount);
          await supabase
            .from("goals")
            .update({ current_amount: newAmount })
            .eq("id", selectedGoalId);
        }
      }

      toast({
        title: "Success!",
        description: `${type === "income" ? "Income" : "Expense"} added successfully.${selectedGoalId ? " Goal updated!" : ""}`,
      });

      // Reset form
      setAmount("");
      setDescription("");
      setSelectedGoalId("");
      setDate(new Date().toISOString().split("T")[0]);
      onSuccess();
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="income" className="rounded-xl">
                Income
              </TabsTrigger>
              <TabsTrigger value="expense" className="rounded-xl">
                Expense
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label>Upload Receipt (Optional)</Label>
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                disabled={analyzing}
                className="rounded-xl"
              />
              {analyzing && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a note..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                // Auto-suggest category when typing
                if (e.target.value.length > 3 && type === "expense") {
                  suggestCategory(e.target.value);
                }
              }}
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>

          {type === "income" && goals.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="goal">Link to Goal (Optional)</Label>
              <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a goal to contribute to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      🎯 {goal.title} (₹{goal.current_amount.toLocaleString()}/₹{goal.target_amount.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className={`w-full ${
              type === "income" ? "gradient-success" : "gradient-expense"
            } text-white hover:opacity-90 transition-opacity rounded-xl py-6`}
          >
            {loading ? "Adding..." : `Add ${type === "income" ? "Income" : "Expense"}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;
