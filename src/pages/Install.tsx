import PageHead from '@/components/PageHead';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Check, Share, MoreVertical, Plus, ArrowLeft } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHead title="Install StockSync | PWA Setup" description="Install StockSync as a Progressive Web App on iOS, Android, or desktop for fast, offline-ready inventory access." path="/install" />
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="flex h-14 items-center px-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-2xl px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <img src="/icon-192.png" alt="ListPro.AI" className="h-16 w-16 rounded-xl" />
          </div>
          <h1 className="text-3xl font-bold">Install ListPro.AI</h1>
          <p className="mt-2 text-muted-foreground">
            Get the full app experience on your device
          </p>
        </div>

        {/* Already Installed */}
        {isInstalled && (
          <Card className="mb-6 border-green-500/50 bg-green-500/10">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-green-600">App Installed!</p>
                <p className="text-sm text-muted-foreground">
                  ListPro.AI is ready to use from your home screen
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Install Button (Android/Desktop with prompt available) */}
        {deferredPrompt && !isInstalled && (
          <Card className="mb-6">
            <CardContent className="py-6">
              <Button 
                onClick={handleInstallClick} 
                size="lg" 
                className="w-full gap-2 text-lg"
              >
                <Download className="h-5 w-5" />
                Install App
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Why Install?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: 'Quick Access', desc: 'Launch directly from your home screen' },
              { title: 'Works Offline', desc: 'Access your inventory even without internet' },
              { title: 'Full Screen', desc: 'No browser UI for a native app experience' },
              { title: 'Fast & Smooth', desc: 'Optimized performance on your device' },
            ].map((benefit, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{benefit.title}</p>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* iOS Instructions */}
        {isIOS && !isInstalled && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Install on iPhone/iPad</CardTitle>
              <CardDescription>Follow these steps to add ListPro.AI to your home screen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <div className="flex items-center gap-2">
                  <p>Tap the <strong>Share</strong> button</p>
                  <Share className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </div>
                <div className="flex items-center gap-2">
                  <p>Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                  <Plus className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </div>
                <p>Tap <strong>"Add"</strong> to confirm</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Android Instructions (fallback if no prompt) */}
        {isAndroid && !deferredPrompt && !isInstalled && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Install on Android</CardTitle>
              <CardDescription>Follow these steps to add ListPro.AI to your home screen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <div className="flex items-center gap-2">
                  <p>Tap the <strong>menu</strong> button</p>
                  <MoreVertical className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </div>
                <div className="flex items-center gap-2">
                  <p>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></p>
                  <Download className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </div>
                <p>Tap <strong>"Install"</strong> to confirm</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Desktop Instructions */}
        {!isIOS && !isAndroid && !deferredPrompt && !isInstalled && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Install on Desktop</CardTitle>
              <CardDescription>Add ListPro.AI to your computer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <p>Look for the <strong>install icon</strong> in your browser's address bar</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </div>
                <p>Click <strong>"Install"</strong> when prompted</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back to App */}
        <div className="text-center">
          <Button variant="outline" asChild>
            <Link to="/">Continue to App</Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Install;
