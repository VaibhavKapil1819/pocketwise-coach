import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Upload, Loader2, CheckCircle, XCircle, Edit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExtractedData {
  amount: number;
  merchant: string;
  date: string;
  category: string;
  description: string;
}

const SmartEntry = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    try {
      // Fetch categories for dropdown
      const { data: cats } = await supabase
        .from("categories")
        .select("*")
        .eq("type", "expense");
      
      if (cats) setCategories(cats);

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result?.toString().split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('analyze-receipt', {
          body: { imageBase64: base64 }
        });

        if (error) throw error;

        if (data.success) {
          setExtractedData(data.data);
          setShowConfirmation(true);
          toast({
            title: "Analysis Complete!",
            description: "Review and confirm the extracted details.",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to analyze document",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApprove = async () => {
    if (!extractedData) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find category by name
      const category = categories.find(c => 
        c.name.toLowerCase().includes(extractedData.category?.toLowerCase() || '')
      );

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "expense",
        category_id: category?.id || categories[0]?.id,
        amount: extractedData.amount,
        description: extractedData.description || extractedData.merchant,
        date: extractedData.date || new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Transaction added successfully.",
      });

      setShowConfirmation(false);
      setExtractedData(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = () => {
    setShowConfirmation(false);
    setExtractedData(null);
    setEditMode(false);
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
            <p className="text-sm text-muted-foreground">Upload income proof or receipts to grow your goals</p>
          </div>
        </div>

        <Card className="glass border-none">
          <CardHeader>
            <CardTitle>Upload Payslip, Invoice, or Receipt</CardTitle>
            <p className="text-sm text-muted-foreground">AI auto-detects income vs expenses and silently logs them</p>
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
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent className="glass sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle>Confirm Transaction Details</DialogTitle>
            </DialogHeader>

            {extractedData && (
              <div className="space-y-4">
                {!editMode ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Amount</Label>
                      <p className="text-2xl font-bold">₹{extractedData.amount?.toLocaleString() || 0}</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Merchant</Label>
                      <p className="font-medium">{extractedData.merchant || "N/A"}</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Date</Label>
                      <p className="font-medium">{extractedData.date || new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Category</Label>
                      <p className="font-medium">{extractedData.category || "General"}</p>
                    </div>

                    {extractedData.description && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Description</Label>
                        <p className="text-sm">{extractedData.description}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => setEditMode(true)}
                        variant="outline"
                        className="flex-1 rounded-xl"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={handleApprove}
                        className="flex-1 gradient-success text-white rounded-xl"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={handleReject}
                        variant="outline"
                        className="flex-1 rounded-xl border-destructive text-destructive hover:bg-destructive hover:text-white"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Amount (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={extractedData.amount}
                        onChange={(e) => setExtractedData({...extractedData, amount: parseFloat(e.target.value)})}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Merchant</Label>
                      <Input
                        value={extractedData.merchant}
                        onChange={(e) => setExtractedData({...extractedData, merchant: e.target.value})}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={extractedData.date}
                        onChange={(e) => setExtractedData({...extractedData, date: e.target.value})}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={extractedData.category}
                        onValueChange={(value) => setExtractedData({...extractedData, category: value})}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.icon} {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={extractedData.description}
                        onChange={(e) => setExtractedData({...extractedData, description: e.target.value})}
                        className="rounded-xl resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => setEditMode(false)}
                        variant="outline"
                        className="flex-1 rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          setEditMode(false);
                          handleApprove();
                        }}
                        className="flex-1 gradient-success text-white rounded-xl"
                      >
                        Save & Approve
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SmartEntry;
