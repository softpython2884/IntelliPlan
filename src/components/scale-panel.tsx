"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";

export function ScalePanel() {

  return (
    <Card className="absolute top-4 left-4 z-10 w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Scale className="w-5 h-5"/> Setting Scale</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Draw a line on a known dimension (like a door or window) to set the scale for your plan.
        </p>
        <p className="text-xs text-muted-foreground">
          After drawing your first measurement line, select it and enter its real-world length in the properties panel.
        </p>
      </CardContent>
    </Card>
  );
}
