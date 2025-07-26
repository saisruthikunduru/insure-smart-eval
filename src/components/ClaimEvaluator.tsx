import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
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
  const [files, setFiles] = useState<File[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    const validFiles = uploadedFiles.filter(file => {
      const validTypes = ['.pdf', '.doc', '.docx', '.txt', '.eml'];
      const hasValidExtension = validTypes.some(type => 
        file.name.toLowerCase().endsWith(type) || file.type.includes(type.replace('.', ''))
      );
      return hasValidExtension && file.size <= 10 * 1024 * 1024; // 10MB limit
    });

    if (validFiles.length !== uploadedFiles.length) {
      toast({
        title: "Some files were rejected",
        description: "Please upload PDF, Word, or email files under 10MB",
        variant: "destructive",
      });
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleEvaluate = async () => {
    if (!query.trim()) {
      toast({
        title: "Query required",
        description: "Please describe your medical case",
        variant: "destructive",
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: "Policy documents required",
        description: "Please upload at least one policy document",
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
      const evaluation = await LLMService.evaluateClaim(query, files, apiKey);
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
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent/30 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Insurance Claim Evaluator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered analysis to determine if your medical procedure is covered under your insurance policy
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* Query Input */}
            <Card className="shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Describe Your Case
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Example: 46-year-old male, knee surgery in Pune, 3-month-old insurance policy"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-[120px] rounded-lg border-border focus:ring-2 focus:ring-primary/20"
                />
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card className="shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Upload Policy Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.eml"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload PDF, Word, or email files (max 10MB each)
                    </p>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium truncate">{file.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* API Key Input */}
            {showApiKeyInput && (
              <Card className="shadow-[var(--card-shadow)] border-warning/20">
                <CardHeader>
                  <CardTitle className="text-warning">OpenAI API Key Required</CardTitle>
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
                    className="rounded-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Evaluate Button */}
            <Button
              onClick={handleEvaluate}
              disabled={isEvaluating}
              className="w-full h-12 text-base font-semibold rounded-lg bg-[var(--healthcare-gradient)] hover:opacity-90 transition-opacity"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Evaluating Claim...
                </>
              ) : (
                'Evaluate Claim'
              )}
            </Button>
          </div>

          {/* Right Column - Results */}
          <div>
            <Card className="shadow-[var(--card-shadow)] h-fit">
              <CardHeader>
                <CardTitle>Evaluation Results</CardTitle>
              </CardHeader>
              <CardContent>
                {!result ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Results will appear here after evaluation</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Decision Badge */}
                    <div className="flex items-center gap-3">
                      {getDecisionIcon(result.decision)}
                      <Badge className={`${getDecisionColor(result.decision)} text-sm px-3 py-1`}>
                        {result.decision}
                      </Badge>
                      {result.amount && (
                        <span className="text-lg font-semibold">₹{result.amount.toLocaleString()}</span>
                      )}
                    </div>

                    {/* Parsed Query */}
                    <div>
                      <h4 className="font-semibold mb-2">Parsed Information</h4>
                      <div className="bg-secondary p-3 rounded-lg space-y-1 text-sm">
                        {result.parsedQuery.age && <p><strong>Age:</strong> {result.parsedQuery.age}</p>}
                        {result.parsedQuery.gender && <p><strong>Gender:</strong> {result.parsedQuery.gender}</p>}
                        {result.parsedQuery.procedure && <p><strong>Procedure:</strong> {result.parsedQuery.procedure}</p>}
                        {result.parsedQuery.location && <p><strong>Location:</strong> {result.parsedQuery.location}</p>}
                        {result.parsedQuery.policyDuration && <p><strong>Policy Duration:</strong> {result.parsedQuery.policyDuration}</p>}
                      </div>
                    </div>

                    {/* Justification */}
                    <div>
                      <h4 className="font-semibold mb-3">Policy Analysis</h4>
                      <div className="space-y-3">
                        {result.justification.map((clause, index) => (
                          <div key={index} className="border border-border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-sm">{clause.title}</h5>
                              {clause.pageNumber && (
                                <Badge variant="outline" className="text-xs">
                                  Page {clause.pageNumber}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground italic mb-2">
                              "{clause.snippet}"
                            </p>
                            <p className="text-sm">{clause.reasoning}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Raw JSON */}
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium mb-2">View Raw JSON</summary>
                      <pre className="bg-muted p-3 rounded-lg overflow-auto text-xs">
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
  );
};