import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, AlertCircle, CheckCircle2, Sparkles, ArrowRight, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { login, signup, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  const error = localError || authError;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');
    clearError();
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setLocalError(result.error || 'Login failed');
    }
    
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');
    clearError();

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    const result = await signup(email, password, name);
    
    if (result.success) {
      navigate('/');
    } else {
      setLocalError(result.error || 'Signup failed');
    }
    
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLocalError('');
    clearError();
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    
    if (error) {
      setLocalError(error.message);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-primary/20 to-slate-900 p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 animate-pulse rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 animate-pulse rounded-full bg-info/20 blur-3xl" style={{ animationDelay: '1s' }} />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-success/10 blur-3xl" style={{ animationDelay: '2s' }} />
        
        {/* Floating particles */}
        <div className="absolute left-[10%] top-[20%] h-2 w-2 animate-bounce rounded-full bg-primary/40" style={{ animationDuration: '3s' }} />
        <div className="absolute left-[80%] top-[30%] h-3 w-3 animate-bounce rounded-full bg-info/40" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
        <div className="absolute left-[20%] top-[70%] h-2 w-2 animate-bounce rounded-full bg-success/40" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
        <div className="absolute left-[70%] top-[80%] h-3 w-3 animate-bounce rounded-full bg-primary/40" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }} />
      </div>

      {/* Main popup card */}
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Glass morphism card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur-xl">
          {/* Inner glow border */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-info/20 opacity-50" />
          
          {/* Content container */}
          <div className="relative rounded-[22px] bg-background/95 p-6 sm:p-8">
            {/* Close button (decorative) */}
            <button 
              onClick={() => navigate('/')} 
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header with logo and sparkles */}
            <div className="mb-8 text-center">
              <div className="relative mx-auto mb-4 inline-flex">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/25">
                  <Package className="h-10 w-10 text-primary-foreground" />
                </div>
                <Sparkles className="absolute -right-2 -top-2 h-6 w-6 animate-pulse text-info" />
              </div>
              <h1 className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                StockSync
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage your multi-platform listings
              </p>
            </div>

            {/* Sign-in only — public registration is disabled. Admins provision accounts via the backend. */}
            <Tabs value="login" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-1 rounded-xl bg-muted/50 p-1">
                <TabsTrigger
                  value="login"
                  className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Sign In
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="h-11 rounded-xl border-border/50 bg-muted/30 transition-all focus:border-primary focus:bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="h-11 rounded-xl border-border/50 bg-muted/30 transition-all focus:border-primary focus:bg-background"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="group h-11 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 font-medium shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Sign in
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or continue with</span>
                  </div>
                </div>

                {/* Google Sign-In */}
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-xl border-border/50 bg-muted/30 font-medium transition-all hover:bg-muted/50"
                  onClick={handleGoogleSignIn}
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Access limited to authorized team members.
                <br />
                <span className="text-muted-foreground/70">Contact admin for access.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
