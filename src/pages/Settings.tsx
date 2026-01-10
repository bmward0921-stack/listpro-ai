import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Save, Building2, Bell, Palette, Shield, Users } from 'lucide-react';
import { PLATFORM_LABELS, Platform } from '@/types/listing';

// Settings stored in localStorage for demo - in production, store in Appwrite
const SETTINGS_KEY = 'listinghub_settings';

interface TeamSettings {
  teamName: string;
  defaultPlatforms: Platform[];
  currency: string;
  notifications: {
    emailOnSale: boolean;
    emailOnNewListing: boolean;
    dailyDigest: boolean;
  };
  appearance: {
    compactView: boolean;
    showProfitMargins: boolean;
  };
}

const defaultSettings: TeamSettings = {
  teamName: 'My Team',
  defaultPlatforms: ['facebook', 'poshmark'],
  currency: 'USD',
  notifications: {
    emailOnSale: true,
    emailOnNewListing: false,
    dailyDigest: true,
  },
  appearance: {
    compactView: false,
    showProfitMargins: true,
  },
};

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<TeamSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse settings');
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      toast({ title: 'Settings saved', description: 'Your preferences have been updated.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const togglePlatform = (platform: Platform) => {
    setSettings(prev => ({
      ...prev,
      defaultPlatforms: prev.defaultPlatforms.includes(platform)
        ? prev.defaultPlatforms.filter(p => p !== platform)
        : [...prev.defaultPlatforms, platform],
    }));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your team preferences and configuration
        </p>
      </div>

      {/* Team Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Team Settings</CardTitle>
          </div>
          <CardDescription>
            Configure your team name and default settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              value={settings.teamName}
              onChange={(e) => setSettings({ ...settings, teamName: e.target.value })}
              placeholder="Enter team name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={settings.currency}
              onValueChange={(v) => setSettings({ ...settings, currency: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="CAD">CAD ($)</SelectItem>
                <SelectItem value="AUD">AUD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Default Platforms</Label>
            <p className="text-sm text-muted-foreground">
              These platforms will be pre-selected when creating new listings
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(PLATFORM_LABELS) as [Platform, string][]).map(([platform, label]) => (
                <Button
                  key={platform}
                  type="button"
                  variant={settings.defaultPlatforms.includes(platform) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => togglePlatform(platform)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure how you want to be notified about activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email on Sale</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when an item is marked as sold
              </p>
            </div>
            <Switch
              checked={settings.notifications.emailOnSale}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, emailOnSale: checked },
                })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email on New Listing</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a team member creates a listing
              </p>
            </div>
            <Switch
              checked={settings.notifications.emailOnNewListing}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, emailOnNewListing: checked },
                })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Daily Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a daily summary of activity
              </p>
            </div>
            <Switch
              checked={settings.notifications.dailyDigest}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, dailyDigest: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Customize how information is displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compact View</Label>
              <p className="text-sm text-muted-foreground">
                Show more listings in less space
              </p>
            </div>
            <Switch
              checked={settings.appearance.compactView}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  appearance: { ...settings.appearance, compactView: checked },
                })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Profit Margins</Label>
              <p className="text-sm text-muted-foreground">
                Display profit calculations on listings
              </p>
            </div>
            <Switch
              checked={settings.appearance.showProfitMargins}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  appearance: { ...settings.appearance, showProfitMargins: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Team Members Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Team Members</CardTitle>
          </div>
          <CardDescription>
            Manage who has access to this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Team Management</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  To add or remove team members, manage their accounts in your Appwrite console.
                  Only pre-approved email addresses can access this application.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Current user: <span className="font-medium text-foreground">{user?.email}</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
