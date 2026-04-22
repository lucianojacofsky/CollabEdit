import React, { useEffect, useRef, useState } from 'react';
import { 
  Canvas as FabricCanvas, 
  Rect, 
  Circle, 
  IText, 
  PencilBrush, 
  FabricImage, 
  util,
  BaseBrush
} from 'fabric';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { Square, Circle as CircleIcon, Type, Trash2, Download, Upload, Pencil, ChevronUp, ChevronDown, MousePointer2 } from 'lucide-react';
import { toast } from 'sonner';

interface CanvasProps {
  roomId: string;
  onMemberCountChange?: (count: number) => void;
}

const Canvas: React.FC<CanvasProps> = ({ roomId, onMemberCountChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<FabricCanvas | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const isRemoteUpdate = useRef(false);

  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#3B82F6'); // Blue 500
  const [hasSelection, setHasSelection] = useState(false);

  useEffect(() => {
    let socket: Socket;
    try {
      socket = io();
      socketRef.current = socket;
      socket.emit('join-room', roomId);
      socket.on('room-info', (data: { memberCount: number }) => {
        if (onMemberCountChange) onMemberCountChange(data.memberCount);
      });
    } catch (err) {
      console.error('Socket initialization failed:', err);
      toast.error('Connection error');
    }

    if (canvasRef.current) {
      try {
        const canvas = new FabricCanvas(canvasRef.current, {
          width: 800,
          height: 600,
          backgroundColor: '#ffffff',
        });
        fabricCanvas.current = canvas;

        socketRef.current?.on('canvas-change', (data: any) => {
          if (!fabricCanvas.current) return;
          isRemoteUpdate.current = true;

          const { action, objectData } = data;

          if (action === 'add') {
            util.enlivenObjects([objectData]).then((objects: any[]) => {
              objects.forEach((obj) => {
                const existing = fabricCanvas.current?.getObjects().find(o => (o as any).id === obj.id);
                if (!existing) {
                  fabricCanvas.current?.add(obj);
                }
              });
              fabricCanvas.current?.renderAll();
              isRemoteUpdate.current = false;
            }).catch(err => {
              console.error('Error enlivening objects:', err);
              isRemoteUpdate.current = false;
            });
          } else if (action === 'modify') {
            const existing = fabricCanvas.current.getObjects().find(o => (o as any).id === objectData.id);
            if (existing) {
              existing.set(objectData);
              fabricCanvas.current.renderAll();
            }
            isRemoteUpdate.current = false;
          } else if (action === 'remove') {
            const existing = fabricCanvas.current.getObjects().find(o => (o as any).id === objectData.id);
            if (existing) {
              fabricCanvas.current.remove(existing);
              fabricCanvas.current.renderAll();
            }
            isRemoteUpdate.current = false;
          } else if (action === 'clear') {
            fabricCanvas.current.clear();
            fabricCanvas.current.backgroundColor = '#ffffff';
            fabricCanvas.current.renderAll();
            isRemoteUpdate.current = false;
          } else if (action === 'bringToFront') {
            const existing = fabricCanvas.current.getObjects().find(o => (o as any).id === objectData.id);
            if (existing) {
              existing.bringToFront();
              fabricCanvas.current.renderAll();
            }
            isRemoteUpdate.current = false;
          } else if (action === 'sendToBack') {
            const existing = fabricCanvas.current.getObjects().find(o => (o as any).id === objectData.id);
            if (existing) {
              existing.sendToBack();
              fabricCanvas.current.renderAll();
            }
            isRemoteUpdate.current = false;
          }
        });

        const emitChange = (action: string, obj: any) => {
          if (isRemoteUpdate.current) return;
          if (!obj.id && action === 'add') {
              obj.id = uuidv4();
          }
          socketRef.current?.emit('canvas-change', {
            roomId,
            action,
            objectData: obj.toObject(['id']),
          });
        };

        canvas.on('object:added', (e) => {
          if (e.target) emitChange('add', e.target);
        });
        canvas.on('object:modified', (e) => {
          if (e.target) emitChange('modify', e.target);
        });
        canvas.on('object:removed', (e) => {
          if (e.target) emitChange('remove', e.target);
        });
        canvas.on('selection:created', () => setHasSelection(true));
        canvas.on('selection:cleared', () => setHasSelection(false));

        const handleResize = () => {
          if (!containerRef.current || !fabricCanvas.current) return;
          const width = containerRef.current.clientWidth;
          const scale = width / 800;
          if (scale < 1) {
            fabricCanvas.current.setDimensions({ width: 800 * scale, height: 600 * scale });
            fabricCanvas.current.setZoom(scale);
          } else {
            fabricCanvas.current.setDimensions({ width: 800, height: 600 });
            fabricCanvas.current.setZoom(1);
          }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
          window.removeEventListener('resize', handleResize);
          socketRef.current?.disconnect();
          fabricCanvas.current?.dispose();
        };
      } catch (err) {
        console.error('Fabric initialization failed:', err);
        toast.error('Canvas initialization error');
      }
    }
  }, [roomId, onMemberCountChange]);

  const addRect = () => {
    if (!fabricCanvas.current) return;
    const rect = new Rect({
      left: 100,
      top: 100,
      fill: selectedColor,
      width: 100,
      height: 100,
      id: uuidv4() as any,
    });
    fabricCanvas.current.add(rect);
  };

  const addCircle = () => {
    if (!fabricCanvas.current) return;
    const circle = new Circle({
      left: 200,
      top: 200,
      fill: selectedColor,
      radius: 50,
      id: uuidv4() as any,
    });
    fabricCanvas.current.add(circle);
  };

  const addText = () => {
    if (!fabricCanvas.current) return;
    const text = new IText('Hello :)', {
      left: 300,
      top: 300,
      fontSize: 24,
      fill: selectedColor,
      id: uuidv4() as any,
    });
    fabricCanvas.current.add(text);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas.current) return;
    const reader = new FileReader();
    reader.onload = async (f) => {
      const data = f.target?.result;
      if (typeof data !== 'string') return;
      try {
        const img = await FabricImage.fromURL(data);
        img.set({ left: 100, top: 100, id: uuidv4() as any });
        img.scaleToWidth(200);
        fabricCanvas.current?.add(img);
        fabricCanvas.current?.renderAll();
      } catch (err) {
        toast.error('Image processing error');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleDrawingMode = () => {
    if (!fabricCanvas.current) return;
    const newMode = !isDrawingMode;
    setIsDrawingMode(newMode);
    fabricCanvas.current.isDrawingMode = newMode;
    
    if (newMode) {
      fabricCanvas.current.freeDrawingBrush = new PencilBrush(fabricCanvas.current);
      fabricCanvas.current.freeDrawingBrush.width = 5;
      fabricCanvas.current.freeDrawingBrush.color = selectedColor;
      toast.info('Pencil tool active');
    } else {
      toast.info('Select tool active');
    }
  };

  const changeColor = (color: string) => {
    setSelectedColor(color);
    if (!fabricCanvas.current) return;
    if (fabricCanvas.current.isDrawingMode && fabricCanvas.current.freeDrawingBrush) {
      fabricCanvas.current.freeDrawingBrush.color = color;
    }
    const activeObjects = fabricCanvas.current.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => {
        obj.set({ fill: color });
        if (!isRemoteUpdate.current) {
          socketRef.current?.emit('canvas-change', {
            roomId,
            action: 'modify',
            objectData: obj.toObject(['id'])
          });
        }
      });
      fabricCanvas.current.renderAll();
    }
  };

  const bringToFront = () => {
    const activeObject = fabricCanvas.current?.getActiveObject();
    if (activeObject) {
      activeObject.bringToFront();
      fabricCanvas.current?.renderAll();
      socketRef.current?.emit('canvas-change', {
        roomId,
        action: 'bringToFront',
        objectData: (activeObject as any).toObject(['id'])
      });
    }
  };

  const sendToBack = () => {
    const activeObject = fabricCanvas.current?.getActiveObject();
    if (activeObject) {
      activeObject.sendToBack();
      fabricCanvas.current?.renderAll();
      socketRef.current?.emit('canvas-change', {
        roomId,
        action: 'sendToBack',
        objectData: (activeObject as any).toObject(['id'])
      });
    }
  };

  const deleteSelected = () => {
    const activeObjects = fabricCanvas.current?.getActiveObjects();
    if (activeObjects && activeObjects.length > 0) {
      activeObjects.forEach(obj => fabricCanvas.current?.remove(obj));
      fabricCanvas.current?.discardActiveObject();
      fabricCanvas.current?.renderAll();
      toast.success('Deleted selected objects');
    }
  };

  const saveAsPng = () => {
    if (!fabricCanvas.current) return;
    const dataURL = fabricCanvas.current.toDataURL({ format: 'png', quality: 1 });
    const link = document.createElement('a');
    link.download = `collab-edit-${roomId}.png`;
    link.href = dataURL;
    link.click();
    toast.success('Image saved as PNG!');
  };

  const clearCanvas = () => {
    if (!fabricCanvas.current) return;
    fabricCanvas.current.clear();
    fabricCanvas.current.backgroundColor = '#ffffff';
    socketRef.current?.emit('canvas-change', { roomId, action: 'clear' });
    toast.success('Canvas cleared');
  };

  const colors = ['#141414', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  return (
    <div className="flex flex-col items-center gap-6 p-4 w-full" ref={containerRef}>
      <div className="flex flex-wrap items-center justify-center gap-3 bg-white p-4 rounded-3xl shadow-xl border border-gray-100 backdrop-blur-sm sticky top-4 z-50">
        <div className="flex gap-1 border-r border-gray-100 pr-3">
          <button 
            onClick={() => isDrawingMode && toggleDrawingMode()}
            className={`p-3 rounded-xl transition-all active:scale-95 flex items-center gap-2 font-bold text-sm ${!isDrawingMode ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-400'}`}
            title="Select Mode"
          ><MousePointer2 size={18} /></button>
          <button 
            onClick={toggleDrawingMode}
            className={`p-3 rounded-xl transition-all active:scale-95 flex items-center gap-2 font-bold text-sm ${isDrawingMode ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-400'}`}
            title="Pencil Mode"
          ><Pencil size={18} /></button>
        </div>

        <div className="flex gap-2 border-r border-gray-100 pr-3">
          <button onClick={addRect} className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all active:scale-95" title="Rectangle"><Square size={18} /></button>
          <button onClick={addCircle} className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all active:scale-95" title="Circle"><CircleIcon size={18} /></button>
          <button onClick={addText} className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all active:scale-95" title="Text"><Type size={18} /></button>
        </div>

        <div className="flex items-center gap-1.5 border-r border-gray-100 pr-3">
          {colors.map(color => (
            <button
              key={color}
              onClick={() => changeColor(color)}
              className={`w-6 h-6 rounded-full transition-all hover:scale-125 active:scale-90 ${selectedColor === color ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {hasSelection && (
          <div className="flex gap-1 border-r border-gray-100 pr-3">
            <button onClick={bringToFront} className="p-3 hover:bg-gray-50 text-gray-600 rounded-xl" title="Bring to Front"><ChevronUp size={18} /></button>
            <button onClick={sendToBack} className="p-3 hover:bg-gray-50 text-gray-600 rounded-xl" title="Send to Back"><ChevronDown size={18} /></button>
            <button onClick={deleteSelected} className="p-3 hover:bg-red-50 text-red-500 rounded-xl" title="Delete"><Trash2 size={18} /></button>
          </div>
        )}

        <div className="flex gap-2">
          <label className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all active:scale-95 flex items-center gap-2 font-bold text-sm cursor-pointer" title="Upload Image">
            <Upload size={18} />
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
          <button onClick={saveAsPng} className="p-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all active:scale-95 flex items-center gap-2 font-bold text-sm" title="Export PNG"><Download size={18} /></button>
          <button onClick={clearCanvas} className="p-3 hover:bg-gray-100 text-gray-400 rounded-xl" title="Clear All"><Trash2 size={18} /></button>
        </div>
      </div>

      <div className="border-8 border-white rounded-[2rem] overflow-hidden shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] bg-white max-w-full">
        <canvas ref={canvasRef} className="max-w-full h-auto" />
      </div>
    </div>
  );
};

export default Canvas;
