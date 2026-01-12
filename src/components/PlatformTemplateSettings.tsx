import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  usePlatformTemplates, 
  defaultTemplates, 
  PlatformTemplate,
  PlatformTemplates 
} from '@/hooks/usePlatformTemplates';
import { PLATFORM_LABELS, Platform } from '@/types/listing';
import { RotateCcw, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const PlatformTemplateSettings = () => {
  const { templates, updateTemplate, resetToDefaults } = usePlatformTemplates();
  const [activeTab, setActiveTab] = useState<string>('poshmark');
  const [saving, setSaving] = useState(false);

  const platforms: (keyof PlatformTemplates)[] = ['poshmark', 'facebook', 'squarespace', 'generic'];

  const handleSave = async (platform: keyof PlatformTemplates, updates: Partial<PlatformTemplate>) => {
    setSaving(true);
    try {
      await updateTemplate(platform, updates);
      toast({ title: 'Template saved', description: `${platform === 'generic' ? 'Generic' : PLATFORM_LABELS[platform as Platform]} template updated.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save template.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    await resetToDefaults();
    toast({ title: 'Templates reset', description: 'All templates restored to defaults.' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Listing Templates</CardTitle>
            <CardDescription>
              Customize how listings are formatted for each platform
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="poshmark">Poshmark</TabsTrigger>
            <TabsTrigger value="facebook">Facebook</TabsTrigger>
            <TabsTrigger value="squarespace">Squarespace</TabsTrigger>
            <TabsTrigger value="generic">Generic</TabsTrigger>
          </TabsList>

          {platforms.map((platform) => (
            <TabsContent key={platform} value={platform} className="space-y-4 pt-4">
              <TemplateEditor
                platform={platform}
                template={templates[platform]}
                onSave={(updates) => handleSave(platform, updates)}
                saving={saving}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface TemplateEditorProps {
  platform: keyof PlatformTemplates;
  template: PlatformTemplate;
  onSave: (updates: Partial<PlatformTemplate>) => void;
  saving: boolean;
}

const TemplateEditor = ({ platform, template, onSave, saving }: TemplateEditorProps) => {
  const [localTemplate, setLocalTemplate] = useState<PlatformTemplate>(template);

  const handleChange = (field: keyof PlatformTemplate, value: string | boolean) => {
    setLocalTemplate(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(localTemplate);
  };

  // Update local state when template prop changes
  if (JSON.stringify(template) !== JSON.stringify(localTemplate) && !saving) {
    // Only sync if not currently saving
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Title Prefix</Label>
          <Input
            value={localTemplate.prefix}
            onChange={(e) => handleChange('prefix', e.target.value)}
            placeholder="e.g., 🔥 or NEW: "
          />
          <p className="text-xs text-muted-foreground">Added before the title</p>
        </div>

        <div className="space-y-2">
          <Label>Price Format</Label>
          <Input
            value={localTemplate.priceFormat}
            onChange={(e) => handleChange('priceFormat', e.target.value)}
            placeholder="e.g., 💰 Price: ${price}"
          />
          <p className="text-xs text-muted-foreground">Use {"${price}"} as placeholder</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Footer Text</Label>
        <Textarea
          value={localTemplate.suffix}
          onChange={(e) => handleChange('suffix', e.target.value)}
          placeholder="Text added at the end of every listing..."
          rows={3}
        />
        <p className="text-xs text-muted-foreground">Added after description and price</p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch
              checked={localTemplate.includeHashtags}
              onCheckedChange={(checked) => handleChange('includeHashtags', checked)}
            />
            <div>
              <Label>Include Hashtags</Label>
              <p className="text-xs text-muted-foreground">Auto-generate from title + custom</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={localTemplate.includeEmojis}
              onCheckedChange={(checked) => handleChange('includeEmojis', checked)}
            />
            <div>
              <Label>Use Emojis</Label>
              <p className="text-xs text-muted-foreground">Include emojis in formatting</p>
            </div>
          </div>
        </div>

        {localTemplate.includeHashtags && (
          <div className="flex-1 space-y-2 sm:max-w-xs">
            <Label>Custom Hashtags</Label>
            <Input
              value={localTemplate.customHashtags}
              onChange={(e) => handleChange('customHashtags', e.target.value)}
              placeholder="#forsale #shopsmall"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </div>
  );
};

export default PlatformTemplateSettings;
