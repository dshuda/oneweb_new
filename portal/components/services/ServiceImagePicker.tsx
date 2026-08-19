'use client';

import React from 'react';
import { ImageOff } from 'lucide-react';
import CdnGallery from '@/components/Admin/CdnGallery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/form-bits';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { isImageValue, mediaUrl } from '@/components/Admin/CdnImageField';

/** Thumbnail used in lists and cards; falls back cleanly when nothing is set. */
export function ServiceThumb({
  src,
  alt,
  className = 'h-12 w-16',
  contain = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  contain?: boolean;
}) {
  if (!isImageValue(src)) {
    return (
      <span
        className={`flex ${className} items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-300`}
      >
        <ImageOff className="size-4" />
      </span>
    );
  }
  return (
    <img
      src={mediaUrl(src)}
      alt={alt}
      className={`${className} rounded-lg border border-slate-200 bg-slate-50 ${contain ? 'object-contain p-1' : 'object-cover'}`}
    />
  );
}

/**
 * Full-screen picker for one image field: current value, the CDN library as a
 * horizontal filmstrip, upload, delete, or a pasted URL.
 */
export function ServiceImagePicker({
  open,
  onOpenChange,
  title,
  description,
  folder,
  value,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  folder: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <DialogBody className="space-y-5">
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <ServiceThumb src={draft} alt="Selected" className="h-20 w-28" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-700">Selected image</p>
              <p className="truncate text-xs text-slate-500">{draft || 'Nothing selected yet'}</p>
            </div>
            {draft && (
              <Button type="button" variant="destructiveGhost" size="sm" onClick={() => setDraft('')}>
                Clear
              </Button>
            )}
          </div>

          <CdnGallery
            path={folder}
            selectedUrl={draft || null}
            allowDelete
            onSelect={(url) => setDraft(url)}
          />

          <Field label="Or paste a URL" hint="Useful for images already hosted elsewhere.">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="https://cdn…/image.png" />
          </Field>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onChange(draft);
              onOpenChange(false);
            }}
          >
            Use this image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Inline field: preview + change button, opening the picker above. */
export function ServiceImageField({
  label,
  hint,
  folder,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  folder: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Field label={label} hint={hint}>
        <div className="flex items-center gap-3">
          <ServiceThumb src={value} alt={label} className="h-16 w-24" contain={!value?.includes('banner')} />
          <div className="flex flex-col gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
              {value ? 'Change image' : 'Choose image'}
            </Button>
            {value && (
              <Button type="button" size="sm" variant="destructiveGhost" onClick={() => onChange('')}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </Field>

      <ServiceImagePicker
        open={open}
        onOpenChange={setOpen}
        title={label}
        description="Pick from the CDN library, upload a new image, or paste a URL."
        folder={folder}
        value={value}
        onChange={onChange}
      />
    </>
  );
}
