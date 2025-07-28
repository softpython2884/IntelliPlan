"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, EyeOff, Sofa, Square, MessageSquare, Ruler } from "lucide-react";
import type { BaseItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LayersPanelProps {
  items: BaseItem[];
  onSelectItem: (item: BaseItem | null) => void;
  onToggleVisibility: (item: BaseItem) => void;
}

const itemIcons = {
    room: Square,
    furniture: Sofa,
    annotation: MessageSquare,
    measurement: Ruler,
};

export function LayersPanel({ items, onSelectItem, onToggleVisibility }: LayersPanelProps) {
  const reversedItems = [...items].reverse();

  return (
    <div className="p-2">
      <h3 className="px-2 py-1 text-sm font-semibold text-muted-foreground">Layers</h3>
      <ScrollArea className="h-[calc(100vh-150px)]">
        <div className="space-y-1 p-1">
          {reversedItems.length === 0 && (
            <p className="p-2 text-xs text-center text-muted-foreground">The canvas is empty.</p>
          )}
          {reversedItems.map((item) => {
            const Icon = itemIcons[item.type];
            const name = 'name' in item ? item.name : item.type;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md hover:bg-accent group"
              >
                <Button
                  variant="ghost"
                  className="flex-1 justify-start h-8"
                  onClick={() => onSelectItem(item)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="truncate text-sm">{name}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility({ ...item, visible: !item.visible });
                  }}
                >
                  {item.visible ?? true ? <Eye className="w-4 h-4 text-muted-foreground" /> : <EyeOff className="w-4 h-4 text-muted-foreground/50" />}
                </Button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
