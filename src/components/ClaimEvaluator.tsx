import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, AlertCircle, CheckCircle, XCircle, Brain, Sparkles, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LLMService } from '@/services/LLMService';

interface ParsedQuery {
  age?: number;
  gender?: string;
  procedure?: string;
  location?: string;
  policyDuration?: string;
}

interface PolicyClause {
  title: string;
  pageNumber?: number;
  snippet: string;
  reasoning: string;
}

interface EvaluationResult {
  parsedQuery: ParsedQuery;
  decision: 'Approved' | 'Rejected' | 'More Info Needed';
  amount?: number;
  justification: PolicyClause[];
}

export const ClaimEvaluator = () => {
  const [query, setQuery] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const { toast } = useToast();

  const handleEvaluate = async () => {
    if (!query.trim()) {
      toast({
        title: "Query required",
        description: "Please describe your medical case",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey.trim()) {
      setShowApiKeyInput(true);
      toast({
        title: "API Key required",
        description: "Please enter your OpenAI API key to evaluate the claim",
        variant: "destructive",
      });
      return;
    }

    setIsEvaluating(true);
    try {
      const evaluation = await LLMService.evaluateClaim(query, [], apiKey);
      setResult(evaluation);
      toast({
        title: "Evaluation complete",
        description: `Claim ${evaluation.decision.toLowerCase()}`,
      });
    } catch (error) {
      console.error('Evaluation error:', error);
      toast({
        title: "Evaluation failed",
        description: error instanceof Error ? error.message : "An error occurred during evaluation",
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'Approved':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'Rejected':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <AlertCircle className="w-5 h-5 text-warning" />;
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'Approved':
        return 'bg-success text-success-foreground';
      case 'Rejected':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-warning text-warning-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-background)] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10"></div>
      <div className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-2xl backdrop-blur-sm border border-primary/20">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <div className="p-2 bg-primary/5 rounded-xl backdrop-blur-sm">
                <Brain className="w-6 h-6 text-primary animate-pulse" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary-hover to-primary bg-clip-text text-transparent mb-4">
              Insurance Claim Evaluator
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              AI-powered intelligent analysis to determine if your medical procedure is covered under your insurance policy
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm text-primary font-medium">Powered by Advanced AI</span>
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Input */}
            <div className="space-y-6">
              {/* Query Input */}
              <Card className="backdrop-blur-sm bg-[var(--gradient-card)] border-white/20 shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] hover:shadow-[var(--glow-primary)] transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    Describe Your Medical Case
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Example: 46-year-old male, knee surgery in Mumbai, Health policy purchased 6 months ago with Star Health Insurance, looking to claim for ACL reconstruction surgery..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-[150px] rounded-xl border-white/30 focus:ring-2 focus:ring-primary/30 bg-white/50 backdrop-blur-sm resize-none"
                  />
                  <div className="mt-3 text-xs text-muted-foreground">
                    💡 Include details like age, gender, procedure type, location, policy details, and insurance provider
                  </div>
                </CardContent>
              </Card>

              {/* API Key Input */}
              {showApiKeyInput && (
                <Card className="backdrop-blur-sm bg-gradient-to-br from-warning/10 to-warning/5 border-warning/30 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-warning flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      OpenAI API Key Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      For production use, we recommend connecting to Supabase to securely store API keys.
                    </p>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="rounded-xl bg-white/70 border-warning/30"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Evaluate Button */}
              <Button
                onClick={handleEvaluate}
                disabled={isEvaluating}
                className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    <span className="flex items-center gap-2">
                      Analyzing with AI
                      <Brain className="w-4 h-4 animate-pulse" />
                    </span>
                  </>
                ) : (
                  <span className="flex items-center gap-3">
                    <Brain className="w-5 h-5" />
                    Evaluate Claim with AI
                    <Sparkles className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </div>

            {/* Right Column - Results */}
            <div>
              <Card className="backdrop-blur-sm bg-[var(--gradient-card)] border-white/20 shadow-[var(--card-shadow)] h-fit">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    AI Evaluation Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!result ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <div className="relative mb-6">
                        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                          <Brain className="w-8 h-8 text-primary/50" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                        </div>
                      </div>
                      <p className="text-lg mb-2">Ready for AI Analysis</p>
                      <p className="text-sm">Your detailed evaluation results will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Decision Badge */}
                      <div className="flex items-center gap-4 p-4 bg-white/30 rounded-xl backdrop-blur-sm">
                        <div className="p-2 bg-white/50 rounded-lg">
                          {getDecisionIcon(result.decision)}
                        </div>
                        <div className="flex-1">
                          <Badge className={`${getDecisionColor(result.decision)} text-base px-4 py-2 font-semibold`}>
                            {result.decision}
                          </Badge>
                          {result.amount && (
                            <div className="text-2xl font-bold text-primary mt-1">
                              ₹{result.amount.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Parsed Query */}
                      <div className="p-4 bg-white/30 rounded-xl backdrop-blur-sm">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          Parsed Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          {result.parsedQuery.age && <p><strong>Age:</strong> {result.parsedQuery.age}</p>}
                          {result.parsedQuery.gender && <p><strong>Gender:</strong> {result.parsedQuery.gender}</p>}
                          {result.parsedQuery.procedure && <p><strong>Procedure:</strong> {result.parsedQuery.procedure}</p>}
                          {result.parsedQuery.location && <p><strong>Location:</strong> {result.parsedQuery.location}</p>}
                          {result.parsedQuery.policyDuration && <p><strong>Policy Duration:</strong> {result.parsedQuery.policyDuration}</p>}
                        </div>
                      </div>

                      {/* Justification */}
                      <div>
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Brain className="w-4 h-4 text-primary" />
                          AI Policy Analysis
                        </h4>
                        <div className="space-y-3">
                          {result.justification.map((clause, index) => (
                            <div key={index} className="p-4 bg-white/30 rounded-xl backdrop-blur-sm border border-white/20">
                              <div className="flex items-start justify-between mb-3">
                                <h5 className="font-medium text-sm text-primary">{clause.title}</h5>
                                {clause.pageNumber && (
                                  <Badge variant="outline" className="text-xs bg-white/50">
                                    Page {clause.pageNumber}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground italic mb-3 p-2 bg-white/20 rounded-lg">
                                "{clause.snippet}"
                              </p>
                              <p className="text-sm leading-relaxed">{clause.reasoning}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Raw JSON */}
                      <details className="text-xs">
                        <summary className="cursor-pointer font-medium mb-2 p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                          View Technical Details (JSON)
                        </summary>
                        <pre className="bg-muted/50 p-3 rounded-lg overflow-auto text-xs mt-2 backdrop-blur-sm">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};