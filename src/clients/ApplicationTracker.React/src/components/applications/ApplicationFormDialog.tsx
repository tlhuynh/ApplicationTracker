import { useEffect, useState } from 'react';
import type { ApplicationRecord, CreateRequest } from '@/api/applicationRecords';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { STATUS_OPTIONS } from '@/lib/constants';
import { toast } from 'sonner';

/** Default form values for a new application */
const EMPTY_FORM: CreateRequest = {
  companyName: '',
  status: 0,
  appliedDate: null,
  postingUrl: null,
  notes: null,
};


/*
* Prop for this component, basically the paramter
* Parent component need to provide these data when using this component*
* */
interface ApplicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRequest) => Promise<void>;
  /** When provided, the form pre-fills with this data (edit mode) */
  initialData?: ApplicationRecord;
}

/**
 * Converts an ISO datetime string (e.g. "2025-06-01T00:00:00") to
 * the "yyyy-MM-dd" format that <input type="date"> expects.
 */
function toDateInputValue(isoString: string | null | undefined): string {
  if (!isoString) return '';
  return isoString.split('T')[0];
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: ApplicationFormDialogProps) {
  const [form, setForm] = useState<CreateRequest>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /*
  * an object
  * where the keys are field names from CreateRequest (like companyName, status, etc.)
  * and the values are error message strings. Partial means all keys are optional — an
  * empty {} means no errors
  * */
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CreateRequest, string>>>({});

  const isEditMode = !!initialData;

  // Reset form when the dialog opens:
  // - Edit mode: populate from initialData
  // - Create mode: reset to empty
  useEffect(() => {
    if (open) {
      setFormErrors({}); // Clear erros when the dialog opens
      setForm(
        initialData
          ? {
            companyName: initialData.companyName ?? '',
            status: initialData.status ?? 0,
            appliedDate: initialData.appliedDate ?? null,
            postingUrl: initialData.postingUrl ?? null,
            notes: initialData.notes ?? null,
          }
          : EMPTY_FORM,
      );
    }
  }, [open, initialData]);

  /** Updates a single field in the form state */
  const updateField = (field: keyof CreateRequest, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    setFormErrors((prev) => {
      // Check if there is any error for this sepcific field, if not, return same object, prevent rerendering
      if (!prev[field]) return prev;

      // If there is error for this field, extract that and return the rest of the errors
      // This will remove the error on input changes
      const rest = { ...prev };
      delete rest[field];
      return rest;
    });
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof CreateRequest, string>> = {};
    // Validate company name is provided
    if (!form.companyName.trim()) {
      errors.companyName = 'Company name is required';
    }
    // Validate applied date is provided
    if (!form.appliedDate) {
      errors.appliedDate = 'Applied date is required'; // TODO check if this need format check
    }
    // Validate provided URL is valid
    if (form.postingUrl && !URL.canParse(form.postingUrl)) {
      errors.postingUrl = 'Please enter a valid URL. https://www.example.com';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Application' : 'New Application'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            {/* Company Name — required field */}
            <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name*</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                className={formErrors.companyName ? 'border-destructive' : ''} />
              {formErrors.companyName && (<p className="text-sm text-destructive">{formErrors.companyName}</p>)}
            </div>

            {/* Status — select dropdown, defaults to "Applied" */}
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={String(form.status ?? 0)}
                onValueChange={(value) => updateField('status', Number(value))}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Applied — native date picker */}
            <div className="grid gap-2">
              <Label htmlFor="appliedDate">Date Applied*</Label>
              <Input
                id="appliedDate"
                type="date"
                value={toDateInputValue(form.appliedDate)}
                onChange={(e) =>
                  updateField('appliedDate', e.target.value ? e.target.value + 'T00:00:00' : null)
                }
                className={formErrors.appliedDate ? 'border-destructive' : ''} />
              {formErrors.appliedDate && (<p className="text-sm text-destructive">{formErrors.appliedDate}</p>)}
            </div>

            {/* Job URL */}
            <div className="grid gap-2">
              <Label htmlFor="postingUrl">Job URL</Label>
              <Input
                id="postingUrl"
                type="text"
                value={form.postingUrl ?? ''}
                onChange={(e) => updateField('postingUrl', e.target.value || null)}
                className={formErrors.postingUrl ? 'border-destructive' : ''} />
              {formErrors.postingUrl && (<p className="text-sm text-destructive">{formErrors.postingUrl}</p>)}
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes ?? ''}
                onChange={(e) => updateField('notes', e.target.value || null)}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
  );
}
