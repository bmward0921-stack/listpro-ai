import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, FabricImage } from 'fabric';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RotateCw, RotateCcw, Crop, Check, X, FlipHorizontal, FlipVertical, ZoomIn, ZoomOut, Undo2, Redo2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
}

interface HistoryState {
  dataUrl: string;
  rotation: number;
}

const MAX_HISTORY = 20;

const ImageEditor = ({ imageUrl, onSave, onCancel }: ImageEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [fabricImage, setFabricImage] = useState<FabricImage | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  
  // History state for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isRestoringRef = useRef(false);

  // Check if undo/redo is available
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Save current state to history
  const saveToHistory = useCallback(() => {
    if (!fabricCanvas || isRestoringRef.current) return;

    const dataUrl = fabricCanvas.toDataURL({
      format: 'jpeg',
      quality: 0.8,
      multiplier: 1,
    });

    const newState: HistoryState = {
      dataUrl,
      rotation,
    };

    setHistory(prev => {
      // Remove any future states if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        return newHistory.slice(-MAX_HISTORY);
      }
      return newHistory;
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [fabricCanvas, rotation, historyIndex]);

  // Restore state from history
  const restoreFromHistory = useCallback((state: HistoryState) => {
    if (!fabricCanvas) return;

    isRestoringRef.current = true;

    FabricImage.fromURL(state.dataUrl, { crossOrigin: 'anonymous' }).then((img) => {
      const canvasWidth = fabricCanvas.width!;
      const canvasHeight = fabricCanvas.height!;

      const scale = Math.min(
        (canvasWidth * 0.9) / img.width!,
        (canvasHeight * 0.9) / img.height!
      );

      img.scale(scale);
      img.set({
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      });

      fabricCanvas.clear();
      fabricCanvas.add(img);
      fabricCanvas.renderAll();
      setFabricImage(img);
      setRotation(state.rotation);
      
      // Exit crop mode if active
      setIsCropping(false);
      setCropRect(null);

      isRestoringRef.current = false;
    });
  }, [fabricCanvas]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    restoreFromHistory(history[newIndex]);
    
    toast({
      title: 'Undo',
      description: 'Reverted to previous state',
    });
  }, [canUndo, history, historyIndex, restoreFromHistory]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    restoreFromHistory(history[newIndex]);
    
    toast({
      title: 'Redo',
      description: 'Restored next state',
    });
  }, [canRedo, history, historyIndex, restoreFromHistory]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl (Windows/Linux) or Cmd (Mac) is pressed
      const isModifierPressed = e.ctrlKey || e.metaKey;
      
      if (!isModifierPressed) return;

      // Undo: Ctrl+Z or Cmd+Z
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          restoreFromHistory(history[newIndex]);
          toast({
            title: 'Undo',
            description: 'Reverted to previous state (Ctrl+Z)',
          });
        }
      }
      
      // Redo: Ctrl+Y or Cmd+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        if (canRedo) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          restoreFromHistory(history[newIndex]);
          toast({
            title: 'Redo',
            description: 'Restored next state (Ctrl+Y)',
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, history, historyIndex, restoreFromHistory]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const canvasSize = Math.min(containerWidth, 400);

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasSize,
      height: canvasSize,
      backgroundColor: '#f3f4f6',
      selection: false,
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  // Load image and save initial state
  useEffect(() => {
    if (!fabricCanvas) return;

    FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' }).then((img) => {
      const canvasWidth = fabricCanvas.width!;
      const canvasHeight = fabricCanvas.height!;

      const scale = Math.min(
        (canvasWidth * 0.9) / img.width!,
        (canvasHeight * 0.9) / img.height!
      );

      img.scale(scale);
      img.set({
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      });

      fabricCanvas.clear();
      fabricCanvas.add(img);
      fabricCanvas.renderAll();
      setFabricImage(img);

      // Save initial state to history
      const dataUrl = fabricCanvas.toDataURL({
        format: 'jpeg',
        quality: 0.8,
        multiplier: 1,
      });
      
      setHistory([{ dataUrl, rotation: 0 }]);
      setHistoryIndex(0);
    });
  }, [fabricCanvas, imageUrl]);

  // Rotate image
  const handleRotate = useCallback((degrees: number) => {
    if (!fabricImage || !fabricCanvas) return;
    
    const newRotation = rotation + degrees;
    setRotation(newRotation);
    fabricImage.rotate(newRotation);
    fabricCanvas.renderAll();
    
    // Save to history after rotation
    setTimeout(() => saveToHistory(), 50);
  }, [fabricCanvas, fabricImage, rotation, saveToHistory]);

  // Flip image
  const handleFlipHorizontal = useCallback(() => {
    if (!fabricImage || !fabricCanvas) return;
    fabricImage.set('flipX', !fabricImage.flipX);
    fabricCanvas.renderAll();
    saveToHistory();
  }, [fabricCanvas, fabricImage, saveToHistory]);

  const handleFlipVertical = useCallback(() => {
    if (!fabricImage || !fabricCanvas) return;
    fabricImage.set('flipY', !fabricImage.flipY);
    fabricCanvas.renderAll();
    saveToHistory();
  }, [fabricCanvas, fabricImage, saveToHistory]);

  // Zoom
  const handleZoom = useCallback((factor: number) => {
    if (!fabricImage || !fabricCanvas) return;
    const currentScale = fabricImage.scaleX || 1;
    const newScale = Math.max(0.1, Math.min(3, currentScale * factor));
    fabricImage.scale(newScale);
    fabricCanvas.renderAll();
    saveToHistory();
  }, [fabricCanvas, fabricImage, saveToHistory]);

  // Toggle crop mode
  const toggleCropMode = useCallback(() => {
    if (!fabricCanvas || !fabricImage) return;

    if (isCropping) {
      // Exit crop mode
      setIsCropping(false);
      setCropRect(null);
      fabricCanvas.discardActiveObject();
      
      // Remove crop rectangle
      const objects = fabricCanvas.getObjects();
      const cropSelection = objects.find(obj => obj.stroke === '#3b82f6');
      if (cropSelection) {
        fabricCanvas.remove(cropSelection);
      }
      
      fabricCanvas.renderAll();
    } else {
      // Enter crop mode - create crop overlay
      setIsCropping(true);
      
      // Create a rectangle for crop selection
      const { Rect } = require('fabric');
      const canvasWidth = fabricCanvas.width!;
      const canvasHeight = fabricCanvas.height!;
      
      const cropSelection = new Rect({
        left: canvasWidth * 0.15,
        top: canvasHeight * 0.15,
        width: canvasWidth * 0.7,
        height: canvasHeight * 0.7,
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        cornerColor: '#3b82f6',
        cornerStrokeColor: '#fff',
        cornerSize: 12,
        transparentCorners: false,
        hasRotatingPoint: false,
        lockRotation: true,
      });

      fabricCanvas.add(cropSelection);
      fabricCanvas.setActiveObject(cropSelection);
      fabricCanvas.renderAll();

      cropSelection.on('modified', () => {
        setCropRect({
          left: cropSelection.left!,
          top: cropSelection.top!,
          width: cropSelection.width! * cropSelection.scaleX!,
          height: cropSelection.height! * cropSelection.scaleY!,
        });
      });

      setCropRect({
        left: cropSelection.left!,
        top: cropSelection.top!,
        width: cropSelection.width!,
        height: cropSelection.height!,
      });
    }
  }, [fabricCanvas, fabricImage, isCropping]);

  // Apply crop
  const applyCrop = useCallback(() => {
    if (!fabricCanvas || !cropRect) return;

    // Get the cropped area as data URL
    const dataUrl = fabricCanvas.toDataURL({
      left: cropRect.left,
      top: cropRect.top,
      width: cropRect.width,
      height: cropRect.height,
      format: 'jpeg',
      quality: 0.9,
      multiplier: 1,
    });

    // Load cropped image back
    FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' }).then((img) => {
      const canvasWidth = fabricCanvas.width!;
      const canvasHeight = fabricCanvas.height!;

      const scale = Math.min(
        (canvasWidth * 0.9) / img.width!,
        (canvasHeight * 0.9) / img.height!
      );

      img.scale(scale);
      img.set({
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      });

      fabricCanvas.clear();
      fabricCanvas.add(img);
      fabricCanvas.renderAll();
      setFabricImage(img);
      setIsCropping(false);
      setCropRect(null);
      setRotation(0);
      
      // Save to history after crop
      setTimeout(() => saveToHistory(), 50);
    });
  }, [fabricCanvas, cropRect, saveToHistory]);

  // Handle rotation slider change with debounced history save
  const rotationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleSliderRotation = useCallback((value: number) => {
    if (!fabricImage || !fabricCanvas) return;
    setRotation(value);
    fabricImage.rotate(value);
    fabricCanvas.renderAll();
    
    // Debounce history save for slider
    if (rotationTimeoutRef.current) {
      clearTimeout(rotationTimeoutRef.current);
    }
    rotationTimeoutRef.current = setTimeout(() => {
      saveToHistory();
    }, 300);
  }, [fabricCanvas, fabricImage, saveToHistory]);

  // Save edited image
  const handleSave = useCallback(() => {
    if (!fabricCanvas) return;

    // Remove crop selection if present
    const objects = fabricCanvas.getObjects();
    const cropSelection = objects.find(obj => obj.stroke === '#3b82f6');
    if (cropSelection) {
      fabricCanvas.remove(cropSelection);
    }

    const dataUrl = fabricCanvas.toDataURL({
      format: 'jpeg',
      quality: 0.9,
      multiplier: 1,
    });

    onSave(dataUrl);
  }, [fabricCanvas, onSave]);

  return (
    <div className="space-y-4">
      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex items-center justify-center bg-muted rounded-lg overflow-hidden"
      >
        <canvas ref={canvasRef} />
      </div>

      {/* Rotation Slider */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Rotation: {rotation}°</Label>
        <Slider
          value={[rotation]}
          onValueChange={([value]) => handleSliderRotation(value)}
          min={-180}
          max={180}
          step={1}
          className="w-full"
        />
      </div>

      {/* Tool Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Undo/Redo */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleRotate(-90)}
          title="Rotate Left"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleRotate(90)}
          title="Rotate Right"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFlipHorizontal}
          title="Flip Horizontal"
        >
          <FlipHorizontal className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFlipVertical}
          title="Flip Vertical"
        >
          <FlipVertical className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleZoom(1.2)}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleZoom(0.8)}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={isCropping ? "default" : "outline"}
          size="sm"
          onClick={toggleCropMode}
          title="Crop"
        >
          <Crop className="h-4 w-4" />
        </Button>
      </div>

      {/* History indicator */}
      <div className="text-xs text-muted-foreground text-center">
        History: {historyIndex + 1} / {history.length}
      </div>

      {/* Crop Apply Button */}
      {isCropping && cropRect && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full gap-2"
          onClick={applyCrop}
        >
          <Crop className="h-4 w-4" />
          Apply Crop
        </Button>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button
          type="button"
          className="flex-1 gap-2"
          onClick={handleSave}
        >
          <Check className="h-4 w-4" />
          Done
        </Button>
      </div>
    </div>
  );
};

export default ImageEditor;
