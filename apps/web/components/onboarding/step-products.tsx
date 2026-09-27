"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileSpreadsheetIcon,
  UploadIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { handleActionResponse } from "@/lib/action-client";
import { importProducts } from "@/lib/actions/onboarding";
import {
  PRODUCT_FIELDS,
  guessMapping,
  mapRows,
  parseCsv,
  type ProductFieldKey,
} from "@/lib/csv";
import type { ImportResult } from "@/lib/types/api";
import { formatNumber } from "@/lib/utils";
import { useOnboarding } from "@/stores/onboarding";
import { StepFooter, StepHeading } from "./wizard-frame";

const MAX_PER_REQUEST = 5000;
const NONE = "__none__";

const TEMPLATE =
  "name,sku,barcode,cost_price,price,category,qty\n" +
  "Cotton Shirt,CS-001,4790000000012,2100,3500,Apparel,24\n" +
  "Ceramic Mug,MG-001,,180,450,Homeware,60\n";

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "aperture-products-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function StepProducts({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { orgId, branches } = useOnboarding();
  const stores = branches.filter((b) => b.isActive);

  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [table, setTable] = useState<string[][] | null>(null);
  const [mapping, setMapping] = useState<Record<
    ProductFieldKey,
    number | null
  > | null>(null);
  const [storeId, setStoreId] = useState<string>(
    (stores.find((s) => s.isDefault) ?? stores[0])?.id ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const headers = table?.[0] ?? [];
  const rows = useMemo(() => table?.slice(1) ?? [], [table]);
  const mapped = useMemo(
    () => (mapping ? mapRows(rows, mapping) : []),
    [rows, mapping],
  );
  const missingRequired = mapping
    ? PRODUCT_FIELDS.filter((f) => f.required && mapping[f.key] === null)
    : [];
  const needsStore = !!mapping && mapping.qty !== null;

  async function onFile(file: File) {
    setResult(null);
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length < 2) {
      toast.error("That file has no product rows.");
      return;
    }
    setFileName(file.name);
    setFileSize(file.size);
    setTable(parsed);
    setMapping(guessMapping(parsed[0]));
  }

  async function runImport() {
    if (!orgId || !mapping) return;
    setBusy(true);
    try {
      const total: ImportResult = {
        created: 0,
        total: mapped.length,
        skipped: [],
      };
      for (let i = 0; i < mapped.length; i += MAX_PER_REQUEST) {
        const chunk = mapped.slice(i, i + MAX_PER_REQUEST);
        const response = handleActionResponse(
          await importProducts({
            orgId,
            branchId: needsStore ? storeId : undefined,
            rows: chunk,
          }),
        );
        if (!response.success) throw new Error(response.error.message);
        total.created += response.data.created;
        // Row numbers are relative to the chunk; shift them back to the file.
        total.skipped.push(
          ...response.data.skipped.map((s) => ({ ...s, row: s.row + i })),
        );
      }
      setResult(total);
      toast.success(`${formatNumber(total.created)} products imported`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  const status = (key: ProductFieldKey) => {
    const index = mapping?.[key];
    if (index === null || index === undefined) {
      return PRODUCT_FIELDS.find((f) => f.key === key)?.required ? (
        <Badge variant="bad">
          <AlertTriangleIcon /> Needed
        </Badge>
      ) : (
        <Badge variant="secondary">Not in file</Badge>
      );
    }
    return (
      <Badge variant="ok">
        <CheckCircle2Icon /> Matched
      </Badge>
    );
  };

  return (
    <>
      <StepHeading
        index={2}
        title="Bring your products in"
        text="A CSV from your old till or your stock sheet is enough. We match the columns and you correct anything we got wrong."
      />

      {!table ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) void onFile(file);
          }}
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-input bg-surface p-10 text-center transition-colors hover:border-primary hover:bg-accent-soft/40"
        >
          <span className="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
            <UploadIcon className="size-6" />
          </span>
          <span className="text-base font-bold">
            Drop your product CSV here
          </span>
          <span className="text-sm text-muted-foreground">
            Or export one from your old system first
          </span>
          <span className="rounded-[10px] border border-input px-4 py-2 text-sm font-bold">
            Choose a file
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border bg-surface p-4">
          <span className="flex size-10 items-center justify-center rounded-[10px] bg-accent-soft text-accent-text">
            <FileSpreadsheetIcon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{fileName}</p>
            <p className="text-sm text-muted-foreground">
              {formatNumber(rows.length)} rows ·{" "}
              {Math.max(1, Math.round(fileSize / 1024))} KB
            </p>
          </div>
          <Badge variant="ok">
            <CheckCircle2Icon /> Ready
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Replace
          </Button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
          e.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <button
          type="button"
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 font-bold text-accent-text hover:underline"
        >
          <DownloadIcon className="size-4" />
          Download a template
        </button>
        <button
          type="button"
          onClick={onNext}
          className="font-bold text-accent-text hover:underline"
        >
          Add products by hand instead
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        Nothing is saved until you press Import. Products you already have (same
        SKU) are left alone, so importing twice is safe.
      </p>

      {mapping && !result && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Check the columns</h2>
          <div className="overflow-hidden rounded-2xl border bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-raised text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-2.5">Aperture field</th>
                  <th className="px-4 py-2.5">Your column</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {PRODUCT_FIELDS.map((f) => (
                  <tr key={f.key}>
                    <td className="px-4 py-2 font-semibold">
                      {f.label}
                      {f.required && <span className="text-bad"> *</span>}
                    </td>
                    <td className="px-4 py-2">
                      <Select
                        value={
                          mapping[f.key] === null
                            ? NONE
                            : String(mapping[f.key])
                        }
                        onValueChange={(v) =>
                          v &&
                          setMapping({
                            ...mapping,
                            [f.key]: v === NONE ? null : Number(v),
                          })
                        }
                      >
                        <SelectTrigger size="sm" className="w-56">
                          <SelectValue>
                            {(v: string) =>
                              v === NONE
                                ? "— not in the file —"
                                : headers[Number(v)]
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>
                            — not in the file —
                          </SelectItem>
                          {headers.map((h, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {h || `Column ${i + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-2">{status(f.key)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {needsStore && (
            <div className="flex flex-wrap items-center gap-3 rounded-[10px] bg-info-soft p-3 text-sm font-medium text-info">
              Stock on hand goes into
              <Select value={storeId} onValueChange={(v) => v && setStoreId(v)}>
                <SelectTrigger
                  size="sm"
                  className="w-56 bg-surface text-foreground"
                >
                  <SelectValue>
                    {(v: string) =>
                      stores.find((s) => s.id === v)?.name ?? "Pick a store"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {missingRequired.length > 0 && (
            <p role="alert" className="text-sm font-semibold text-bad">
              Pick a column for:{" "}
              {missingRequired.map((f) => f.label).join(", ")}.
            </p>
          )}
        </section>
      )}

      {result && (
        <section className="flex flex-col gap-3 rounded-2xl border bg-surface p-5">
          <p className="flex items-center gap-2 text-base font-bold text-ok">
            <CheckCircle2Icon className="size-5" />
            {formatNumber(result.created)} of {formatNumber(result.total)}{" "}
            products imported
          </p>
          {result.skipped.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                {formatNumber(result.skipped.length)} rows were left out:
              </p>
              <ul className="max-h-44 divide-y overflow-y-auto rounded-[10px] border text-sm">
                {result.skipped.slice(0, 50).map((s) => (
                  <li key={s.row} className="flex gap-3 px-3 py-2">
                    <span className="w-16 shrink-0 font-semibold">
                      Row {s.row + 1}
                    </span>
                    <span className="text-muted-foreground">
                      {s.sku ? `${s.sku}: ` : ""}
                      {s.reason}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <StepFooter
        index={2}
        onBack={onBack}
        primary={result ? onNext : runImport}
        primaryLabel={
          result
            ? "Continue to your team"
            : mapping
              ? `Import ${formatNumber(rows.length)} products`
              : "Skip for now"
        }
        busy={busy}
        disabled={
          !result &&
          !!mapping &&
          (missingRequired.length > 0 || (needsStore && !storeId))
        }
        secondary={
          !result && mapping ? (
            <Button variant="ghost" onClick={onNext} disabled={busy}>
              Skip for now
            </Button>
          ) : undefined
        }
      />
    </>
  );
}
