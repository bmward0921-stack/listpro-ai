import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Save, 
  DollarSign, 
  Tags, 
  Shield, 
  Database,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  Users,
  Eye,
  Edit,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PLATFORM_LABELS, Platform, CATEGORIES } from '@/types/listing';
import { useListings } from '@/hooks/useListings';

// Admin settings stored in localStorage
const ADMIN_SETTINGS_KEY = 'listinghub_admin_settings';

interface PlatformFee {
  platform: Platform;
  feePercent: number;
  flatFee: number;
}

interface TaxSettings {
  enabled: boolean;
  rate: number;
  includedInPrice: boolean;
}

interface UserAccess {
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  addedAt: string;
}

interface AdminSettings {
  platformFees: PlatformFee[];
  tax: TaxSettings;
  categories: string[];
  userAccess: UserAccess[];
}

const defaultAdminSettings: AdminSettings = {
  platformFees: [
    { platform: 'facebook', feePercent: 5, flatFee: 0 },
    { platform: 'poshmark', feePercent: 20, flatFee: 0 },
    { platform: 'squarespace', feePercent: 3, flatFee: 0.30 },
  ],
  tax: {
    enabled: false,
    rate: 0,
    includedInPrice: false,
  },
  categories: [...CATEGORIES],
  userAccess: [],
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin (Full Access)',
  editor: 'Editor (Create/Edit)',
  viewer: 'Viewer (Read Only)',
};

const AdminSettings = () => {
  const { user } = useAuth();
  const { listings } = useListings();
  const [settings, setSettings] = useState<AdminSettings>(defaultAdminSettings);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ index: number; value: string } | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_SETTINGS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultAdminSettings, ...parsed });
      } catch (e) {
        console.error('Failed to parse admin settings');
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
      toast({ title: 'Settings saved', description: 'Admin settings have been updated.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updatePlatformFee = (platform: Platform, field: 'feePercent' | 'flatFee', value: number) => {
    setSettings(prev => ({
      ...prev,
      platformFees: prev.platformFees.map(pf =>
        pf.platform === platform ? { ...pf, [field]: value } : pf
      ),
    }));
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    if (settings.categories.includes(newCategory.trim())) {
      toast({ title: 'Error', description: 'Category already exists.', variant: 'destructive' });
      return;
    }
    setSettings(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory.trim()],
    }));
    setNewCategory('');
    setCategoryDialogOpen(false);
    toast({ title: 'Category added', description: `"${newCategory.trim()}" has been added.` });
  };

  const updateCategory = () => {
    if (!editingCategory || !editingCategory.value.trim()) return;
    const newValue = editingCategory.value.trim();
    if (settings.categories.some((c, i) => c === newValue && i !== editingCategory.index)) {
      toast({ title: 'Error', description: 'Category already exists.', variant: 'destructive' });
      return;
    }
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.map((c, i) => 
        i === editingCategory.index ? newValue : c
      ),
    }));
    setEditingCategory(null);
  };

  const deleteCategory = (index: number) => {
    const categoryName = settings.categories[index];
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index),
    }));
    toast({ title: 'Category deleted', description: `"${categoryName}" has been removed.` });
  };

  const addUser = () => {
    if (!newUserEmail.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail.trim())) {
      toast({ title: 'Error', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }
    if (settings.userAccess.some(u => u.email === newUserEmail.trim())) {
      toast({ title: 'Error', description: 'User already has access.', variant: 'destructive' });
      return;
    }
    setSettings(prev => ({
      ...prev,
      userAccess: [...prev.userAccess, {
        email: newUserEmail.trim(),
        role: newUserRole,
        addedAt: new Date().toISOString(),
      }],
    }));
    setNewUserEmail('');
    setNewUserRole('viewer');
    setUserDialogOpen(false);
    toast({ title: 'User added', description: `${newUserEmail.trim()} now has ${newUserRole} access.` });
  };

  const updateUserRole = (email: string, role: 'admin' | 'editor' | 'viewer') => {
    setSettings(prev => ({
      ...prev,
      userAccess: prev.userAccess.map(u =>
        u.email === email ? { ...u, role } : u
      ),
    }));
  };

  const removeUser = (email: string) => {
    setSettings(prev => ({
      ...prev,
      userAccess: prev.userAccess.filter(u => u.email !== email),
    }));
    toast({ title: 'User removed', description: `${email} no longer has access.` });
  };

  const exportListings = () => {
    const dataStr = JSON.stringify(listings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `listings-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Export complete', description: `Exported ${listings.length} listings.` });
  };

  const exportAsCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'Cost Price', 'Quantity', 'SKU', 'Platforms', 'Created At'];
    const rows = listings.map(l => [
      l.id,
      `"${l.title.replace(/"/g, '""')}"`,
      l.category,
      l.costPrice,
      l.quantity,
      l.sku || '',
      l.platforms.map(p => p.platform).join(';'),
      l.created_at,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `listings-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'CSV Export complete', description: `Exported ${listings.length} listings.` });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/settings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Configure platform fees, categories, and access control
          </p>
        </div>
      </div>

      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="platform" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Platform & Tax</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Access</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
        </TabsList>

        {/* Platform Fees & Tax */}
        <TabsContent value="platform" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Fees</CardTitle>
              <CardDescription>
                Configure selling fees for each platform to calculate accurate profits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.platformFees.map((pf) => (
                <div key={pf.platform} className="flex items-center gap-4 rounded-lg border border-border p-4">
                  <div className="flex-1">
                    <Label className="text-base font-medium">{PLATFORM_LABELS[pf.platform]}</Label>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Fee %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-20"
                        value={pf.feePercent}
                        onChange={(e) => updatePlatformFee(pf.platform, 'feePercent', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Flat Fee ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-20"
                        value={pf.flatFee}
                        onChange={(e) => updatePlatformFee(pf.platform, 'flatFee', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>
                Configure tax calculation for your listings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Tax Calculation</Label>
                  <p className="text-sm text-muted-foreground">
                    Apply tax rate to all sales
                  </p>
                </div>
                <Switch
                  checked={settings.tax.enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, tax: { ...settings.tax, enabled: checked } })
                  }
                />
              </div>

              {settings.tax.enabled && (
                <>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={settings.tax.rate}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            tax: { ...settings.tax, rate: parseFloat(e.target.value) || 0 },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div className="space-y-0.5">
                        <Label>Tax Included in Price</Label>
                        <p className="text-xs text-muted-foreground">
                          Prices already include tax
                        </p>
                      </div>
                      <Switch
                        checked={settings.tax.includedInPrice}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            tax: { ...settings.tax, includedInPrice: checked },
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Product Categories</CardTitle>
                <CardDescription>
                  Manage categories available for listings
                </CardDescription>
              </div>
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>
                      Enter a name for the new product category
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="newCategory">Category Name</Label>
                      <Input
                        id="newCategory"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="e.g., Jewelry"
                        onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addCategory}>Add Category</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.categories.map((category, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {editingCategory?.index === index ? (
                          <Input
                            value={editingCategory.value}
                            onChange={(e) => setEditingCategory({ index, value: e.target.value })}
                            onBlur={updateCategory}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') updateCategory();
                              if (e.key === 'Escape') setEditingCategory(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          category
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingCategory({ index, value: category })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCategory(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Control */}
        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Access</CardTitle>
              <CardDescription>
                Roles are enforced server-side via the database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Current Admin</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email} (You)
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-5 w-5 text-destructive" />
                  <div className="space-y-1">
                    <p className="font-medium">Access is managed in the backend</p>
                    <p className="text-sm text-muted-foreground">
                      User roles (admin, editor, viewer) are stored in the
                      <code className="mx-1 rounded bg-muted px-1">user_roles</code>
                      table and enforced by row-level security. To grant or
                      revoke access for a team member, update their row in the
                      backend — adding emails here would be cosmetic only and
                      would not change actual permissions.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>
                Download your listings data in various formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Button variant="outline" className="h-auto py-4" onClick={exportListings}>
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Export as JSON</p>
                      <p className="text-xs text-muted-foreground">
                        Full data with all fields
                      </p>
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4" onClick={exportAsCSV}>
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Export as CSV</p>
                      <p className="text-xs text-muted-foreground">
                        Spreadsheet compatible
                      </p>
                    </div>
                  </div>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {listings.length} listings available for export
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>
                Import listings from a file (coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="h-auto py-4 w-full" disabled>
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">Import Listings</p>
                    <p className="text-xs text-muted-foreground">
                      Coming soon - Import from JSON or CSV
                    </p>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Statistics</CardTitle>
              <CardDescription>
                Overview of your stored data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border p-4 text-center">
                  <p className="text-2xl font-bold">{listings.length}</p>
                  <p className="text-sm text-muted-foreground">Total Listings</p>
                </div>
                <div className="rounded-lg border border-border p-4 text-center">
                  <p className="text-2xl font-bold">{settings.categories.length}</p>
                  <p className="text-sm text-muted-foreground">Categories</p>
                </div>
                <div className="rounded-lg border border-border p-4 text-center">
                  <p className="text-2xl font-bold">{settings.userAccess.length + 1}</p>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
