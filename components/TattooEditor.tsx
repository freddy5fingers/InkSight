
import React, { useState, useRef } from 'react';
import { EditorLayer } from '../types';
import { generateTattooElement } from '../services/geminiService';
import { UndoIcon, PlusIcon, XIcon, TrashIcon, AdjustmentsIcon, RefreshIcon, ChevronUpIcon, ChevronDownIcon } from './icons';
import FadeIn from './animations/FadeIn';

interface TattooEditorProps {
  baseImage: string;
  onClose: () => void;
}

const TattooEditor: React.FC<TattooEditorProps> = ({ baseImage, onClose }) => {
  const [layers, setLayers] = useState<EditorLayer[]>([
    { id: 'base', image: baseImage, x: 0, y: 0, width: 100, height: 100, rotation: 0, opacity: 1, isBase: true }
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [history, setHistory] = useState<EditorLayer[][]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newElementPrompt, setNewElementPrompt] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number, y: number, layerX: number, layerY: number } | null>(null);
  const resizeStartRef = useRef<{ x: number, y: number, width: number, height: number } | null>(null);
  const rotateStartRef = useRef<{ startRotation: number, centerX: number, centerY: number, startAngle: number } | null>(null);

  // Save history before modifying layers
  const pushHistory = () => {
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(layers))]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setLayers(previousState);
    setHistory(prev => prev.slice(0, -1));
    setSelectedLayerId(null);
  };

  const handleAddElement = async () => {
    if (!newElementPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const newImage = await generateTattooElement(newElementPrompt);
      pushHistory();
      const newLayer: EditorLayer = {
        id: Date.now().toString(),
        image: newImage,
        x: 25, // Center-ish
        y: 25,
        width: 50,
        height: 50,
        rotation: 0,
        opacity: 1,
        isBase: false
      };
      setLayers(prev => [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
      setNewElementPrompt('');
    } catch (error) {
      console.error("Failed to add element", error);
      alert("Failed to generate element. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveLayer = (id: string) => {
    pushHistory();
    setLayers(prev => prev.filter(l => l.id !== id));
    setSelectedLayerId(null);
  };

  const handleLayerReorder = (direction: 'up' | 'down') => {
    if (!selectedLayerId) return;
    
    const index = layers.findIndex(l => l.id === selectedLayerId);
    if (index === -1) return;
    if (layers[index].isBase) return; // Base layer cannot move

    const newIndex = direction === 'up' ? index + 1 : index - 1;

    // Check bounds (keeping base layer at 0)
    if (newIndex <= 0 || newIndex >= layers.length) return;

    pushHistory();
    setLayers(prev => {
      const newLayers = [...prev];
      [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
      return newLayers;
    });
  };

  const handlePropertyChange = (property: keyof EditorLayer, value: number) => {
      if (!selectedLayerId) return;
      setLayers(prev => prev.map(l => {
          if (l.id === selectedLayerId) {
              return { ...l, [property]: value };
          }
          return l;
      }));
  };

  // --- Interaction Handlers ---

  const handleMouseDown = (e: React.MouseEvent, layerId: string) => {
    if (layers.find(l => l.id === layerId)?.isBase) return;
    
    e.stopPropagation();
    setSelectedLayerId(layerId);
    
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      layerX: layer.x,
      layerY: layer.y
    };
  };

  const handleResizeMouseDown = (e: React.MouseEvent, layerId: string) => {
    e.stopPropagation();
    e.preventDefault(); 
    pushHistory(); 
    const layer = layers.find(l => l.id === layerId);
    if(!layer) return;

    resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: layer.width,
        height: layer.height
    };
  };

  const handleRotateMouseDown = (e: React.MouseEvent, layerId: string) => {
    e.stopPropagation();
    e.preventDefault();
    pushHistory();
    
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Calculate layer center in client coordinates
    // x, y, width, height are in %
    const lLeft = (layer.x / 100) * rect.width;
    const lTop = (layer.y / 100) * rect.height;
    const lWidth = (layer.width / 100) * rect.width;
    const lHeight = (layer.height / 100) * rect.height;

    const centerX = rect.left + lLeft + lWidth / 2;
    const centerY = rect.top + lTop + lHeight / 2;
    
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);

    rotateStartRef.current = {
        startRotation: layer.rotation,
        centerX,
        centerY,
        startAngle
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    // Dragging
    if (dragStartRef.current && selectedLayerId) {
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;

      setLayers(prev => prev.map(l => {
        if (l.id === selectedLayerId) {
          return {
            ...l,
            x: dragStartRef.current!.layerX + deltaX,
            y: dragStartRef.current!.layerY + deltaY
          };
        }
        return l;
      }));
    }

    // Resizing
    if (resizeStartRef.current && selectedLayerId) {
        const deltaX = ((e.clientX - resizeStartRef.current.x) / rect.width) * 100;
        // Simple uniform scale based on X movement
        const delta = deltaX; 

        setLayers(prev => prev.map(l => {
            if(l.id === selectedLayerId) {
                return {
                    ...l,
                    width: Math.max(5, resizeStartRef.current!.width + delta),
                    height: Math.max(5, resizeStartRef.current!.height + delta)
                }
            }
            return l;
        }));
    }

    // Rotation
    if (rotateStartRef.current && selectedLayerId) {
        const { centerX, centerY, startRotation, startAngle } = rotateStartRef.current;
        
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        const delta = currentAngle - startAngle;
        const deltaDeg = delta * (180 / Math.PI);
        
        const newRotation = startRotation + deltaDeg;

        setLayers(prev => prev.map(l => {
            if (l.id === selectedLayerId) {
                return { ...l, rotation: newRotation };
            }
            return l;
        }));
    }
  };

  const handleMouseUp = () => {
    dragStartRef.current = null;
    resizeStartRef.current = null;
    rotateStartRef.current = null;
  };
  
  const handleBackgroundClick = () => {
      setSelectedLayerId(null);
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <div className="bg-gray-900 w-full max-w-6xl h-[90vh] rounded-2xl flex flex-col md:flex-row overflow-hidden border border-white/10 shadow-2xl">
        
        {/* Editor Area */}
        <div className="flex-1 relative bg-[#1a1a1a] flex items-center justify-center p-4 select-none overflow-hidden">
           {/* Canvas Container */}
           <div 
              ref={canvasRef}
              className="relative aspect-square w-full max-w-[600px] max-h-full bg-white shadow-xl"
              onClick={handleBackgroundClick}
           >
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  onMouseDown={(e) => handleMouseDown(e, layer.id)}
                  className={`absolute cursor-move transition-shadow ${selectedLayerId === layer.id && !layer.isBase ? 'ring-2 ring-blue-500 z-20' : 'z-10'}`}
                  style={{
                    left: `${layer.x}%`,
                    top: `${layer.y}%`,
                    width: `${layer.width}%`,
                    height: `${layer.height}%`,
                    transform: `rotate(${layer.rotation}deg)`,
                    mixBlendMode: layer.isBase ? 'normal' : 'multiply',
                    opacity: layer.opacity ?? 1,
                  }}
                >
                  <img 
                    src={layer.image} 
                    className="w-full h-full object-contain pointer-events-none select-none" 
                    alt="layer" 
                  />
                  
                  {/* Controls Overlay for Selected Layer */}
                  {selectedLayerId === layer.id && !layer.isBase && (
                      <>
                        {/* Resize Handle (Bottom Right) */}
                        <div 
                            className="absolute -bottom-3 -right-3 w-6 h-6 bg-blue-500 rounded-full cursor-nwse-resize shadow-md border-2 border-white z-30"
                            onMouseDown={(e) => handleResizeMouseDown(e, layer.id)}
                        />

                        {/* Rotation Handle (Top Center) */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-px h-8 bg-blue-500 pointer-events-none"></div>
                        <div 
                            className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full cursor-grab shadow-md border-2 border-blue-500 flex items-center justify-center z-30 hover:bg-blue-50"
                            onMouseDown={(e) => handleRotateMouseDown(e, layer.id)}
                            title="Rotate"
                        >
                           <RefreshIcon className="w-3 h-3 text-blue-500" />
                        </div>
                      </>
                  )}
                </div>
              ))}
           </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full md:w-96 bg-gray-800 border-l border-white/10 flex flex-col font-sora overflow-y-auto custom-scrollbar">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-gray-800 z-10">
                <h3 className="text-xl font-bold text-white flex items-center"><AdjustmentsIcon className="h-5 w-5 mr-2"/> Studio</h3>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><XIcon className="h-6 w-6 text-gray-400"/></button>
            </div>

            <div className="p-6 space-y-8">
                {/* Actions */}
                <div className="flex gap-2">
                    <button 
                        onClick={handleUndo} 
                        disabled={history.length === 0}
                        className="flex-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 py-2 rounded-lg text-sm font-semibold border border-white/10 transition-colors flex items-center justify-center"
                    >
                        <UndoIcon className="h-4 w-4 mr-2"/> Undo
                    </button>
                </div>

                {/* Add New Element */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Add Element</h4>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newElementPrompt}
                            onChange={(e) => setNewElementPrompt(e.target.value)}
                            placeholder="e.g. rose, dagger, snake"
                            className="flex-1 bg-white/90 border border-white/10 rounded-lg px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button 
                            onClick={handleAddElement}
                            disabled={isGenerating || !newElementPrompt}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 p-2 rounded-lg text-white transition-colors"
                        >
                            {isGenerating ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"/> : <PlusIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Selected Layer Controls */}
                {selectedLayer && !selectedLayer.isBase ? (
                    <FadeIn className="space-y-6">
                         <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Selected Layer</h4>
                            <button onClick={() => handleRemoveLayer(selectedLayer.id)} className="text-red-400 hover:text-red-300 bg-red-900/20 p-1.5 rounded transition-colors"><TrashIcon className="h-4 w-4"/></button>
                         </div>

                         {/* Layer Order */}
                         <div className="space-y-2">
                             <label className="text-xs text-gray-500 font-semibold">Layer Order</label>
                             <div className="flex gap-2">
                                 <button onClick={() => handleLayerReorder('up')} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded p-2 flex justify-center" title="Bring Forward">
                                     <ChevronUpIcon className="h-4 w-4 text-gray-300" />
                                 </button>
                                 <button onClick={() => handleLayerReorder('down')} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded p-2 flex justify-center" title="Send Backward">
                                     <ChevronDownIcon className="h-4 w-4 text-gray-300" />
                                 </button>
                             </div>
                         </div>

                         {/* Appearance */}
                         <div className="space-y-2">
                             <div className="flex justify-between">
                                <label className="text-xs text-gray-500 font-semibold">Opacity</label>
                                <span className="text-xs text-gray-400">{Math.round((selectedLayer.opacity ?? 1) * 100)}%</span>
                             </div>
                             <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={(selectedLayer.opacity ?? 1) * 100}
                                onChange={(e) => handlePropertyChange('opacity', parseInt(e.target.value) / 100)}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                             />
                         </div>
                         
                         {/* Transform Grid */}
                         <div className="space-y-3">
                             <label className="text-xs text-gray-500 font-semibold">Transform</label>
                             <div className="grid grid-cols-2 gap-3">
                                 <div className="space-y-1">
                                     <label className="text-[10px] text-gray-500 uppercase">Pos X (%)</label>
                                     <input type="number" className="w-full bg-white/90 border border-white/10 rounded p-1.5 text-sm text-black" value={Math.round(selectedLayer.x)} onChange={(e) => handlePropertyChange('x', parseInt(e.target.value))} />
                                 </div>
                                 <div className="space-y-1">
                                     <label className="text-[10px] text-gray-500 uppercase">Pos Y (%)</label>
                                     <input type="number" className="w-full bg-white/90 border border-white/10 rounded p-1.5 text-sm text-black" value={Math.round(selectedLayer.y)} onChange={(e) => handlePropertyChange('y', parseInt(e.target.value))} />
                                 </div>
                                 <div className="space-y-1">
                                     <label className="text-[10px] text-gray-500 uppercase">Width (%)</label>
                                     <input type="number" className="w-full bg-white/90 border border-white/10 rounded p-1.5 text-sm text-black" value={Math.round(selectedLayer.width)} onChange={(e) => handlePropertyChange('width', parseInt(e.target.value))} />
                                 </div>
                                 <div className="space-y-1">
                                     <label className="text-[10px] text-gray-500 uppercase">Height (%)</label>
                                     <input type="number" className="w-full bg-white/90 border border-white/10 rounded p-1.5 text-sm text-black" value={Math.round(selectedLayer.height)} onChange={(e) => handlePropertyChange('height', parseInt(e.target.value))} />
                                 </div>
                                  <div className="col-span-2 space-y-1">
                                     <label className="text-[10px] text-gray-500 uppercase">Rotation (Deg)</label>
                                     <div className="flex items-center gap-2">
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="360" 
                                            value={Math.round(selectedLayer.rotation || 0) % 360}
                                            onChange={(e) => handlePropertyChange('rotation', parseInt(e.target.value))}
                                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <input type="number" className="w-16 bg-white/90 border border-white/10 rounded p-1.5 text-sm text-black text-center" value={Math.round(selectedLayer.rotation)} onChange={(e) => handlePropertyChange('rotation', parseInt(e.target.value))} />
                                     </div>
                                 </div>
                             </div>
                         </div>
                    </FadeIn>
                ) : (
                    <div className="bg-white/5 rounded-xl p-6 text-center">
                        <p className="text-gray-400 text-sm mb-2">No Layer Selected</p>
                        <p className="text-xs text-gray-500">Click on an element in the canvas to edit its properties.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TattooEditor;
