"use client";

import { useState, useEffect, useRef } from "react";
import type { FC } from "react";
import { Header } from "@/components/header";
import { Toolbox } from "@/components/toolbox";
import { Canvas } from "@/components/canvas";
import { PropertiesPanel } from "@/components/properties-panel";
import type { Furniture, Room, Annotation, Measurement, BaseItem, Surface, Point } from "@/lib/types";
import { ScalePanel } from "@/components/scale-panel";
import { useToast } from "@/hooks/use-toast";
import { getPolygonBounds, getPolygonCentroid } from "@/lib/geometry";

interface ProjectData {
  items: BaseItem[];
  scale: { pixels: number; meters: number };
  backgroundImage: string | null;
}

const migrateProjectData = (data: any): ProjectData => {
  const migratedItems = data.items.map((item: any) => {
    const defaults = {
      visible: true,
    };
    const migratedItem = { ...defaults, ...item };

    if (migratedItem.type === 'furniture') {
      const furnitureDefaults = {
        category: 'furniture',
        shape: 'rectangle',
        color: 'hsl(var(--accent))',
        rotation: 0,
      };
      return { ...furnitureDefaults, ...migratedItem };
    }
    
    if (migratedItem.type === 'room') {
      const roomDefaults = {
        rotation: 0,
      };
      let room = { ...roomDefaults, ...migratedItem };
      if (!room.width || !room.height) {
        const bounds = getPolygonBounds(room.points);
        room.width = bounds.width;
        room.height = bounds.height;
      }
      if (!room.x || !room.y) {
        const centroid = getPolygonCentroid(room.points);
        room.x = centroid.x;
        room.y = centroid.y;
      }
      return room;
    }
    
    return migratedItem;
  });

  return { ...data, items: migratedItems };
};


export default function Home() {
  const [tool, setTool] = useState("select");
  const [items, setItems] = useState<BaseItem[]>([]);
  const [scale, setScale] = useState({ pixels: 100, meters: 1 }); // Default scale
  const [selectedItem, setSelectedItem] = useState<BaseItem | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const { toast } = useToast();
  const canvasApiRef = useRef<{ getCenter: () => Point }>(null);
  const [clipboard, setClipboard] = useState<BaseItem | null>(null);


  const handleClear = () => {
    setItems([]);
    setSelectedItem(null);
    setBackgroundImage(null);
    setScale({ pixels: 100, meters: 1 });
  };

  const handleExport = () => {
    const projectData: ProjectData = {
      items,
      scale,
      backgroundImage
    };
    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "intellipan-project.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Success", description: "Project exported successfully." });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File is not valid text.");
        }
        let data: ProjectData = JSON.parse(text);
        
        // Basic validation
        if (!data.items || !data.scale) {
           throw new Error("Invalid project file format.");
        }
        
        data = migrateProjectData(data);

        handleClear(); // Clear existing project
        setItems(data.items || []);
        setScale(data.scale);
        setBackgroundImage(data.backgroundImage || null);
        toast({ title: "Success", description: "Project imported successfully." });
      } catch (error: any) {
        console.error("Failed to import project:", error);
        toast({ title: "Error", description: `Failed to import project: ${error.message}`, variant: "destructive" });
      } finally {
        // Reset file input to allow importing the same file again
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  };


  const addRoom = (newRoom: Room) => {
    setItems(prev => [...prev, newRoom]);
    setSelectedItem(newRoom);
    setTool('select');
  };

  const addFurniture = (item: { name: string; width: number; height: number; shape: 'rectangle' | 'circle', color: string, icon: FC<any>, category: 'furniture' | 'electrical' }) => {
    const center = canvasApiRef.current?.getCenter() || { x: 100, y: 100 };
    const newFurniture: Furniture = {
      id: `furniture-${Date.now()}`,
      type: 'furniture',
      x: center.x,
      y: center.y,
      width: item.width,
      height: item.height,
      name: item.name,
      rotation: 0,
      visible: true,
      category: item.category,
      shape: item.shape,
      color: item.color,
    };
    setItems(prev => [...prev, newFurniture]);
    setSelectedItem(newFurniture);
  };
  
  const addAnnotation = () => {
    const center = canvasApiRef.current?.getCenter() || { x: 150, y: 150 };
    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      type: 'annotation',
      x: center.x,
      y: center.y,
      text: 'New Note',
      visible: true,
    };
    setItems(prev => [...prev, newAnnotation]);
    setSelectedItem(newAnnotation);
  }
  
  const addMeasurement = (newMeasurement: Measurement) => {
    setItems(prev => [...prev, newMeasurement]);
  }

  const updateItem = (item: BaseItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? item : i));
    
    if(selectedItem?.id === item.id) {
        setSelectedItem(item as any);
    }
  };
  
  const addSurface = (newSurface: Surface) => {
    setItems(prev => [...prev, newSurface]);
  };

  const deleteItem = (item: BaseItem | null) => {
    if (!item) return;
    setItems(items.filter(i => i.id !== item.id));
    setSelectedItem(null);
  }
  
  const handleReorderItem = (itemId: string, direction: 'up' | 'down') => {
    const index = items.findIndex(item => item.id === itemId);
    if (index === -1) return;

    const newItems = [...items];
    const [item] = newItems.splice(index, 1);
    
    if (direction === 'up') {
        const newIndex = Math.min(items.length - 1, index + 1);
        newItems.splice(newIndex, 0, item);
    } else {
        const newIndex = Math.max(0, index - 1);
        newItems.splice(newIndex, 0, item);
    }
    
    setItems(newItems);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTextInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      if (e.key === 'Delete' || e.key === 'Backspace') {
          if(selectedItem && !isTextInput) {
              deleteItem(selectedItem);
          }
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectedItem && !isTextInput) {
          setClipboard(selectedItem);
          toast({ title: "Copied", description: `${('name' in selectedItem && selectedItem.name) || selectedItem.type} copied to clipboard.`});
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (clipboard && !isTextInput) {
          const newItem = { ...clipboard, id: `${clipboard.type}-${Date.now()}` };
          const center = canvasApiRef.current?.getCenter();

          if (center && 'x' in newItem && 'y' in newItem) {
            newItem.x = center.x;
            newItem.y = center.y;
          } else if (newItem.type === 'room' && center) {
            const roomCenter = getPolygonCentroid(newItem.points);
            const dx = center.x - roomCenter.x;
            const dy = center.y - roomCenter.y;
            newItem.points = newItem.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
          } else if ('x' in newItem) {
            newItem.x += 10;
            newItem.y += 10;
          }

          setItems(prev => [...prev, newItem]);
          
          if (newItem.type !== 'measurement' && newItem.type !== 'surface') {
             setSelectedItem(newItem);
          }
          toast({ title: "Pasted", description: `Item pasted successfully.`});
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, deleteItem, clipboard]);


  const rooms = items.filter(i => i.type === 'room') as Room[];
  const furniture = items.filter(i => i.type === 'furniture') as Furniture[];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
      <Header onClear={handleClear} onExport={handleExport} onImport={handleImport} />
      <div className="flex flex-1 overflow-hidden">
        <Toolbox
          currentTool={tool}
          onToolSelect={setTool}
          onAddFurniture={addFurniture}
          onAddAnnotation={addAnnotation}
          onImageUpload={setBackgroundImage}
        />
        <main className="flex-1 relative">
           {(tool === 'measure' || tool === 'draw-room') && <ScalePanel tool={tool}/>}
          <Canvas
            canvasApiRef={canvasApiRef}
            tool={tool}
            items={items}
            scale={scale}
            setScale={setScale}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            onUpdateItem={updateItem}
            backgroundImage={backgroundImage}
            setTool={setTool}
            onAddRoom={addRoom}
            onAddMeasurement={addMeasurement}
          />
        </main>
        <PropertiesPanel
          selectedItem={selectedItem}
          onUpdateItem={updateItem}
          onDeleteItem={deleteItem}
          onSelectItem={setSelectedItem}
          allItems={items}
          onReorderItem={handleReorderItem}
          allFurniture={furniture}
          rooms={rooms}
          onAddSurface={addSurface}
          scale={scale}
          onScaleChange={setScale}
        />
      </div>
    </div>
  );
}
