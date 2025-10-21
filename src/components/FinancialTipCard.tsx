import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FinancialTipCardProps {
  title: string;
  preview: string;
  content: string;
  level: number;
  xpReward: number;
  icon: React.ReactNode;
  onComplete: () => void;
  isLocked?: boolean;
}

const FinancialTipCard = ({ 
  title, 
  preview, 
  content, 
  level, 
  xpReward, 
  icon, 
  onComplete,
  isLocked = false 
}: FinancialTipCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showXpGain, setShowXpGain] = useState(false);

  const handleClose = () => {
    setIsExpanded(false);
    setShowXpGain(true);
    setTimeout(() => {
      onComplete();
      setShowXpGain(false);
    }, 1500);
  };

  return (
    <>
      <motion.div
        whileHover={!isLocked ? { scale: 1.05, y: -5 } : {}}
        whileTap={!isLocked ? { scale: 0.98 } : {}}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Card 
          className={`glass border-none cursor-pointer h-full relative overflow-hidden ${
            isLocked ? 'opacity-50' : ''
          }`}
          onClick={() => !isLocked && setIsExpanded(true)}
        >
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-background/50 z-10">
              <Badge variant="secondary" className="text-sm">
                Unlock at Level {level}
              </Badge>
            </div>
          )}
          
          <CardContent className="pt-6 pb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                {icon}
              </div>
              <Badge variant="secondary" className="text-xs">
                +{xpReward} XP
              </Badge>
            </div>
            
            <h3 className="font-semibold text-base mb-2 line-clamp-2">{title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{preview}</p>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, rotateY: -90 }}
              animate={{ scale: 1, rotateY: 0 }}
              exit={{ scale: 0.9, rotateY: 90 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full"
            >
              <Card className="glass border-none">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary">
                        {icon}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{title}</h2>
                        <Badge variant="secondary" className="mt-1">
                          +{xpReward} XP
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClose}
                      className="rounded-full"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground leading-relaxed">{content}</p>
                  </div>

                  <Button
                    onClick={handleClose}
                    className="w-full gradient-primary text-white rounded-xl"
                  >
                    Got It! <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showXpGain && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.5 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <div className="bg-primary text-primary-foreground px-8 py-4 rounded-full shadow-lg flex items-center gap-3">
              <Sparkles className="h-6 w-6 animate-spin" />
              <span className="text-2xl font-bold">+{xpReward} XP</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FinancialTipCard;
