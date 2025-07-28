import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import type { BaseItem, Measurement, Surface, Room, Furniture } from "@/lib/types";
import { AIPanel } from "./ai-panel";
import { ScrollArea } from "./ui/scroll-area";
import { getDistance, formatDistance } from "@/lib/geometry";
import { LayersPanel } from "./layers-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";

interface PropertiesPanelProps {
  selectedItem: BaseItem | null;
  onUpdateItem: (item: BaseItem) => void;
  onDeleteItem: (item: BaseItem | null) => void;
  onSelectItem: (item: BaseItem | null) => void;
  allItems: BaseItem[];
  allFurniture: Furniture[];
  rooms: Room[];
  onAddSurface: (surface: Surface) => void;
  scale: { pixels: number, meters: number };
  onScaleChange: (scale: { pixels: number, meters: number }) => void;
  onReorderItem: (itemId: string, direction: 'up' | 'down') => void;
}

export function PropertiesPanel({ selectedItem, onUpdateItem, onDeleteItem, onSelectItem, allItems, allFurniture, rooms, onAddSurface, scale, onScaleChange, onReorderItem }: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState("inspector");
  
  const handlePropertyChange = (prop: string, value: any) => {
    if (!selectedItem) return;
    
    if (selectedItem.type === 'measurement' && prop === 'realLength') {
      const pixelLength = getDistance(selectedItem.start, selectedItem.end);
      if (value > 0) {
        onScaleChange({ pixels: pixelLength, meters: value / 100 });
        const updatedItem = { ...selectedItem, [prop]: value, isReference: true };
        onUpdateItem(updatedItem);

        // Demote other reference lines
        allItems.forEach(item => {
          if (item.type === 'measurement' && item.id !== selectedItem.id && item.isReference) {
            onUpdateItem({ ...item, isReference: false, realLength: undefined });
          }
        });
        return;
      }
    }

    onUpdateItem({ ...selectedItem, [prop]: value });
  };
  
  const handleConvertToSurface = () => {
    if (!selectedItem || selectedItem.type !== 'measurement') return;

    const measurement = selectedItem as Measurement;
    const newSurface: Surface = {
      id: `surface-${Date.now()}`,
      type: 'surface',
      start: measurement.start,
      end: measurement.end,
      surfaceType: 'wall',
      thickness: 5,
      visible: true,
    };

    onUpdateItem({ ...measurement, isSurface: true, visible: false }); // Hide original measurement
    onAddSurface(newSurface); // Add new surface
    onSelectItem(newSurface);
  };
  
  const renderProperties = () => {
    if (!selectedItem) {
        return <LayersPanel items={allItems} selectedItem={selectedItem} onSelectItem={onSelectItem} onToggleVisibility={onUpdateItem} onReorderItem={onReorderItem} />;
    }

    const typeName = selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1);

    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold capitalize">{typeName}: {('name' in selectedItem && selectedItem.name) ? selectedItem.name : ''}</h3>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => onDeleteItem(selectedItem)}><Trash2 className="w-4 h-4" /></Button>
        </div>
        
        {('name' in selectedItem) && (
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={selectedItem.name} onChange={(e) => handlePropertyChange('name', e.target.value)} />
          </div>
        )}

        {selectedItem.type === 'room' && (
          <div className="text-sm text-muted-foreground">
            <p>Width: {formatDistance(selectedItem.width, scale)}</p>
            <p>Height: {formatDistance(selectedItem.height, scale)}</p>
          </div>
        )}

        {selectedItem.type === 'furniture' && ('width' in selectedItem) && ('height' in selectedItem) && (
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
              <Input
                type="number"
                className="w-20"
                value={selectedItem.rotation}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if(!isNaN(value) && value >= 0 && value <= 360) {
                    handlePropertyChange('rotation', value);
                  }
                }}
                min={0}
                max={360}
              />
            </div>
          </div>
        )}

        {('text' in selectedItem) && (
          <div>
            <Label htmlFor="text">Note</Label>
            <Textarea id="text" value={selectedItem.text} onChange={(e) => handlePropertyChange('text', e.target.value)} />
          </div>
        )}
        
        {selectedItem.type === 'wiring' && (
          <div className="text-sm text-muted-foreground">
              <p>Length: {formatDistance(getDistance(selectedItem.start, selectedItem.end), scale)}</p>
          </div>
        )}

        {(selectedItem.type === 'measurement' && !selectedItem.isSurface) && (
          <>
            <div>
              <Label>Length</Label>
              <p className="text-sm font-bold">{formatDistance(getDistance(selectedItem.start, selectedItem.end), scale, selectedItem.realLength)}</p>
              <div className="mt-4">
                <Label htmlFor="realLength">Set as Reference Scale: Real Length (cm)</Label>
                <Input id="realLength" type="number" placeholder="e.g. 90" step="0.1" value={selectedItem.realLength || ''} onChange={(e) => handlePropertyChange('realLength', parseFloat(e.target.value))} />
                 <p className="text-xs text-muted-foreground mt-1">Set this to define the scale for the entire plan. This measurement will turn blue.</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleConvertToSurface} className="w-full">
                Convert to Surface
            </Button>
          </>
        )}
        
        {selectedItem.type === 'surface' && (
            <>
              <div>
                <Label htmlFor="surfaceType">Surface Type</Label>
                <Select
                  value={selectedItem.surfaceType}
                  onValueChange={(value: Surface['surfaceType']) => handlePropertyChange('surfaceType', value)}
                >
                  <SelectTrigger id="surfaceType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wall">Wall</SelectItem>
                    <SelectItem value="window">Window</SelectItem>
                    <SelectItem value="door">Door</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="thickness">Thickness (px)</Label>
                <Input
                  id="thickness"
                  type="number"
                  value={selectedItem.thickness}
                  onChange={(e) => handlePropertyChange('thickness', parseInt(e.target.value))}
                />
              </div>
            </>
          )}
        <Button variant="outline" size="sm" onClick={() => onSelectItem(null)} className="w-full">
          Deselect (show layers)
        </Button>
      </div>
    );
  };
  
  return (
    <Card className="w-80 border-0 border-l rounded-none shrink-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-2 shrink-0">
          <TabsTrigger value="inspector">Inspector</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1">
          <TabsContent value="inspector" className="mt-0">
              {renderProperties()}
          </TabsContent>
          <TabsContent value="ai" className="mt-0">
            <AIPanel allFurniture={allFurniture} rooms={rooms} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </Card>
  );
}
