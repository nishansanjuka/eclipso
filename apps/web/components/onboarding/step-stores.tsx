"use client";

import { useState } from "react";
import {
  InfoIcon,
  PlusIcon,
  StoreIcon,
  TrashIcon,
  WarehouseIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { handleActionResponse } from "@/lib/action-client";
import {
  getOnboardingState,
  saveBusiness,
  saveStore,
} from "@/lib/actions/onboarding";
import { useOnboarding } from "@/stores/onboarding";
import { StepFooter, StepHeading } from "./wizard-frame";

interface StoreDraft {
  /** Set once it exists in the database. */
  id?: string;
  key: string;
  name: string;
  address: string;
  kind: "store" | "warehouse";
  registers: number;
}

const CURRENCIES = [
  { code: "LKR", label: "Sri Lanka rupee · Rs" },
  { code: "INR", label: "Indian rupee · ₹" },
  { code: "MVR", label: "Maldivian rufiyaa · MVR" },
  { code: "BDT", label: "Bangladeshi taka · ৳" },
  { code: "SGD", label: "Singapore dollar · S$" },
  { code: "GBP", label: "Pound sterling · £" },
  { code: "USD", label: "US dollar · $" },
] as const;

const ROUNDING = [
  { value: "none", label: "No rounding", hint: "Totals show to the cent" },
  {
    value: "nearest_1",
    label: "Nearest 1.00",
    hint: "Cash totals round to the unit",
  },
  { value: "nearest_5", label: "Nearest 5.00", hint: "Cash totals round to 5" },
] as const;

let counter = 0;
const nextKey = () => `new-${++counter}`;

export function StepStores({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { orgId, business, branches, hydrate, roles } = useOnboarding();

  const [stores, setStores] = useState<StoreDraft[]>(() =>
    branches.map((b) => ({
      id: b.id,
      key: b.id,
      name: b.name,
      address: b.address ?? "",
      kind: b.kind,
      registers: b.registerCount,
    })),
  );
  const [vat, setVat] = useState(business?.vatRegistered ?? false);
  const [vatNumber, setVatNumber] = useState(business?.vatNumber ?? "");
  const [vatRate, setVatRate] = useState("18");
  const [currency, setCurrency] = useState(business?.currency ?? "LKR");
  const [rounding, setRounding] = useState<string>(
    business?.rounding ?? "none",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: string, patch: Partial<StoreDraft>) {
    setStores((all) =>
      all.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    );
  }

  async function submit() {
    if (!orgId || !business) return;
    if (stores.length === 0 || stores.some((s) => s.name.trim().length < 2)) {
      return setError("Every store needs a name.");
    }
    if (vat && !/^\d{1,3}(\.\d{1,2})?$/.test(vatRate)) {
      return setError("The VAT rate must be a percentage like 18 or 12.5.");
    }
    setError(null);
    setBusy(true);
    try {
      // Codes only matter for new stores; the API keeps them unique per business.
      const taken = new Set(branches.map((b) => b.code));
      for (const s of stores) {
        const code = (() => {
          if (s.id) return undefined;
          const base =
            s.name
              .toUpperCase()
              .replace(/[^A-Z0-9]+/g, "")
              .slice(0, 12) || "STORE";
          let candidate = base;
          for (let i = 2; taken.has(candidate); i++) candidate = `${base}${i}`;
          taken.add(candidate);
          return candidate;
        })();
        const saved = handleActionResponse(
          await saveStore({
            orgId,
            id: s.id,
            name: s.name.trim(),
            code,
            address: s.address.trim() || undefined,
            kind: s.kind,
            registerCount: s.kind === "warehouse" ? 0 : s.registers,
          }),
        );
        if (!saved.success)
          throw new Error(`${s.name}: ${saved.error.message}`);
      }

      const tax = handleActionResponse(
        await saveBusiness({
          orgId,
          vatRegistered: vat,
          vatNumber: vat ? vatNumber.trim() || undefined : undefined,
          ...(vat && { vatRate }),
          currency,
          rounding: rounding as "none",
        }),
      );
      if (!tax.success) throw new Error(tax.error.message);

      const state = handleActionResponse(await getOnboardingState({ orgId }));
      if (!state.success) throw new Error(state.error.message);
      hydrate({
        orgId,
        ...state.data,
        roles: state.data.roles.length ? state.data.roles : roles,
      });
      onNext();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StepHeading
        index={1}
        title="Where do you sell, and how are you taxed?"
        text="Add every shop that takes money. Stock-only places can be added as a warehouse."
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Your stores</h2>
        <ul className="flex flex-col gap-3">
          {stores.map((s) => (
            <li
              key={s.key}
              className="flex flex-col gap-4 rounded-2xl border bg-surface p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent-text">
                  {s.kind === "warehouse" ? (
                    <WarehouseIcon className="size-5" />
                  ) : (
                    <StoreIcon className="size-5" />
                  )}
                </span>
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                  <Field label="Name">
                    <Input
                      value={s.name}
                      onChange={(e) => update(s.key, { name: e.target.value })}
                    />
                  </Field>
                  <Field label="Address">
                    <Input
                      value={s.address}
                      onChange={(e) =>
                        update(s.key, { address: e.target.value })
                      }
                    />
                  </Field>
                </div>
                {!s.id && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${s.name || "store"}`}
                    onClick={() =>
                      setStores((all) => all.filter((x) => x.key !== s.key))
                    }
                  >
                    <TrashIcon />
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 pl-[52px]">
                {s.kind === "warehouse" ? (
                  <Badge variant="info">Stock only, no register</Badge>
                ) : (
                  <label className="flex items-center gap-2 text-[13px] font-semibold">
                    Registers
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={s.registers}
                      onChange={(e) =>
                        update(s.key, {
                          registers: Math.max(
                            1,
                            Math.min(50, Number(e.target.value) || 1),
                          ),
                        })
                      }
                      className="h-8 w-20"
                    />
                  </label>
                )}
                {s.id && business && s === stores[0] && (
                  <Badge variant="secondary">Default</Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setStores((all) => [
                ...all,
                {
                  key: nextKey(),
                  name: "",
                  address: "",
                  kind: "store",
                  registers: 1,
                },
              ])
            }
          >
            <PlusIcon />
            Add another store
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setStores((all) => [
                ...all,
                {
                  key: nextKey(),
                  name: "",
                  address: "",
                  kind: "warehouse",
                  registers: 0,
                },
              ])
            }
          >
            <WarehouseIcon />
            Add a warehouse
          </Button>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Each register is one till running at the same time. You can add or
          remove them whenever you like.
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border bg-surface p-5">
        <h2 className="text-lg font-bold">Tax and currency</h2>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold">
              This business is VAT registered
            </span>
            <span className="text-[13px] text-muted-foreground">
              Turn this off and Aperture never shows a tax line, on screen or on
              a receipt.
            </span>
          </div>
          <Switch
            checked={vat}
            onCheckedChange={setVat}
            aria-label="VAT registered"
          />
        </div>

        {vat && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="VAT number" htmlFor="vat-number">
              <Input
                id="vat-number"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
              />
            </Field>
            <Field
              label="Standard rate (%)"
              htmlFor="vat-rate"
              hint="Products can be set to 0% one by one"
            >
              <Input
                id="vat-rate"
                inputMode="decimal"
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
              />
            </Field>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Currency">
            <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) =>
                    CURRENCIES.find((c) => c.code === v)?.label ?? v
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label="Rounding"
            hint={ROUNDING.find((r) => r.value === rounding)?.hint}
          >
            <Select value={rounding} onValueChange={(v) => v && setRounding(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) =>
                    ROUNDING.find((r) => r.value === v)?.label ?? v
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ROUNDING.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <p className="flex items-start gap-2 rounded-[10px] bg-info-soft p-3 text-[13px] font-medium text-info">
          <InfoIcon className="mt-0.5 size-4 shrink-0" />
          Shelf prices are entered without VAT. The till adds it and breaks it
          out by rate on the receipt.
        </p>
      </section>

      {error && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {error}
        </p>
      )}

      <StepFooter
        index={1}
        onBack={onBack}
        primary={submit}
        primaryLabel="Continue to products"
        busy={busy}
      />
    </>
  );
}
