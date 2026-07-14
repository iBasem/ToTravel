import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Alert, AlertDescription } from '@/ui/alert';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from "react-i18next";

export default function AdminAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(t('adminAuth.invalidCredentials', 'Invalid credentials. Access denied.'));
        setLoading(false);
        return;
      }

      // Small delay to allow auth state to update
      setTimeout(() => {
        toast.success(t('adminAuth.accessGranted', 'Admin access granted'));
        navigate('/admin');
      }, 500);
    } catch (err) {
      setError(t('common.authError', 'Authentication failed. Please try again.'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{t('adminAuth.title', 'Admin Access')}</CardTitle>
            <CardDescription>
              {t('adminAuth.subtitle', 'Restricted access. Authorized personnel only.')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t('common.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('common.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                dir="ltr"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                  {t('common.processing')}
                </>
              ) : (
                t('common.signIn')
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t('adminAuth.footer1', 'This portal is for authorized administrators only.')}
            <br />
            {t('adminAuth.footer2', 'Unauthorized access attempts are logged.')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
