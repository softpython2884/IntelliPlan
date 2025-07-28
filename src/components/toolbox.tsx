"use client";
import { MousePointer, Ruler, Square, Sofa, MessageSquare, Upload, Bed, Lamp, Tv, Hand, LampCeiling, Power, ToggleLeft, Armchair, Book, Coffee, LampDesk, CaseLower } from "lucide-react";
import type { FC } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ToolboxProps {
  currentTool: string;
  onToolSelect: (tool: string) => void;
  onAddFurniture: (item: { name: string; width: number; height: number; icon: FC<any>, category: 'furniture' | 'electrical' }) => void;
  onAddAnnotation: () => void;
  onImageUpload: (url: string) => void;
}

const furnitureItems = [
  { name: 'Sofa', width: 200, height: 90, icon: Sofa, category: 'furniture' },
  { name: 'Armchair', width: 80, height: 90, icon: Armchair, category: 'furniture' },
  { name: 'Coffee Table', width: 120, height: 60, icon: Coffee, category: 'furniture' },
  { name: 'TV', width: 140, height: 10, icon: Tv, category: 'furniture' },
  { name: 'Double Bed', width: 160, height: 200, icon: Bed, category: 'furniture' },
  { name: 'Nightstand', width: 50, height: 40, icon: CaseLower, category: 'furniture' },
  { name: 'Dining Table', width: 180, height: 90, icon: () => <div className="w-full h-full border-2 rounded-lg border-current" />, category: 'furniture' },
  { name: 'Chair', width: 50, height: 50, icon: () => <div className="w-full h-full border-2 rounded-md border-current" />, category: 'furniture' },
  { name: 'Desk', width: 140, height: 70, icon: LampDesk, category: 'furniture' },
  { name: 'Bookcase', width: 90, height: 30, icon: Book, category: 'furniture' },
  { name: 'Floor Lamp', width: 40, height: 40, icon: Lamp, category: 'furniture' },
];

const electricalItems = [
    { name: 'Switch', width: 10, height: 10, icon: ToggleLeft, category: 'electrical' },
    { name: 'Outlet', width: 10, height: 10, icon: Power, category: 'electrical' },
    { name: 'Ceiling Light', width: 30, height: 30, icon: LampCeiling, category: 'electrical' },
]

export function Toolbox({ currentTool, onToolSelect, onAddFurniture, onAddAnnotation, onImageUpload }: ToolboxProps) {
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
              <ToolButton name="pan" icon={Hand} currentTool={currentTool} onSelect={onToolSelect} />
              <ToolButton name="measure" icon={Ruler} currentTool={currentTool} onSelect={onToolSelect} />
            </div>

            <Separator className="my-4" />
            
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Create</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => onToolSelect('draw-room')}><Square className="w-4 h-4 mr-2"/> Add Room</Button>
              <Button variant="outline" className="w-full justify-start" onClick={onAddAnnotation}><MessageSquare className="w-4 h-4 mr-2"/> Add Note</Button>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Floor Plan</h3>
            <Button asChild variant="outline" className="w-full">
              <label className="cursor-pointer flex items-center justify-center">
                <Upload className="w-4 h-4 mr-2" /> Import Image
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </Button>

            <Separator className="my-4" />

            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Furniture</h3>
              <div className="grid grid-cols-2 gap-2">
                {furnitureItems.map((item) => (
                   <ItemButton key={item.name} item={item} onAddItem={onAddFurniture} />
                ))}
              </div>
              
            <Separator className="my-4" />

            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Electrical</h3>
              <div className="grid grid-cols-2 gap-2">
                {electricalItems.map((item) => (
                   <ItemButton key={item.name} item={item} onAddItem={onAddFurniture} />
                ))}
              </div>

          </TooltipProvider>
        </div>
      </ScrollArea>
    </Card>
  );
}

interface ItemButtonProps {
    item: { name: string; width: number; height: number; icon: FC<any>, category: 'furniture' | 'electrical' };
    onAddItem: (item: { name:string; width: number; height: number; icon: FC<any>, category: 'furniture' | 'electrical' }) => void;
}

function ItemButton({ item, onAddItem }: ItemButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                onClick={() => onAddItem(item)}
                className={cn(
                    "flex flex-col items-center justify-center p-2 border rounded-lg aspect-square hover:bg-accent hover:text-accent-foreground transition-colors",
                     item.category === 'electrical' ? 'bg-blue-100/20' : ''
                )}
                >
                <item.icon className="w-8 h-8 mb-1" />
                <span className="text-xs text-center">{item.name}</span>
                </button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Add {item.name}</p>
                <p className="text-xs text-muted-foreground">{item.width}cm x {item.height}cm</p>
            </TooltipContent>
        </Tooltip>
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
