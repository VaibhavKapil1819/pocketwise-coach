import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, GraduationCap, Star, Sparkles, TrendingUp, BookOpen, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const CONCEPTS = [
  "Emergency Fund", "Compound Interest", "Inflation", "Credit Score",
  "Asset Allocation", "Diversification", "Liquid Assets", "Net Worth"
];

const NEWS_TOPICS = [
  "Stock Market Trends", "Cryptocurrency", "Real Estate", "Gold Investment",
  "Mutual Funds", "Tax Saving", "Retirement Planning", "Budget 2025"
];

const QUIZ_TOPICS = [
  "Budgeting Basics", "Debt Management", "Investment Risk", "Savings Goals"
];

const CoachNew = () => {
  const [profile, setProfile] = useState<any>(null);
  const [content, setContent] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [learnedTopics, setLearnedTopics] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    loadLearnedTopics();
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
    }
  };

  const loadLearnedTopics = () => {
    const stored = localStorage.getItem('learned_topics');
    if (stored) setLearnedTopics(JSON.parse(stored));
  };

  const saveLearnedTopic = (topic: string) => {
    const updated = [...new Set([...learnedTopics, topic])];
    setLearnedTopics(updated);
    localStorage.setItem('learned_topics', JSON.stringify(updated));
  };

  const handleLearn = async (type: string, topic: string) => {
    setLoading(true);
    setSelectedType(type);
    
    try {
      const isNew = !learnedTopics.includes(`${type}:${topic}`);
      
      const { data, error } = await supabase.functions.invoke('dynamic-coach', {
        body: { type, topic }
      });

      if (error) throw error;

      setContent(data.content);
      
      if (isNew) {
        saveLearnedTopic(`${type}:${topic}`);
        toast({
          title: `🎉 +${data.xpGained} XP!`,
          description: "You learned something new!",
        });
      } else {
        toast({
          title: "📚 Reviewed",
          description: "Keep reinforcing your knowledge!",
        });
      }

      fetchProfile();
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const levelProgress = profile ? ((profile.xp % 100) / 100) * 100 : 0;

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
          <h1 className="text-2xl font-bold">AI Financial Coach</h1>
        </div>

        {/* User Progress */}
        <Card className="glass border-none mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Level {profile?.level || 1}</h3>
                  <p className="text-sm text-muted-foreground">{profile?.xp || 0} XP</p>
                </div>
              </div>
              <Badge className="gradient-primary text-white">
                <Star className="h-3 w-3 mr-1" />
                {learnedTopics.length} Topics Learned
              </Badge>
            </div>
            <Progress value={levelProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {100 - (profile?.xp % 100)} XP to next level
            </p>
          </CardContent>
        </Card>

        {/* Financial Concepts */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Learn Concepts (+15 XP each)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {CONCEPTS.map((concept) => {
              const isLearned = learnedTopics.includes(`concept:${concept}`);
              return (
                <Card
                  key={concept}
                  className={`glass border-none cursor-pointer hover:scale-105 transition-transform ${
                    isLearned ? 'opacity-60' : ''
                  }`}
                  onClick={() => handleLearn('concept', concept)}
                >
                  <CardContent className="pt-4 text-center">
                    <p className="font-medium text-sm">{concept}</p>
                    {isLearned && <span className="text-xs text-success">✓ Learned</span>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Trending Finance News */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trending Finance (+10 XP)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {NEWS_TOPICS.map((topic) => (
              <Card
                key={topic}
                className="glass border-none cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleLearn('news', topic)}
              >
                <CardContent className="pt-4 text-center">
                  <p className="font-medium text-sm">{topic}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Interactive Quizzes */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Test Your Knowledge (+20 XP)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {QUIZ_TOPICS.map((topic) => (
              <Card
                key={topic}
                className="glass border-none cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleLearn('quiz', topic)}
              >
                <CardContent className="pt-4 text-center">
                  <p className="font-medium text-sm">{topic}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Personalized Advice */}
        <Card className="glass border-none mb-6 cursor-pointer hover:scale-105 transition-transform"
          onClick={() => handleLearn('personalized', 'spending habits')}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Get Personalized Advice (+25 XP)
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Content Display */}
        {content && (
          <Card className="glass border-none">
            <CardHeader>
              <CardTitle className="text-lg capitalize">{selectedType}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{content}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CoachNew;
