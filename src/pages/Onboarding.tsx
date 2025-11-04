import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowRight } from "lucide-react";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({
    income_range: "",
    savings_goal: "",
    spending_habits: "",
    risk_comfort: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const questions = [
    {
      id: "savings_goal",
      question: "What's your #1 money goal right now?",
      options: [
        "Emergency Fund",
        "Buying Assets (Vehicle, Property)",
        "Vacation/Travel",
        "Starting Investments",
      ],
    },
    {
      id: "income_range",
      question: "What's your monthly income range?",
      options: [
        "Under ₹25,000",
        "₹25,000 - ₹50,000",
        "₹50,000 - ₹1,00,000",
        "Above ₹1,00,000",
      ],
    },
    {
      id: "spending_habits",
      question: "How confident are you with managing money?",
      options: [
        "I'm great at it",
        "Pretty good",
        "Could be better",
        "Need serious help",
      ],
    },
    {
      id: "risk_comfort",
      question: "Your comfort level with financial risks?",
      options: [
        "Play it safe",
        "Somewhat cautious",
        "Balanced approach",
        "Go for it",
      ],
    },
  ];

  const currentQuestion = questions[step - 1];

  const handleNext = () => {
    if (answers[currentQuestion.id as keyof typeof answers]) {
      if (step < questions.length) {
        setStep(step + 1);
      } else {
        handleComplete();
      }
    } else {
      toast({
        title: "Please select an option",
        description: "Choose one option to continue",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update(answers)
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile Complete!",
        description: "Let's start tracking your finances.",
      });
      navigate("/dashboard");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="glass rounded-3xl p-8 space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {step} of {questions.length}</span>
              <span>{Math.round((step / questions.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full gradient-primary transition-all duration-300"
                style={{ width: `${(step / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center">
              {currentQuestion.question}
            </h2>

            <RadioGroup
              value={answers[currentQuestion.id as keyof typeof answers]}
              onValueChange={(value) =>
                setAnswers({ ...answers, [currentQuestion.id]: value })
              }
              className="space-y-3"
            >
              {currentQuestion.options.map((option) => (
                <div
                  key={option}
                  className="flex items-center space-x-3 glass p-4 rounded-2xl hover:border-primary transition-colors cursor-pointer"
                >
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1 rounded-xl py-6"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 gradient-primary text-white hover:opacity-90 transition-opacity rounded-xl py-6"
            >
              {loading ? "Saving..." : step === questions.length ? "Complete" : "Next"}
              {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
