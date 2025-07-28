"use client";

import { useState } from "react";
import type { FC } from "react";
import { Header } from "@/components/header";
import { Toolbox } from "@/components/toolbox";
import { Canvas } from "@/components/canvas";
import { PropertiesPanel } from "@/components/properties-panel";
import type { Furniture, Room, Annotation, Measurement, BaseItem, Surface } from "@/lib/types";
import { ScalePanel } from "@/components/scale-panel";

export default function Home() {
  const [tool, setTool] = useState("select");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [surfaces, setSurfaces] = useState<Surface[]>([]);
  const [scale, setScale] = useState({ pixels: 0, meters: 0 });
  const [selectedItem, setSelectedItem] = useState<BaseItem | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  const handleClear = () => {
    setRooms([]);
    setFurniture([]);
    setAnnotations([]);
    setMeasurements([]);
    setSurfaces([]);
    setSelectedItem(null);
    setBackgroundImage(null);
    setScale({ pixels: 0, meters: 0 });
  };

  const addRoom = (newRoom: Room) => {
    setRooms([...rooms, newRoom]);
    setSelectedItem(newRoom);
    setTool('select');
  };

  const addFurniture = (item: { name: string; width: number; height: number; icon: FC<any> }) => {
    const newFurniture: Furniture = {
      id: `furniture-${Date.now()}`,
      type: 'furniture',
      x: 100,
      y: 100,
      width: item.width,
      height: item.height,
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

  const setItems = (newItems: BaseItem[]) => {
      setRooms(newItems.filter(i => i.type === 'room') as Room[]);
      setFurniture(newItems.filter(i => i.type === 'furniture') as Furniture[]);
      setAnnotations(newItems.filter(i => i.type === 'annotation') as Annotation[]);
      setMeasurements(newItems.filter(i => i.type === 'measurement') as Measurement[]);
      setSurfaces(newItems.filter(i => i.type === 'surface') as Surface[]);
  }

  // Correct layering order for rendering and for the layers panel
  const allItems = [...rooms, ...surfaces, ...furniture, ...annotations, ...measurements];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
      <Header onClear={handleClear} />
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
            tool={tool}
            items={allItems}
            setItems={setItems}
            scale={scale}
            setScale={setScale}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            onUpdateItem={updateItem}
            backgroundImage={backgroundImage}
            setTool={setTool}
            onAddRoom={addRoom}
          />
        </main>
        <PropertiesPanel
          selectedItem={selectedItem}
          onUpdateItem={updateItem}
          onDeleteItem={(item) => {
            if (!item) return;
            if (item.type === 'room') setRooms(rooms.filter(r => r.id !== item.id));
            if (item.type === 'furniture') setFurniture(furniture.filter(f => f.id !== item.id));
            if (item.type === 'annotation') setAnnotations(annotations.filter(a => a.id !== item.id));
            if (item.type === 'measurement') setMeasurements(measurements.filter(m => m.id !== item.id));
            if (item.type === 'surface') setSurfaces(surfaces.filter(s => s.id !== item.id));
            setSelectedItem(null);
          }}
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
