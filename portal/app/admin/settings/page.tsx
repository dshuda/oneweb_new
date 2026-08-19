'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Percent, Plus, RefreshCw, Save, Settings as SettingsIcon, Smartphone } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/form-bits';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogBody, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ErrorBanner, PageHeader, StatTile, SuccessBanner } from '@/components/ui/data-table';

/**
 * Business settings are a free-form key/value store (BusinessSetting rows keyed
 * by Type). The keys below are the ones the platform actually reads, so they get
 * proper labels and input types; anything else the API returns is still shown
 * and editable rather than hidden.
 */
interface SettingSpec {
  key: string;
  label: string;
  hint?: string;
  type?: 'text' | 'number';
  suffix?: string;
}

interface SettingGroup {
  title: string;
  description: string;
  icon: typeof SettingsIcon;
  items: SettingSpec[];
}

const GROUPS: SettingGroup[] = [
  {
    title: 'Commission',
    description: 'Applies when a vendor has no rate of their own.',
    icon: Percent,
    items: [
      {
        key: 'vendor_commission',
        label: 'Default vendor commission',
        hint: 'Percentage of the order total paid to the vendor.',
        type: 'number',
        suffix: '%',
      },
    ],
  },
  {
    title: 'Android app',
    description: 'Drives the update prompt in the customer app.',
    icon: Smartphone,
    items: [
      { key: 'current_version_android', label: 'Current version', hint: 'Latest build on the Play Store.' },
      {
        key: 'minimum_version_required_android',
        label: 'Minimum supported version',
        hint: 'Older builds are forced to update.',
      },
    ],
  },
  {
    title: 'iOS app',
    description: 'Drives the update prompt in the customer app.',
    icon: Smartphone,
    items: [
      { key: 'current_version_ios', label: 'Current version', hint: 'Latest build on the App Store.' },
      {
        key: 'minimum_version_required_ios',
        label: 'Minimum supported version',
        hint: 'Older builds are forced to update.',
      },
    ],
  },
];

const KNOWN_KEYS = new Set(GROUPS.flatMap((g) => g.items.map((i) => i.key)));

const prettify = (key: string) =>
  key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [initial, setInitial] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/v1/settings');
      const payload = (response.data?.data ?? response.data ?? {}) as Record<string, unknown>;
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(payload)) flat[k] = v == null ? '' : String(v);
      // Keys the platform reads must appear even when the row does not exist yet.
      for (const k of KNOWN_KEYS) if (!(k in flat)) flat[k] = '';
      setValues(flat);
      setInitial(flat);
    } catch {
      setError('Could not load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const extraKeys = useMemo(
    () => Object.keys(values).filter((k) => !KNOWN_KEYS.has(k)).toSorted(),
    [values],
  );

  const changed = useMemo(
    () => Object.keys(values).filter((k) => (values[k] ?? '') !== (initial[k] ?? '')),
    [values, initial],
  );

  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const save = async () => {
    if (changed.length === 0) return;
    setSaving(true);
    setError('');
    setStatus('');
    try {
      // Only changed rows are sent; the API upserts each Type/Lang pair.
      await api.put(
        '/api/v1/admin/settings',
        changed.map((key) => ({ type: key, value: values[key] ?? '', lang: 'en' })),
      );
      setInitial({ ...values });
      setStatus(`Saved ${changed.length} setting${changed.length === 1 ? '' : 's'}.`);
    } catch {
      setError('Saving failed. Your changes are still on screen.');
    } finally {
      setSaving(false);
    }
  };

  const addSetting = (e: React.FormEvent) => {
    e.preventDefault();
    const key = newKey.trim().toLowerCase().replace(/\s+/g, '_');
    if (!key) return;
    if (key in values) {
      setError(`"${key}" already exists.`);
      return;
    }
    set(key, newValue);
    setShowAdd(false);
    setNewKey('');
    setNewValue('');
  };

  const renderField = (spec: SettingSpec) => (
    <Field key={spec.key} label={spec.label} hint={spec.hint}>
      <div className="flex items-center gap-2">
        <Input
          type={spec.type ?? 'text'}
          value={values[spec.key] ?? ''}
          onChange={(e) => set(spec.key, e.target.value)}
          disabled={loading}
          placeholder={loading ? 'Loading…' : undefined}
        />
        {spec.suffix && <span className="text-sm text-slate-500">{spec.suffix}</span>}
      </div>
      <p className="mt-1 font-mono text-[11px] text-slate-400">{spec.key}</p>
    </Field>
  );

  return (
    <div className="min-h-screen bg-slate-50/60 p-6">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Settings"
          description="Platform-wide values read by the storefront, the API and the mobile apps."
        >
          <Button variant="outline" onClick={() => void load()} disabled={saving}>
            <RefreshCw /> Reload
          </Button>
          <Button onClick={() => void save()} disabled={saving || changed.length === 0}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {changed.length > 0 ? `Save ${changed.length} change${changed.length === 1 ? '' : 's'}` : 'Saved'}
          </Button>
        </PageHeader>

        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <StatTile icon={SettingsIcon} label="Settings stored" value={Object.keys(values).length} />
          <StatTile
            icon={Save}
            label="Unsaved changes"
            value={changed.length}
            tone={changed.length > 0 ? 'warning' : 'success'}
          />
        </div>

        <ErrorBanner message={error} onDismiss={() => setError('')} />
        <SuccessBanner message={status} />

        <div className="space-y-4">
          {GROUPS.map((group) => (
            <section key={group.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <group.icon className="size-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{group.title}</h2>
                  <p className="text-xs text-slate-500">{group.description}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">{group.items.map(renderField)}</div>
            </section>
          ))}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Other settings</h2>
                <p className="text-xs text-slate-500">
                  Any additional key/value pairs stored by the API.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
                <Plus /> Add setting
              </Button>
            </div>

            {extraKeys.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">
                {loading ? 'Loading…' : 'No additional settings.'}
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {extraKeys.map((key) => (
                  <Field key={key} label={prettify(key)}>
                    <Input value={values[key] ?? ''} onChange={(e) => set(key, e.target.value)} />
                    <p className="mt-1 font-mono text-[11px] text-slate-400">{key}</p>
                  </Field>
                ))}
              </div>
            )}
          </section>
        </div>

        {changed.length > 0 && (
          <div className="sticky bottom-4 mt-5 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
            <span className="text-sm text-amber-900">
              {changed.length} unsaved change{changed.length === 1 ? '' : 's'}:{' '}
              {changed.slice(0, 3).map((k) => (
                <Badge key={k} variant="outline" className="mr-1">
                  {k}
                </Badge>
              ))}
              {changed.length > 3 && <span className="text-xs">+{changed.length - 3} more</span>}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setValues({ ...initial })}>
                Discard
              </Button>
              <Button size="sm" onClick={() => void save()} disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />} Save
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <form onSubmit={addSetting} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader>
              <DialogTitle>Add a setting</DialogTitle>
              <DialogDescription>
                Creates a new key. It is stored once you save.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <Field label="Key" required hint="Lower case with underscores, e.g. support_phone.">
                <Input
                  required
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="support_phone"
                  className="font-mono"
                />
              </Field>
              <Field label="Value">
                <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} />
              </Field>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Plus /> Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
