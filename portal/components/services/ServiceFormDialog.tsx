'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Field, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/form-bits';
import { ServiceImageField } from './ServiceImagePicker';
import type { Service } from './ServiceRow';

export interface ServiceFormValues {
  name: string;
  slug: string;
  parentId: number | null;
  level: number;
  bannerImage: string;
  serviceIcon: string;
  initialPrice: number;
  priceUnit: string;
  rating: number | null;
  reviewCount: number | null;
  heroTitle: string;
  heroSubtitle: string;
  status: boolean;
}

export const emptyService = (level = 0, parentId: number | null = null): ServiceFormValues => ({
  name: '',
  slug: '',
  parentId,
  level,
  bannerImage: '',
  serviceIcon: '',
  initialPrice: 0,
  priceUnit: '',
  rating: null,
  reviewCount: null,
  heroTitle: '',
  heroSubtitle: '',
  status: true,
});

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Create/edit dialog for any level of the tree.
 *
 * The fields that matter differ by level — a category needs hero copy and an
 * icon, a bookable service needs a price and rating — so the form is grouped
 * into tabs rather than presenting one long scroll of mostly-irrelevant inputs.
 */
export function ServiceFormDialog({
  open,
  onOpenChange,
  editing,
  values,
  onChange,
  onSubmit,
  saving,
  parentName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Service | null;
  values: ServiceFormValues;
  onChange: (values: ServiceFormValues) => void;
  onSubmit: () => void | Promise<void>;
  saving: boolean;
  parentName?: string | null;
}) {
  const set = <K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) =>
    onChange({ ...values, [key]: value });

  const isCategory = values.level === 0;
  const isBookable = values.level === 2;
  const levelLabel = isCategory ? 'category' : values.level === 1 ? 'sub-category' : 'service';

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = 'A name is required.';
    if (isBookable && values.initialPrice <= 0) next.initialPrice = 'Set a base price above zero.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    await onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${levelLabel}` : `New ${levelLabel}`}
            </DialogTitle>
            <DialogDescription>
              {parentName ? `Inside ${parentName}.` : 'Top level of the service tree.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <Tabs defaultValue="basics">
              <TabsList>
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="presentation">
                  {isCategory ? 'Hero' : 'Presentation'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basics" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" required error={errors.name}>
                    <Input
                      value={values.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        // Keep the slug in step until it is edited by hand.
                        onChange({
                          ...values,
                          name,
                          slug: !editing && (!values.slug || values.slug === slugify(values.name))
                            ? slugify(name)
                            : values.slug,
                        });
                      }}
                      placeholder="AC Basic Wash"
                    />
                  </Field>

                  <Field label="Slug" hint="Used in storefront URLs.">
                    <Input
                      value={values.slug}
                      onChange={(e) => set('slug', e.target.value)}
                      placeholder="ac-basic-wash"
                      className="font-mono text-xs"
                    />
                  </Field>
                </div>

                {isBookable && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Base price (৳)" required error={errors.initialPrice}>
                      <Input
                        type="number"
                        min={0}
                        value={values.initialPrice}
                        onChange={(e) => set('initialPrice', Number(e.target.value))}
                      />
                    </Field>
                    <Field label="Price unit" hint="Shown after the price, e.g. /home.">
                      <Input
                        value={values.priceUnit}
                        onChange={(e) => set('priceUnit', e.target.value)}
                        placeholder="/home"
                      />
                    </Field>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Visible on the storefront</p>
                    <p className="text-xs text-slate-500">Hidden items stay in the tree but are not bookable.</p>
                  </div>
                  <Switch checked={values.status} onCheckedChange={(v) => set('status', v)} />
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-5">
                <ServiceImageField
                  label="Banner image"
                  hint="Card and hero artwork on the storefront."
                  folder="web/service-banners"
                  value={values.bannerImage}
                  onChange={(url) => set('bannerImage', url)}
                />
                <ServiceImageField
                  label="Icon"
                  hint="Small mark in the category strip. A lucide name (e.g. wind) also works."
                  folder="web/service-icons"
                  value={values.serviceIcon}
                  onChange={(url) => set('serviceIcon', url)}
                />
              </TabsContent>

              <TabsContent value="presentation" className="space-y-4">
                {isCategory ? (
                  <>
                    <Field label="Hero title" hint="Headline on the category page.">
                      <Input
                        value={values.heroTitle}
                        onChange={(e) => set('heroTitle', e.target.value)}
                        placeholder="Professional Deep Cleaning"
                      />
                    </Field>
                    <Field label="Hero subtitle">
                      <Textarea
                        rows={3}
                        value={values.heroSubtitle}
                        onChange={(e) => set('heroSubtitle', e.target.value)}
                        placeholder="Keep your home spotless with fast, reliable professionals."
                      />
                    </Field>
                  </>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Rating" hint="0–5. Leave empty to hide the score.">
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        max={5}
                        value={values.rating ?? ''}
                        onChange={(e) => set('rating', e.target.value === '' ? null : Number(e.target.value))}
                      />
                    </Field>
                    <Field label="Review count">
                      <Input
                        type="number"
                        min={0}
                        value={values.reviewCount ?? ''}
                        onChange={(e) =>
                          set('reviewCount', e.target.value === '' ? null : Number(e.target.value))
                        }
                      />
                    </Field>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {editing ? 'Save changes' : `Create ${levelLabel}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
