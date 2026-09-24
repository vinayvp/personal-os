import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Star, StarOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/appClient";
import { useToast } from "@/hooks/use-toast";

export interface Platform {
  id: string;
  name: string;
  url_template: string;
  enabled: boolean;
  is_default: boolean;
}

interface PlatformsModalProps {
  isOpen: boolean;
  onClose: () => void;
  platforms: Platform[];
  onPlatformsChanged: () => void;
}

const PlatformsModal: React.FC<PlatformsModalProps> = ({ isOpen, onClose, platforms, onPlatformsChanged }) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [urlTemplate, setUrlTemplate] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setUrlTemplate('');
    }
  }, [isOpen]);

  const handleAdd = async () => {
    if (!name.trim() || !urlTemplate.trim()) {
      toast({ title: "Missing fields", description: "Name and URL template are required.", variant: "destructive" });
      return;
    }
    if (!urlTemplate.includes('{query}')) {
      toast({ title: "Invalid URL template", description: "Template must contain {query}.", variant: "destructive" });
      return;
    }
    setAdding(true);
    try {
      const { error } = await supabase.from('movies_platforms').insert({
        name: name.trim(),
        url_template: urlTemplate.trim(),
        enabled: true,
        is_default: platforms.length === 0,
      });
      if (error) throw error;
      toast({ title: "Platform added", description: `${name} is now available.` });
      setName('');
      setUrlTemplate('');
      onPlatformsChanged();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to add platform.", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const toggleEnabled = async (p: Platform) => {
    const { error } = await supabase.from('movies_platforms').update({ enabled: !p.enabled }).eq('id', p.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      onPlatformsChanged();
    }
  };

  const setDefault = async (p: Platform) => {
    // Clear any existing default, then set this one
    const { error: clearErr } = await supabase.from('movies_platforms').update({ is_default: false }).neq('id', p.id);
    if (clearErr) {
      toast({ title: "Error", description: clearErr.message, variant: "destructive" });
      return;
    }
    const { error } = await supabase.from('movies_platforms').update({ is_default: true, enabled: true }).eq('id', p.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Default updated", description: `${p.name} is now the default platform.` });
      onPlatformsChanged();
    }
  };

  const deletePlatform = async (p: Platform) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const { error } = await supabase.from('movies_platforms').delete().eq('id', p.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Platform deleted" });
      onPlatformsChanged();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Watch Platforms</DialogTitle>
          <DialogDescription>
            Manage where you can watch movies. Use <code className="text-xs">{'{query}'}</code> in the URL template — it will be replaced with the URL-encoded movie title.
          </DialogDescription>
        </DialogHeader>

        {/* Add new */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="platform-name">Platform name</Label>
                <Input
                  id="platform-name"
                  placeholder="e.g. Netflix"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="platform-url">Search URL template</Label>
                <Input
                  id="platform-url"
                  placeholder="https://example.com/search?q={query}"
                  value={urlTemplate}
                  onChange={(e) => setUrlTemplate(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={adding} size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Platform
            </Button>
          </CardContent>
        </Card>

        {/* List */}
        <div className="space-y-2 mt-2">
          {platforms.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No platforms yet. Add one above.</p>
          ) : (
            platforms.map((p) => (
              <Card key={p.id}>
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{p.name}</span>
                      {p.is_default && <Badge variant="default" className="text-xs">Default</Badge>}
                      {!p.enabled && <Badge variant="secondary" className="text-xs">Disabled</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{p.url_template}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Switch checked={p.enabled} onCheckedChange={() => toggleEnabled(p)} />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDefault(p)}
                      title={p.is_default ? "Default platform" : "Set as default"}
                      disabled={p.is_default}
                    >
                      {p.is_default ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deletePlatform(p)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlatformsModal;