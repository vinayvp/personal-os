
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddTrackerModalProps {
  onTrackerAdded: (tracker: { name: string; icon: string; color: string }) => void;
}

const AddTrackerModal: React.FC<AddTrackerModalProps> = ({ onTrackerAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [trackerName, setTrackerName] = useState('');
  const [trackerIcon, setTrackerIcon] = useState('');
  const [trackerColor, setTrackerColor] = useState('#3B82F6');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackerName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a tracker name.",
      });
      return;
    }

    onTrackerAdded({
      name: trackerName.trim(),
      icon: trackerIcon.trim() || '📝',
      color: trackerColor
    });

    // Reset form
    setTrackerName('');
    setTrackerIcon('');
    setTrackerColor('#3B82F6');
    setIsOpen(false);

    toast({
      title: "Success",
      description: "New tracker added successfully!",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Tracker
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Tracker</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tracker-name">Tracker Name</Label>
            <Input
              id="tracker-name"
              value={trackerName}
              onChange={(e) => setTrackerName(e.target.value)}
              placeholder="e.g., Water Intake, Reading"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tracker-icon">Icon (optional)</Label>
            <Input
              id="tracker-icon"
              value={trackerIcon}
              onChange={(e) => setTrackerIcon(e.target.value)}
              placeholder="e.g., 💧, 📚 (or leave empty for default)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tracker-color">Color</Label>
            <div className="flex items-center gap-2">
              <input
                id="tracker-color"
                type="color"
                value={trackerColor}
                onChange={(e) => setTrackerColor(e.target.value)}
                className="w-12 h-8 rounded border"
              />
              <Input
                value={trackerColor}
                onChange={(e) => setTrackerColor(e.target.value)}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Tracker
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTrackerModal;
