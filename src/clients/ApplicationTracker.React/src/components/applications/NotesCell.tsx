import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NotepadText } from 'lucide-react';

export function NotesCell({ value }: { value: string | null }) {
  const [open, setOpen] = useState(false);

  if (!value) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground cursor-pointer">
        <NotepadText className="h-4 w-4" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notes</DialogTitle>
          </DialogHeader>
          <p className="whitespace-pre-wrap">{value}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
