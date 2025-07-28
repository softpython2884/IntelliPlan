"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Milestone, Workflow } from "lucide-react";

interface ScalePanelProps {
  tool: string;
}

export function ScalePanel({ tool }: ScalePanelProps) {
  if (tool === 'measure') {
    return (
      <Card className="absolute top-4 left-4 z-10 w-80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Scale className="w-5 h-5"/> Setting Scale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click twice to draw a line on a known dimension (like a door or wall).
          </p>
          <p className="text-xs text-muted-foreground">
            After drawing the line, select it and enter its real-world length in the properties panel to set the scale for the entire plan.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (tool === 'draw-room') {
    return (
      <Card className="absolute top-4 left-4 z-10 w-80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Milestone className="w-5 h-5"/> Drawing Room</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click on the canvas to add points to your room.
          </p>
          <p className="text-xs text-muted-foreground">
            Click on the first point or press 'Enter' to finish the room. Press 'Esc' to cancel.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (tool === 'circuit') {
    return (
      <Card className="absolute top-4 left-4 z-10 w-80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Workflow className="w-5 h-5"/> Drawing Circuit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click on two points on the canvas to draw a line representing an electrical circuit.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return null;
}
