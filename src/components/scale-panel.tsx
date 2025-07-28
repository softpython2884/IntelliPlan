"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ScalePanelProps {
  scale: { pixels: number, meters: number };
  setScale: (scale: { pixels: number, meters: number }) => void;
}

export function ScalePanel({ scale, setScale }: ScalePanelProps) {

  return (
    <Card className="absolute top-4 left-4 z-10 w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Scale className="w-5 h-5"/> Configure Scale</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Draw a line on a known dimension (like a door or window) to set the scale for your plan. The first line you draw will be the reference.
        </p>
        <div className="flex items-end gap-2">
            <div className="flex-1">
                <Label htmlFor="pixel-length">Reference Length</Label>
                <Input 
                    id="pixel-length" 
                    type="number" 
                    value={scale.meters} 
                    onChange={e => setScale({ ...scale, meters: parseFloat(e.target.value) || 0 })}
                />
            </div>
            <Select defaultValue="m">
                <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="m">m</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="ft">ft</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          After drawing your first measurement line, enter its real-world length here.
        </p>
      </CardContent>
    </Card>
  );
}
