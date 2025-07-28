"use client";

import { useState } from "react";
import type { FC } from "react";
import { Header } from "@/components/header";
import { Toolbox } from "@/components/toolbox";
import { Canvas } from "@/components/canvas";
import { PropertiesPanel } from "@/components/properties-panel";
import type { Furniture, Room, Annotation, Measurement } from "@/lib/types";
import { ScalePanel } from "@/components/scale-panel";

export default function Home() {
  const [tool, setTool] = useState("select");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [scale, setScale] = useState({ pixels: 100, meters: 2 });
  const [selectedItem, setSelectedItem] = useState<Room | Furniture | Annotation | Measurement | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  const handleClear = () => {
    setRooms([]);
    setFurniture([]);
    setAnnotations([]);
    setMeasurements([]);
    setSelectedItem(null);
    setBackgroundImage(null);
  };

  const addRoom = () => {
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      type: 'room',
      x: 50,
      y: 50,
      width: 400,
      height: 300,
      name: 'New Room',
    };
    setRooms([...rooms, newRoom]);
    setSelectedItem(newRoom);
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
    };
    setAnnotations([...annotations, newAnnotation]);
    setSelectedItem(newAnnotation);
  }

  const updateItem = (item: Room | Furniture | Annotation | Measurement) => {
    if (item.type === 'room') {
      setRooms(rooms.map(r => r.id === item.id ? item as Room : r));
    } else if (item.type === 'furniture') {
      setFurniture(furniture.map(f => f.id === item.id ? item as Furniture : f));
    } else if (item.type === 'annotation') {
      setAnnotations(annotations.map(a => a.id === item.id ? item as Annotation : a));
    } else if (item.type === 'measurement') {
      setMeasurements(measurements.map(m => m.id === item.id ? item as Measurement : m));
    }
    setSelectedItem(item);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
      <Header onClear={handleClear} />
      <div className="flex flex-1 overflow-hidden">
        <Toolbox
          currentTool={tool}
          onToolSelect={setTool}
          onAddRoom={addRoom}
          onAddFurniture={addFurniture}
          onAddAnnotation={addAnnotation}
          onImageUpload={setBackgroundImage}
        />
        <main className="flex-1 relative">
           {tool === 'measure' && <ScalePanel scale={scale} setScale={setScale} />}
          <Canvas
            tool={tool}
            rooms={rooms}
            furniture={furniture}
            annotations={annotations}
            measurements={measurements}
            setMeasurements={setMeasurements}
            scale={scale}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            onUpdateItem={updateItem}
            backgroundImage={backgroundImage}
            setTool={setTool}
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
            setSelectedItem(null);
          }}
          allFurniture={furniture}
          rooms={rooms}
        />
      </div>
    </div>
  );
}
