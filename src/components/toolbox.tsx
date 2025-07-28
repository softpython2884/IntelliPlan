"use client";
import { MousePointer, Ruler, Square, Sofa, MessageSquare, Upload, Bed, Lamp, Tv } from "lucide-react";
import type { FC } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ToolboxProps {
  currentTool: string;
  onToolSelect: (tool: string) => void;
  onAddRoom: () => void;
  onAddFurniture: (item: { name: string; width: number; height: number; icon: FC<any>}) => void;
  onAddAnnotation: () => void;
  onImageUpload: (url: string) => void;
}

const furnitureItems = [
  { name: 'Sofa', width: 180, height: 90, icon: Sofa },
  { name: 'Bed', width: 160, height: 200, icon: Bed },
  { name: 'Table', width: 120, height: 70, icon: () => <div className="w-full h-full border-2 rounded-md border-current" /> },
  { name: 'Chair', width: 60, height: 60, icon: () => <div className="w-full h-full border-2 rounded-full border-current" /> },
  { name: 'TV', width: 140, height: 15, icon: Tv },
  { name: 'Lamp', width: 40, height: 40, icon: Lamp },
];

export function Toolbox({ currentTool, onToolSelect, onAddRoom, onAddFurniture, onAddAnnotation, onImageUpload }: ToolboxProps) {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      onImageUpload(url);
    }
  };

  return (
    <Card className="w-64 border-0 border-r rounded-none shrink-0">
      <ScrollArea className="h-full">
        <div className="p-4">
          <h2 className="mb-4 text-lg font-semibold">Tools</h2>
          <TooltipProvider>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <ToolButton name="select" icon={MousePointer} currentTool={currentTool} onSelect={onToolSelect} />
              <ToolButton name="measure" icon={Ruler} currentTool={currentTool} onSelect={onToolSelect} />
            </div>

            <Separator className="my-4" />
            
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Create</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={onAddRoom}><Square className="w-4 h-4 mr-2"/> Add Room</Button>
              <Button variant="outline" className="w-full justify-start" onClick={onAddAnnotation}><MessageSquare className="w-4 h-4 mr-2"/> Add Note</Button>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Floor Plan</h3>
            <Button asChild variant="outline" className="w-full">
              <label className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" /> Import Image
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </Button>

            <Separator className="my-4" />

            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Furniture</h3>
              <div className="grid grid-cols-2 gap-2">
                {furnitureItems.map((item) => (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onAddFurniture(item)}
                        className="flex flex-col items-center justify-center p-2 border rounded-lg aspect-square hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <item.icon className="w-8 h-8 mb-1" />
                        <span className="text-xs">{item.name}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add {item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.width}cm x {item.height}cm</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
          </TooltipProvider>
        </div>
      </ScrollArea>
    </Card>
  );
}

interface ToolButtonProps {
  name: string;
  icon: React.ElementType;
  currentTool: string;
  onSelect: (name: string) => void;
}

function ToolButton({ name, icon: Icon, currentTool, onSelect }: ToolButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={currentTool === name ? "default" : "outline"}
          size="icon"
          onClick={() => onSelect(name)}
          className="w-full aspect-square h-auto"
        >
          <Icon className="w-6 h-6" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="capitalize">{name}</p>
      </TooltipContent>
    </Tooltip>
  );
}
