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

interface ProjectData {
  rooms: Room[];
  furniture: Furniture[];
  annotations: Annotation[];
  measurements: Measurement[];
  surfaces: Surface[];
  scale: { pixels: number; meters: number };
  backgroundImage: string | null;
}

export default function Home() {
  const [tool, setTool] = useState("select");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [surfaces, setSurfaces] = useState<Surface[]>([]);
  const [scale, setScale] = useState({ pixels: 100, meters: 1 }); // Default scale
  const [selectedItem, setSelectedItem] = useState<BaseItem | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const { toast } = useToast();
  const canvasApiRef = useRef<{ getCenter: () => Point }>(null);


  const handleClear = () => {
    setRooms([]);
    setFurniture([]);
    setAnnotations([]);
    setMeasurements([]);
    setSurfaces([]);
    setSelectedItem(null);
    setBackgroundImage(null);
    setScale({ pixels: 100, meters: 1 });
  };

  const handleExport = () => {
    const projectData: ProjectData = {
      rooms,
      furniture,
      annotations,
      measurements,
      surfaces,
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
        const data: ProjectData = JSON.parse(text);
        
        // Basic validation
        if (!data.rooms || !data.furniture || !data.scale) {
           throw new Error("Invalid project file format.");
        }

        handleClear(); // Clear existing project
        setRooms(data.rooms);
        setFurniture(data.furniture);
        setAnnotations(data.annotations || []);
        setMeasurements(data.measurements || []);
        setSurfaces(data.surfaces || []);
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
    setRooms([...rooms, newRoom]);
    setSelectedItem(newRoom);
    setTool('select');
  };

  const addFurniture = (item: { name: string; width: number; height: number; icon: FC<any> }) => {
    const center = canvasApiRef.current?.getCenter() || { x: 100, y: 100 };
    const newFurniture: Furniture = {
      id: `furniture-${Date.now()}`,
      type: 'furniture',
      x: center.x,
      y: center.y,
      width: item.width, // in cm
      height: item.height, // in cm
      name: item.name,
      rotation: 0,
      visible: true,
    };
    setFurniture([...furniture, newFurniture]);
    setSelectedItem(newFurniture);
  };

  const addAnnotation = () => {
    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      type: 'annotation',
      x: 150,
      y: 150,
      text: 'New Note',
      visible: true,
    };
    setAnnotations([...annotations, newAnnotation]);
    setSelectedItem(newAnnotation);
  }
  
  const addMeasurement = (newMeasurement: Measurement) => {
    setMeasurements([...measurements, newMeasurement]);
  }

  const updateItem = (item: BaseItem) => {
    const updater = (prevItems: BaseItem[]) => prevItems.map(i => i.id === item.id ? item : i);
    
    if (item.type === 'room') {
      setRooms(updater as any);
    } else if (item.type === 'furniture') {
      setFurniture(updater as any);
    } else if (item.type === 'annotation') {
      setAnnotations(updater as any);
    } else if (item.type === 'measurement') {
      setMeasurements(updater as any);
    } else if (item.type === 'surface') {
        setSurfaces(updater as any);
    }

    if(selectedItem?.id === item.id) {
        setSelectedItem(item as any);
    }
  };
  
  const addSurface = (newSurface: Surface) => {
    setSurfaces(prev => [...prev, newSurface]);
  };

  const deleteItem = (item: BaseItem | null) => {
    if (!item) return;
    if (item.type === 'room') setRooms(rooms.filter(r => r.id !== item.id));
    if (item.type === 'furniture') setFurniture(furniture.filter(f => f.id !== item.id));
    if (item.type === 'annotation') setAnnotations(annotations.filter(a => a.id !== item.id));
    if (item.type === 'measurement') setMeasurements(measurements.filter(m => m.id !== item.id));
    if (item.type === 'surface') setSurfaces(surfaces.filter(s => s.id !== item.id));
    setSelectedItem(null);
  }
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if(selectedItem && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
                deleteItem(selectedItem);
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, deleteItem]);


  const allItems = [...rooms, ...surfaces, ...furniture, ...annotations, ...measurements];

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
            items={allItems}
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
          allItems={allItems}
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
