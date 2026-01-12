import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Upload, Loader2, Scan, X, Library, Images, Plus, Trash2, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useProductLibrary } from '@/hooks/useProductLibrary';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface ProductDetails {
  title: string;
  category: string;
  description: string;
  suggestedPrice: number;
  brand: string | null;
  condition: string;
  color: string;
  keywords: string[];
  imageUrl?: string;
}

interface BatchImageAnalyzerProps {
  onProductsDetected: (products: ProductDetails[]) => void;
}

interface CapturedImage {
  id: string;
  dataUrl: string;
  status: 'pending' | 'analyzing' | 'success' | 'error';
  product?: ProductDetails;
  error?: string;
}

const BatchImageAnalyzer = ({ onProductsDetected }: BatchImageAnalyzerProps) => {
  const navigate = useNavigate();
  const { saveToLibrary } = useProductLibrary();
  const [open, setOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [saveToLib, setSaveToLib] = useState(true);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<'quick' | 'batch'>('quick');
  const [quickPreview, setQuickPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickFileInputRef = useRef<HTMLInputElement>(null);
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
    setCapturedImages([]);
    setQuickPreview(null);
    setProgress(0);
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

  // Quick mode: capture single photo
  const captureQuickPhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setQuickPreview(dataUrl);
      stopCamera();
    }
  };

  // Batch mode: capture and add to gallery
  const captureBatchPhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      addImage(dataUrl);
      toast({
        title: 'Photo captured!',
        description: `${capturedImages.length + 1} image(s) in gallery`,
      });
    }
  };

  const addImage = (dataUrl: string) => {
    const newImage: CapturedImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      dataUrl,
      status: 'pending',
    };
    setCapturedImages(prev => [...prev, newImage]);
  };

  const removeImage = (id: string) => {
    setCapturedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleQuickFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setQuickPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    if (quickFileInputRef.current) {
      quickFileInputRef.current.value = '';
    }
  };

  const handleBatchFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File',
          description: `${file.name} is not an image file.`,
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        addImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeImageUrl = async (imageUrl: string): Promise<ProductDetails | null> => {
    const { data, error } = await supabase.functions.invoke('analyze-product-image', {
      body: { imageUrl },
    });

    if (error) throw error;

    if (data && !data.error) {
      return {
        ...data,
        imageUrl,
      };
    } else {
      throw new Error(data?.error || 'Failed to analyze image');
    }
  };

  // Quick Scan: analyze single image and go to listing form
  const analyzeQuickImage = async () => {
    if (!quickPreview) return;

    setAnalyzing(true);
    try {
      const product = await analyzeImageUrl(quickPreview);
      
      if (product) {
        toast({
          title: 'Product Identified!',
          description: `Detected: ${product.title}`,
        });
        
        // Navigate to create listing with detected data including image
        const prefillData = {
          ...product,
          imageUrl: quickPreview,
        };
        handleClose();
        navigate(`/listings/new?prefill=${encodeURIComponent(JSON.stringify(prefillData))}`);
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

  // Batch Scan: analyze all images
  const analyzeAllImages = async () => {
    if (capturedImages.length === 0) return;

    setAnalyzing(true);
    setProgress(0);
    const products: ProductDetails[] = [];
    const total = capturedImages.length;

    for (let i = 0; i < capturedImages.length; i++) {
      const image = capturedImages[i];
      
      setCapturedImages(prev => 
        prev.map(img => 
          img.id === image.id ? { ...img, status: 'analyzing' as const } : img
        )
      );

      try {
        const product = await analyzeImageUrl(image.dataUrl);
        
        if (product) {
          if (saveToLib) {
            await saveToLibrary({
              title: product.title,
              description: product.description,
              category: product.category,
              suggested_price: product.suggestedPrice,
              brand: product.brand,
              condition: product.condition,
              color: product.color,
              keywords: product.keywords,
              image_url: product.imageUrl,
            });
          }

          products.push(product);
          
          setCapturedImages(prev => 
            prev.map(img => 
              img.id === image.id ? { ...img, status: 'success' as const, product } : img
            )
          );
        }
      } catch (error: any) {
        setCapturedImages(prev => 
          prev.map(img => 
            img.id === image.id ? { ...img, status: 'error' as const, error: error.message } : img
          )
        );
      }

      setProgress(((i + 1) / total) * 100);
      
      if (i < capturedImages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setAnalyzing(false);

    if (products.length > 0) {
      toast({
        title: 'Batch Analysis Complete!',
        description: `Successfully identified ${products.length} of ${total} products${saveToLib ? ' (saved to library)' : ''}`,
      });
      onProductsDetected(products);
      handleClose();
    } else {
      toast({
        title: 'Analysis Failed',
        description: 'Could not identify any products. Try clearer images.',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: CapturedImage['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'analyzing': return 'default';
      case 'success': return 'default';
      case 'error': return 'destructive';
    }
  };

  const getStatusText = (status: CapturedImage['status']) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'analyzing': return 'Analyzing...';
      case 'success': return 'Done';
      case 'error': return 'Failed';
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Product Scanner
          </DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'quick' | 'batch')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick" className="gap-2" disabled={analyzing}>
              <Zap className="h-4 w-4" />
              Quick Scan
            </TabsTrigger>
            <TabsTrigger value="batch" className="gap-2" disabled={analyzing}>
              <Images className="h-4 w-4" />
              Batch Scan
              {capturedImages.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {capturedImages.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Quick Scan Tab */}
          <TabsContent value="quick" className="space-y-4 mt-4">
            {/* Camera View for Quick Scan */}
            {cameraActive && mode === 'quick' && (
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  <Button type="button" variant="secondary" onClick={stopCamera}>
                    Cancel
                  </Button>
                  <Button type="button" className="gap-2" onClick={captureQuickPhoto}>
                    <Camera className="h-4 w-4" />
                    Capture
                  </Button>
                </div>
              </div>
            )}

            {/* Preview for Quick Scan */}
            {!cameraActive && quickPreview && (
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
                <img
                  src={quickPreview}
                  alt="Product preview"
                  className="h-full w-full object-contain"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute right-2 top-2"
                  onClick={() => setQuickPreview(null)}
                  disabled={analyzing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Empty State for Quick Scan */}
            {!cameraActive && !quickPreview && (
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted flex flex-col items-center justify-center gap-4 p-6 text-center">
                <Zap className="h-16 w-16 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Quick Scan
                  </p>
                  <p className="text-xs text-muted-foreground/75 mt-1">
                    Capture one image and create a listing instantly
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons for Quick Scan */}
            {!cameraActive && !quickPreview && !analyzing && (
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
                  onClick={() => quickFileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
                <input
                  ref={quickFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQuickFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Analyze Button for Quick Scan */}
            {quickPreview && !analyzing && (
              <Button
                type="button"
                className="w-full gap-2"
                onClick={analyzeQuickImage}
              >
                <Scan className="h-4 w-4" />
                Analyze & Create Listing
              </Button>
            )}

            {/* Analyzing State for Quick Scan */}
            {analyzing && mode === 'quick' && (
              <div className="flex flex-col items-center gap-2 py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing product...</p>
              </div>
            )}
          </TabsContent>

          {/* Batch Scan Tab */}
          <TabsContent value="batch" className="space-y-4 mt-4">
            {/* Camera View for Batch Scan */}
            {cameraActive && mode === 'batch' && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  <Button type="button" variant="secondary" onClick={stopCamera}>
                    Done
                  </Button>
                  <Button type="button" className="gap-2" onClick={captureBatchPhoto}>
                    <Camera className="h-4 w-4" />
                    Capture
                  </Button>
                </div>
              </div>
            )}

            {/* Image Gallery for Batch Scan */}
            {!cameraActive && capturedImages.length > 0 && (
              <ScrollArea className="h-[200px] rounded-lg border p-2">
                <div className="grid grid-cols-3 gap-2">
                  {capturedImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square overflow-hidden rounded-md bg-muted">
                        <img
                          src={image.dataUrl}
                          alt="Captured product"
                          className={`h-full w-full object-cover transition-opacity ${
                            image.status === 'analyzing' ? 'opacity-50' : ''
                          }`}
                        />
                        {image.status === 'analyzing' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        )}
                        {image.status === 'success' && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <Scan className="h-6 w-6 text-green-600" />
                          </div>
                        )}
                        {image.status === 'error' && (
                          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                            <X className="h-6 w-6 text-red-600" />
                          </div>
                        )}
                      </div>
                      {!analyzing && (
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -right-1 -top-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(image.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      <Badge 
                        variant={getStatusColor(image.status)} 
                        className="absolute bottom-1 left-1 text-[10px] px-1 py-0"
                      >
                        {getStatusText(image.status)}
                      </Badge>
                    </div>
                  ))}
                  {!analyzing && (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex items-center justify-center transition-colors"
                    >
                      <Plus className="h-6 w-6 text-muted-foreground/50" />
                    </button>
                  )}
                </div>
              </ScrollArea>
            )}

            {/* Empty State for Batch Scan */}
            {!cameraActive && capturedImages.length === 0 && (
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted flex flex-col items-center justify-center gap-4 p-6 text-center">
                <Images className="h-16 w-16 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Batch Scan
                  </p>
                  <p className="text-xs text-muted-foreground/75 mt-1">
                    Capture multiple products and save them all to your library
                  </p>
                </div>
              </div>
            )}

            {/* Progress Bar for Batch Scan */}
            {analyzing && mode === 'batch' && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  Analyzing {Math.round(progress)}% complete...
                </p>
              </div>
            )}

            {/* Action Buttons for Batch Scan */}
            {!cameraActive && !analyzing && (
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
                  multiple
                  onChange={handleBatchFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Analyze Button for Batch Scan */}
            {!cameraActive && capturedImages.length > 0 && !analyzing && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="batch-save-to-library" 
                    checked={saveToLib}
                    onCheckedChange={(checked) => setSaveToLib(checked as boolean)}
                  />
                  <Label htmlFor="batch-save-to-library" className="flex items-center gap-1 text-sm">
                    <Library className="h-3 w-3" />
                    Save all to library
                  </Label>
                </div>
                <Button
                  type="button"
                  className="w-full gap-2"
                  onClick={analyzeAllImages}
                >
                  <Scan className="h-4 w-4" />
                  Analyze {capturedImages.length} Image{capturedImages.length !== 1 ? 's' : ''}
                </Button>
              </div>
            )}

            {/* Analyzing State for Batch Scan */}
            {analyzing && mode === 'batch' && (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processing images...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BatchImageAnalyzer;
