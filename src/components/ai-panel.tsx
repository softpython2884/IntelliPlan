'use client';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2 } from 'lucide-react';
import { suggestLayout, SuggestLayoutOutput } from '@/ai/flows/suggest-layout';
import { evaluateArrangement, EvaluateArrangementOutput } from '@/ai/flows/evaluate-arrangement';
import type { Furniture, Room } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AIPanelProps {
  allFurniture: Furniture[];
  rooms: Room[];
}

export function AIPanel({ allFurniture, rooms }: AIPanelProps) {
  const [suggestionResult, setSuggestionResult] = useState<SuggestLayoutOutput | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<EvaluateArrangementOutput | null>(null);
  const [evaluationText, setEvaluationText] = useState('');
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false);
  const { toast } = useToast();

  const handleSuggestLayout = async () => {
    if (rooms.length === 0 || allFurniture.length === 0) {
      toast({
        title: "Cannot generate layout",
        description: "Please add at least one room and some furniture.",
        variant: "destructive"
      });
      return;
    }
    setIsLoadingSuggestion(true);
    setSuggestionResult(null);
    try {
      const room = rooms[0];
      const result = await suggestLayout({
        roomDimensions: { width: room.width / 100, length: room.height / 100 },
        furniture: allFurniture.map(f => ({ name: f.name, width: f.width / 100, length: f.height / 100 })),
      });
      setSuggestionResult(result);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to suggest layout.", variant: "destructive" });
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleEvaluate = async () => {
    if (rooms.length === 0) {
      toast({ title: "Cannot evaluate", description: "Please add a room.", variant: "destructive" });
      return;
    }
    setIsLoadingEvaluation(true);
    setEvaluationResult(null);
    try {
      const room = rooms[0];
      const result = await evaluateArrangement({
        roomDimensions: `${room.width/100}m x ${room.height/100}m`,
        furnitureArrangementDescription: evaluationText || 'The user has not provided a description, but here is the furniture list: ' + allFurniture.map(f => f.name).join(', '),
      });
      setEvaluationResult(result);
    } catch(e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to evaluate arrangement.", variant: "destructive" });
    } finally {
      setIsLoadingEvaluation(false);
    }
  };

  return (
      <div className="p-4 space-y-6">
        <Card className="bg-transparent border-0 shadow-none">
          <CardHeader className="p-2">
            <CardTitle className="flex items-center gap-2 text-base"><Wand2 className="w-5 h-5" /> Suggest a Layout</CardTitle>
            <CardDescription className="text-xs">Let AI suggest an optimal furniture layout for your space.</CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <Button onClick={handleSuggestLayout} disabled={isLoadingSuggestion} className="w-full">
              {isLoadingSuggestion && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate Suggestion
            </Button>
            {suggestionResult && (
              <div className="mt-4 p-3 bg-secondary rounded-lg text-sm">
                <h4 className="font-semibold mb-2">Suggestion:</h4>
                <p className="text-muted-foreground">{suggestionResult.reasoning}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-transparent border-0 shadow-none">
          <CardHeader className="p-2">
            <CardTitle className="flex items-center gap-2 text-base"><Wand2 className="w-5 h-5" /> Evaluate Arrangement</CardTitle>
            <CardDescription className="text-xs">Get feedback on your current furniture arrangement.</CardDescription>
          </CardHeader>
          <CardContent className="p-2 space-y-2">
            <Label htmlFor="arrangement-description" className="text-xs">Describe your arrangement (optional)</Label>
            <Textarea 
              id="arrangement-description" 
              placeholder="e.g., The sofa is against the long wall..."
              value={evaluationText}
              onChange={(e) => setEvaluationText(e.target.value)}
              className="text-xs"
            />
            <Button onClick={handleEvaluate} disabled={isLoadingEvaluation} className="w-full">
              {isLoadingEvaluation && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Evaluate My Design
            </Button>
            {evaluationResult && (
              <div className="mt-4 p-3 bg-secondary rounded-lg text-sm space-y-3">
                <h4 className="font-semibold">Evaluation:</h4>
                <p><strong>Overall:</strong> {evaluationResult.overallAssessment}</p>
                <p><strong>Flow:</strong> {evaluationResult.flowFeedback}</p>
                <p><strong>Aesthetics:</strong> {evaluationResult.aestheticsFeedback}</p>
                <p><strong>Functionality:</strong> {evaluationResult.functionalityFeedback}</p>
                <div>
                  <strong>Suggestions:</strong>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {evaluationResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
