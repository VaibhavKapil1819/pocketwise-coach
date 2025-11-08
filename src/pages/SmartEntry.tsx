import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Loader2, Trash2 } from "lucide-react";

interface ExtractedTransaction {
  amount: number;
  merchant: string;
  date: string;
  category: string;
  description: string;
  type: 'income' | 'expense';
}

interface ExtractedData {
  transactions: ExtractedTransaction[];
}

const SmartEntry = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingTransactions, setEditingTransactions] = useState<ExtractedTransaction[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result?.toString().split(',')[1];
        
        const result = await supabase.functions.invoke('analyze-receipt', {
          body: { imageBase64: base64 }
        });

        if (result.error) throw result.error;

        if (result.data && result.data.data) {
          const data = result.data.data;
          setExtractedData(data);
          setEditingTransactions(data.transactions);
          
          // Fetch categories
          const { data: categoriesData } = await supabase
            .from('categories')
            .select('*');
          
          if (categoriesData) {
            setCategories(categoriesData);
          }
          
          setShowConfirmDialog(true);
          toast({
            title: "Success!",
            description: `Found ${data.transactions.length} transaction${data.transactions.length > 1 ? 's' : ''}!`,
          });
        } else {
          throw new Error('No data returned from analysis');
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error analyzing receipt:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to analyze document',
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApprove = async () => {
    if (!editingTransactions.length) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Prepare all transactions for insert
      const transactionsToInsert = editingTransactions.map(transaction => {
        const matchingCategory = categories.find(
          cat => cat.name.toLowerCase() === transaction.category.toLowerCase()
        );

        return {
          user_id: user.id,
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date,
          category_id: matchingCategory?.id,
          type: transaction.type
        };
      });

      const { error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `${editingTransactions.length} transaction${editingTransactions.length > 1 ? 's' : ''} added successfully!`,
      });
      
      setShowConfirmDialog(false);
      setExtractedData(null);
      setEditingTransactions([]);
      navigate('/');
    } catch (error: any) {
      console.error('Error saving transactions:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to save transactions',
        variant: "destructive",
      });
    }
  };

  const handleReject = () => {
    setShowConfirmDialog(false);
    setExtractedData(null);
    setEditingTransactions([]);
  };

  const updateTransaction = (index: number, field: keyof ExtractedTransaction, value: any) => {
    setEditingTransactions(prev => 
      prev.map((t, i) => i === index ? { ...t, [field]: value } : t)
    );
  };

  const removeTransaction = (index: number) => {
    setEditingTransactions(prev => prev.filter((_, i) => i !== index));
  };

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
            <h1 className="text-2xl font-bold">Add to Goals</h1>
            <p className="text-sm text-muted-foreground">Upload bank statement, payslip, invoice, or receipt</p>
          </div>
        </div>

        <Card className="glass border-none">
          <CardHeader>
            <CardTitle>Upload Bank Statement or Receipt</CardTitle>
            <p className="text-sm text-muted-foreground">AI extracts all transactions automatically</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border/50 rounded-xl hover:border-primary/50 transition-colors">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary font-semibold">Click to upload</span>
                <span className="text-muted-foreground"> or drag and drop</span>
              </Label>
              <p className="text-sm text-muted-foreground mt-2">
                PNG, JPG, PDF up to 10MB
              </p>
              <Input
                id="file-upload"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                disabled={analyzing}
                className="hidden"
              />
            </div>

            {analyzing && (
              <div className="flex items-center justify-center gap-3 py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Analyzing document with AI...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Review Transactions ({editingTransactions.length})
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {editingTransactions.map((transaction, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                        {transaction.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">#{index + 1}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTransaction(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Merchant</label>
                      <Input 
                        value={transaction.merchant}
                        onChange={(e) => updateTransaction(index, 'merchant', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Amount (₹)</label>
                      <Input 
                        type="number" 
                        value={transaction.amount}
                        onChange={(e) => updateTransaction(index, 'amount', parseFloat(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Date</label>
                      <Input 
                        type="date" 
                        value={transaction.date}
                        onChange={(e) => updateTransaction(index, 'date', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Category</label>
                      <select
                        value={transaction.category}
                        onChange={(e) => updateTransaction(index, 'category', e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">Description</label>
                      <Input 
                        value={transaction.description}
                        onChange={(e) => updateTransaction(index, 'description', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </Card>
              ))}

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleReject}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleApprove}
                  disabled={editingTransactions.length === 0}
                >
                  Add All ({editingTransactions.length})
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SmartEntry;
