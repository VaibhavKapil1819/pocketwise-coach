import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Sparkles, Calendar, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface Action {
  period: string;
  action: string;
  impact: string;
  icon: React.ReactNode;
}

const AIActionPlan = () => {
  const actions: Action[] = [
    {
      period: "Today",
      action: "Skip 1 coffee",
      impact: "+₹180 → +2 days faster to goal",
      icon: <Calendar className="h-5 w-5 text-blue-500" />
    },
    {
      period: "This Week",
      action: "Cut dining to ₹1,500",
      impact: "Hit goal 3 weeks early",
      icon: <TrendingUp className="h-5 w-5 text-green-500" />
    },
    {
      period: "Auto-Save",
      action: "₹5,000 auto to goal every payday",
      impact: "Consistent progress guaranteed",
      icon: <Sparkles className="h-5 w-5 text-purple-500" />
    }
  ];

  return (
    <Card className="glass border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Action Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-start gap-3 p-4 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
          >
            <div className="mt-1">{action.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-primary uppercase">
                  {action.period}
                </span>
              </div>
              <p className="font-semibold mb-1">{action.action}</p>
              <p className="text-sm text-muted-foreground">{action.impact}</p>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AIActionPlan;
