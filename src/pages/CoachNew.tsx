import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Lightbulb, Target, Trophy, Crown, Wallet, PiggyBank, LineChart, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import FinancialTipCard from "@/components/FinancialTipCard";
import BottomNav from "@/components/BottomNav";

interface LevelData {
  level: number;
  name: string;
  minXp: number;
  maxXp: number;
  icon: React.ReactNode;
  color: string;
}

const LEVELS: LevelData[] = [
  { level: 1, name: "Money Newbie", minXp: 0, maxXp: 100, icon: <Wallet className="h-5 w-5" />, color: "text-blue-500" },
  { level: 2, name: "Budget Learner", minXp: 100, maxXp: 250, icon: <PiggyBank className="h-5 w-5" />, color: "text-green-500" },
  { level: 3, name: "Smart Spender", minXp: 250, maxXp: 450, icon: <TrendingUp className="h-5 w-5" />, color: "text-purple-500" },
  { level: 4, name: "Savings Pro", minXp: 450, maxXp: 700, icon: <Target className="h-5 w-5" />, color: "text-orange-500" },
  { level: 5, name: "Finance Expert", minXp: 700, maxXp: 1000, icon: <Lightbulb className="h-5 w-5" />, color: "text-yellow-500" },
  { level: 6, name: "Investment Explorer", minXp: 1000, maxXp: 1400, icon: <LineChart className="h-5 w-5" />, color: "text-cyan-500" },
  { level: 7, name: "Portfolio Builder", minXp: 1400, maxXp: 1900, icon: <Briefcase className="h-5 w-5" />, color: "text-pink-500" },
  { level: 8, name: "Wealth Manager", minXp: 1900, maxXp: 2500, icon: <Trophy className="h-5 w-5" />, color: "text-red-500" },
  { level: 9, name: "Finance Master", minXp: 2500, maxXp: 3500, icon: <Crown className="h-5 w-5" />, color: "text-amber-500" },
  { level: 10, name: "Money Guru", minXp: 3500, maxXp: 5000, icon: <Crown className="h-5 w-5" />, color: "text-violet-500" },
];

interface TipData {
  id: string;
  title: string;
  preview: string;
  content: string;
  level: number;
  xpReward: number;
  icon: React.ReactNode;
  category: string;
}

const FINANCIAL_TIPS: TipData[] = [
  // Level 1-2: Basics
  {
    id: "tip1",
    title: "Track Every Rupee",
    preview: "Learn why tracking expenses is the foundation of financial success",
    content: "Tracking your expenses is the first step to financial awareness. When you know where your money goes, you can make better decisions. Start by recording every transaction for 30 days - you'll be surprised at what you discover! Use apps or a simple notebook. The key is consistency.",
    level: 1,
    xpReward: 10,
    icon: <Wallet className="h-5 w-5" />,
    category: "Basics"
  },
  {
    id: "tip2",
    title: "The 50-30-20 Rule",
    preview: "Master the golden rule of budgeting",
    content: "Allocate 50% of your income to needs (rent, food, bills), 30% to wants (entertainment, dining out), and 20% to savings and debt repayment. This simple framework helps balance enjoying life today while securing your future. Start small - even following this roughly is better than no plan at all!",
    level: 1,
    xpReward: 15,
    icon: <PiggyBank className="h-5 w-5" />,
    category: "Basics"
  },
  {
    id: "tip3",
    title: "Emergency Fund Essentials",
    preview: "Why you need 3-6 months of expenses saved",
    content: "An emergency fund is your financial safety net. Aim to save 3-6 months of living expenses in a easily accessible account. This protects you from unexpected job loss, medical emergencies, or urgent home repairs. Start with ₹10,000 and build from there. Keep it separate from your regular savings!",
    level: 2,
    xpReward: 20,
    icon: <Target className="h-5 w-5" />,
    category: "Basics"
  },
  
  // Level 3-5: Smart Spending
  {
    id: "tip4",
    title: "Cut the Hidden Costs",
    preview: "Identify and eliminate subscription waste",
    content: "Review all your subscriptions monthly. That unused gym membership, forgotten streaming service, or auto-renewed app could be costing you ₹2,000-5,000 monthly! Set calendar reminders before renewal dates. Only keep subscriptions you actively use. Cancel rest immediately - you can always resubscribe when needed.",
    level: 3,
    xpReward: 25,
    icon: <TrendingUp className="h-5 w-5" />,
    category: "Smart Spending"
  },
  {
    id: "tip5",
    title: "Smart Credit Card Usage",
    preview: "Use credit cards wisely to build wealth, not debt",
    content: "Credit cards aren't evil - poor usage is. Always pay the full balance before due date to avoid 36-42% interest. Use cards for rewards and cashback, but only spend what you already have. Set up auto-pay for minimum amount as safety net. One missed payment can hurt your credit score for years!",
    level: 4,
    xpReward: 30,
    icon: <Briefcase className="h-5 w-5" />,
    category: "Smart Spending"
  },
  {
    id: "tip6",
    title: "The 24-Hour Rule",
    preview: "Stop impulse buying instantly",
    content: "Before any non-essential purchase over ₹1,000, wait 24 hours. This simple pause helps distinguish wants from needs. Add items to a wishlist and revisit after a day. Often, the urge to buy fades. This habit alone can save thousands monthly and reduce buyer's remorse significantly!",
    level: 5,
    xpReward: 35,
    icon: <Lightbulb className="h-5 w-5" />,
    category: "Smart Spending"
  },

  // Level 6-8: Investing
  {
    id: "tip7",
    title: "Start Investing Early",
    preview: "Why your 20s and 30s are crucial for wealth building",
    content: "Time is your biggest investing advantage. ₹5,000 invested monthly from age 25 becomes ₹2.2 crores by 60 (at 12% returns). Starting at 35? Only ₹96 lakhs! Compound interest works magic over decades. Don't wait for the 'perfect' time or amount. Start with whatever you can, even ₹500 monthly matters!",
    level: 6,
    xpReward: 40,
    icon: <LineChart className="h-5 w-5" />,
    category: "Investing"
  },
  {
    id: "tip8",
    title: "Index Funds for Beginners",
    preview: "The safest way to invest in the stock market",
    content: "Index funds track market indices like Nifty 50 or Sensex, offering instant diversification. They have low fees (0.1-0.5%) vs. actively managed funds (1-2.5%). Historical data shows 80% of fund managers fail to beat the index long-term. Start with a Nifty 50 index fund via SIP for consistent, low-risk investing!",
    level: 7,
    xpReward: 45,
    icon: <TrendingUp className="h-5 w-5" />,
    category: "Investing"
  },
  {
    id: "tip9",
    title: "Asset Allocation Strategy",
    preview: "Balance risk and reward based on your age",
    content: "A common formula: Equity % = 100 - Your Age. At 30, keep 70% in stocks/equity funds, 30% in debt/bonds. At 50, shift to 50-50. Younger investors can afford more risk for higher returns. Review and rebalance yearly. This strategy helps optimize returns while managing risk as you age!",
    level: 8,
    xpReward: 50,
    icon: <Trophy className="h-5 w-5" />,
    category: "Investing"
  },

  // Level 9-10: Wealth Building
  {
    id: "tip10",
    title: "Tax-Saving Investments",
    preview: "Maximize returns while minimizing tax burden",
    content: "Section 80C allows ₹1.5 lakh tax deduction (ELSS, PPF, EPF). Section 80D covers ₹25,000 for health insurance. NPS offers additional ₹50,000 under 80CCD(1B). Proper tax planning can save ₹46,800+ annually (30% bracket). Start investing in January, not March - gives better returns and reduces last-minute stress!",
    level: 9,
    xpReward: 60,
    icon: <Crown className="h-5 w-5" />,
    category: "Wealth Building"
  },
  {
    id: "tip11",
    title: "Multiple Income Streams",
    preview: "Why relying on one income is risky",
    content: "Average millionaires have 7 income streams - salary, investments, rental, side business, royalties, etc. Start with one additional stream: freelancing, online courses, stock dividends, or rental income. Diversifying income protects against job loss and accelerates wealth building. Your skills are valuable - monetize them!",
    level: 10,
    xpReward: 75,
    icon: <Crown className="h-5 w-5" />,
    category: "Wealth Building"
  },
  {
    id: "tip12",
    title: "Estate Planning Basics",
    preview: "Protect your wealth for future generations",
    content: "Create a will (₹500-5000 with lawyer), nominate beneficiaries for all accounts and insurance, consider term insurance (10-15x annual income). Update documents after major life events. 60% Indians die intestate (without will), causing family disputes and tax complications. Protect your loved ones - plan your estate today!",
    level: 10,
    xpReward: 80,
    icon: <Briefcase className="h-5 w-5" />,
    category: "Wealth Building"
  },
];

const CoachNew = () => {
  const [profile, setProfile] = useState<any>(null);
  const [completedTips, setCompletedTips] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    loadCompletedTips();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
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

  const loadCompletedTips = () => {
    const stored = localStorage.getItem("completedFinancialTips");
    if (stored) {
      setCompletedTips(new Set(JSON.parse(stored)));
    }
  };

  const saveCompletedTip = (tipId: string) => {
    const updated = new Set(completedTips);
    updated.add(tipId);
    setCompletedTips(updated);
    localStorage.setItem("completedFinancialTips", JSON.stringify([...updated]));
  };

  const handleTipComplete = async (tip: TipData) => {
    if (completedTips.has(tip.id)) return;

    try {
      const newXp = (profile?.xp || 0) + tip.xpReward;
      const newLevel = LEVELS.find(l => newXp >= l.minXp && newXp < l.maxXp)?.level || 10;

      const { error } = await supabase
        .from("profiles")
        .update({ xp: newXp, level: newLevel })
        .eq("id", profile.id);

      if (error) throw error;

      saveCompletedTip(tip.id);
      setProfile({ ...profile, xp: newXp, level: newLevel });

      toast({
        title: "XP Gained!",
        description: `+${tip.xpReward} XP earned! Keep learning!`,
      });
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const currentLevel = LEVELS.find(l => l.level === (profile?.level || 1)) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.level === (profile?.level || 1) + 1);
  const xpProgress = nextLevel 
    ? ((profile?.xp || 0) - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp) * 100
    : 100;

  const availableTips = FINANCIAL_TIPS.filter(tip => 
    tip.level <= (profile?.level || 1) && !completedTips.has(tip.id)
  );

  const lockedTips = FINANCIAL_TIPS.filter(tip => 
    tip.level === (profile?.level || 1) + 1
  ).slice(0, 2);

  // Group tips by category
  const tipsByCategory = availableTips.reduce((acc, tip) => {
    if (!acc[tip.category]) acc[tip.category] = [];
    acc[tip.category].push(tip);
    return acc;
  }, {} as Record<string, TipData[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 pb-24">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Financial Coach</h1>
        </div>

        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass border-none mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl bg-primary/10 ${currentLevel.color}`}>
                    {currentLevel.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">Level {profile?.level || 1}</CardTitle>
                    <p className="text-sm text-muted-foreground">{currentLevel.name}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {profile?.xp || 0} XP
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress to Level {(profile?.level || 1) + 1}</span>
                <span className="font-semibold">
                  {nextLevel ? `${profile?.xp || 0} / ${nextLevel.minXp}` : "Max Level!"}
                </span>
              </div>
              <Progress value={xpProgress} className="h-3" />
              
              {/* Level Milestones */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                {LEVELS.slice(0, 10).map((level, idx) => (
                  <motion.div
                    key={level.level}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex flex-col items-center gap-1 ${
                      level.level <= (profile?.level || 1) 
                        ? level.color 
                        : 'text-muted-foreground opacity-30'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      level.level <= (profile?.level || 1)
                        ? 'bg-primary/20'
                        : 'bg-muted'
                    }`}>
                      {level.level}
                    </div>
                    <span className="text-[10px] font-medium hidden sm:block">{level.name.split(' ')[0]}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Financial Tips by Category */}
        <div className="space-y-6">
          {Object.entries(tipsByCategory).map(([category, tips], categoryIdx) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIdx * 0.1 }}
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tips.map((tip, idx) => (
                  <motion.div
                    key={tip.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <FinancialTipCard
                      {...tip}
                      onComplete={() => handleTipComplete(tip)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Locked/Upcoming Tips */}
          {lockedTips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                Unlock Next
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lockedTips.map((tip, idx) => (
                  <motion.div
                    key={tip.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <FinancialTipCard
                      {...tip}
                      onComplete={() => {}}
                      isLocked={true}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {availableTips.length === 0 && lockedTips.length === 0 && (
            <Card className="glass border-none">
              <CardContent className="py-12 text-center">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">
                  You've completed all available lessons. Keep practicing what you've learned!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default CoachNew;
