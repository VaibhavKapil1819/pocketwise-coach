import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Progress } from "./ui/progress";

interface CategoryImpact {
  category: string;
  impact: number;
  type: "positive" | "negative";
}

const ImpactChart = () => {
  const impacts: CategoryImpact[] = [
    { category: "Dining", impact: -11, type: "negative" },
    { category: "Freelance", impact: 12000, type: "positive" },
    { category: "Auto-Save", impact: 18, type: "positive" },
    { category: "Shopping", impact: -6, type: "negative" },
  ];

  return (
    <Card className="glass border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Goal Impact Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          How your habits affect your goals
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {impacts.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.type === "positive" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className="font-medium">{item.category}</span>
              </div>
              <span className={`font-bold ${
                item.type === "positive" ? "text-green-500" : "text-red-500"
              }`}>
                {item.type === "positive" ? "+" : ""}
                {typeof item.impact === "number" && item.impact > 100 
                  ? `₹${item.impact.toLocaleString()}`
                  : `${item.impact} days`
                }
              </span>
            </div>
            <Progress 
              value={Math.abs(item.impact) > 100 ? 80 : Math.abs(item.impact) * 5} 
              className={`h-2 ${
                item.type === "positive" ? "[&>*]:bg-green-500" : "[&>*]:bg-red-500"
              }`}
            />
          </div>
        ))}
        
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Forecast:</span>
            <span className="font-bold text-primary">Debt-Free in 9.2 months</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImpactChart;
