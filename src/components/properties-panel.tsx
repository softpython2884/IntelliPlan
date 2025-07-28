import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import type { Room, Furniture, Annotation } from "@/lib/types";
import { AIPanel } from "./ai-panel";
import { ScrollArea } from "./ui/scroll-area";

interface PropertiesPanelProps {
  selectedItem: Room | Furniture | Annotation | null;
  onUpdateItem: (item: Room | Furniture | Annotation) => void;
  onDeleteItem: (item: Room | Furniture | Annotation | null) => void;
  allFurniture: Furniture[];
  rooms: Room[];
}

export function PropertiesPanel({ selectedItem, onUpdateItem, onDeleteItem, allFurniture, rooms }: PropertiesPanelProps) {
  const handlePropertyChange = (prop: string, value: any) => {
    if (!selectedItem) return;
    onUpdateItem({ ...selectedItem, [prop]: value });
  };
  
  const renderProperties = () => {
    if (!selectedItem) {
      return <div className="p-4 text-sm text-center text-muted-foreground">Select an item to see its properties.</div>;
    }

    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold capitalize">{selectedItem.type}: {('name' in selectedItem) ? selectedItem.name : ''}</h3>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => onDeleteItem(selectedItem)}><Trash2 className="w-4 h-4" /></Button>
        </div>
        
        {('name' in selectedItem) && (
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={selectedItem.name} onChange={(e) => handlePropertyChange('name', e.target.value)} />
          </div>
        )}

        {('width' in selectedItem) && ('height' in selectedItem) && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="width">Width (cm)</Label>
              <Input id="width" type="number" value={selectedItem.width} onChange={(e) => handlePropertyChange('width', parseInt(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="height">Height (cm)</Label>
              <Input id="height" type="number" value={selectedItem.height} onChange={(e) => handlePropertyChange('height', parseInt(e.target.value))} />
            </div>
          </div>
        )}

        {('rotation' in selectedItem) && (
           <div>
            <Label htmlFor="rotation">Rotation</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="rotation"
                min={0}
                max={360}
                step={1}
                value={[selectedItem.rotation]}
                onValueChange={(value) => handlePropertyChange('rotation', value[0])}
              />
              <span className="text-sm w-12 text-right">{selectedItem.rotation}°</span>
            </div>
          </div>
        )}

        {('text' in selectedItem) && (
          <div>
            <Label htmlFor="text">Note</Label>
            <Textarea id="text" value={selectedItem.text} onChange={(e) => handlePropertyChange('text', e.target.value)} />
          </div>
        )}

      </div>
    );
  };
  
  return (
    <Card className="w-80 border-0 border-l rounded-none shrink-0">
      <Tabs defaultValue="properties" className="w-full flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-2 shrink-0">
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1">
          <TabsContent value="properties">
              {renderProperties()}
          </TabsContent>
          <TabsContent value="ai">
            <AIPanel allFurniture={allFurniture} rooms={rooms} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </Card>
  );
}
