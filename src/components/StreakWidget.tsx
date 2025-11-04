import { Card, CardContent } from "./ui/card";
import { Flame } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";

interface StreakWidgetProps {
  streak: number;
  onLogNow: () => void;
}

const StreakWidget = ({ streak, onLogNow }: StreakWidgetProps) => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass border-none gradient-primary">
        <CardContent className="p-6">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Flame className="h-12 w-12" />
              </motion.div>
              <div>
                <div className="text-3xl font-bold">{streak} Day Streak</div>
                <p className="text-sm opacity-90">Log today → keep momentum!</p>
              </div>
            </div>
            <Button
              onClick={onLogNow}
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              Log Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StreakWidget;
