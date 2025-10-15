import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, GraduationCap, Star, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const TOPICS = [
  "Budgeting Basics",
  "Saving Strategies",
  "Investment Fundamentals",
  "Emergency Fund",
  "Debt Management",
  "Compound Interest",
  "Credit Score",
  "Tax Planning",
];

const Coach = () => {
  const [profile, setProfile] = useState<any>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
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

  const handleLearn = async (topic?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('financial-coach', {
        body: { topic: topic || selectedTopic, question: topic ? null : question }
      });

      if (error) throw error;

      setExplanation(data.explanation);
      
      toast({
        title: "🎉 XP Earned!",
        description: `You gained ${data.xpGained} XP!`,
      });

      fetchProfile();
      setQuestion("");
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
          <h1 className="text-2xl font-bold">Financial Literacy Coach</h1>
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
                Learner
              </Badge>
            </div>
            <Progress value={levelProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {100 - (profile?.xp % 100)} XP to next level
            </p>
          </CardContent>
        </Card>

        {/* Topics */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Learn About
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {TOPICS.map((topic) => (
              <Card
                key={topic}
                className="glass border-none cursor-pointer hover:scale-105 transition-transform"
                onClick={() => {
                  setSelectedTopic(topic);
                  handleLearn(topic);
                }}
              >
                <CardContent className="pt-4 text-center">
                  <p className="font-medium text-sm">{topic}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Ask Question */}
        <Card className="glass border-none mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Ask a Question</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="How can I save more money?"
                onKeyPress={(e) => e.key === 'Enter' && handleLearn()}
              />
              <Button
                onClick={() => handleLearn()}
                disabled={!question || loading}
                className="gradient-primary"
              >
                Ask
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Explanation */}
        {explanation && (
          <Card className="glass border-none">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedTopic || "Answer"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{explanation}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Coach;