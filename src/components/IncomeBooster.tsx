import { Card, CardContent } from "./ui/card";
import { TrendingUp, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";

const IncomeBooster = () => {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass border-none border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-2">Income Booster</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Freelance 2 hrs/week → +₹8,000/month
                </p>
                <Button size="sm" className="gradient-primary text-white">
                  Explore Opportunities
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glass border-none border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <Shield className="h-6 w-6 text-orange-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-2">Risk Shield</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Low buffer — pause Vacation Fund 2 months → build safety net
                </p>
                <Button size="sm" variant="outline">
                  Review Plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default IncomeBooster;
