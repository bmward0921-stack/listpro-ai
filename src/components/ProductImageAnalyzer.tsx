import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Upload, Loader2, Scan, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProductDetails {
  title: string;
  category: string;
  description: string;
  suggestedPrice: number;
  brand: string | null;
  condition: string;
  color: string;
  keywords: string[];
}

interface ProductImageAnalyzerProps {
  onProductDetected: (details: ProductDetails) => void;
}

const ProductImageAnalyzer = ({ onProductDetected }: ProductImageAnalyzerProps) => {
  const [open, setOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleClose = () => {
    stopCamera();
    setPreviewUrl(null);
    setOpen(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: 'Camera Access Denied',
        description: 'Please allow camera access to use this feature.',
        variant: 'destructive',
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPreviewUrl(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!previewUrl) return;

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-product-image', {
        body: { imageUrl: previewUrl },
      });

      if (error) throw error;

      if (data && !data.error) {
        onProductDetected(data);
        toast({
          title: 'Product Identified!',
          description: `Detected: ${data.title}`,
        });
        handleClose();
      } else {
        throw new Error(data?.error || 'Failed to analyze image');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Could not identify product. Try a clearer image.',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          <Scan className="h-4 w-4" />
          Smart Scan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Product Image Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera/Preview Area */}
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            ) : previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Product preview"
                  className="h-full w-full object-contain"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute right-2 top-2"
                  onClick={() => setPreviewUrl(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                <Scan className="h-16 w-16 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Take a photo or upload an image to identify your product
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!previewUrl && !cameraActive && (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2"
                onClick={startCamera}
              >
                <Camera className="h-4 w-4" />
                Camera
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {cameraActive && (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={stopCamera}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 gap-2"
                onClick={capturePhoto}
              >
                <Camera className="h-4 w-4" />
                Capture
              </Button>
            </div>
          )}

          {previewUrl && !analyzing && (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setPreviewUrl(null)}
              >
                Retake
              </Button>
              <Button
                type="button"
                className="flex-1 gap-2"
                onClick={analyzeImage}
              >
                <Scan className="h-4 w-4" />
                Analyze
              </Button>
            </div>
          )}

          {analyzing && (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing product...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImageAnalyzer;
