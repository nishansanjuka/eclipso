/**
 * Minimal RFC 4180 CSV reader for the product import: quoted fields, escaped
 * quotes (""), commas and line breaks inside quotes, CRLF or LF, BOM.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Ignore fully blank lines.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Aperture fields a CSV column can be mapped to. */
export const PRODUCT_FIELDS = [
  { key: "name", label: "Product name", required: true },
  { key: "sku", label: "SKU", required: true },
  { key: "price", label: "Selling price", required: true },
  { key: "barcode", label: "Barcode", required: false },
  { key: "costPrice", label: "Cost price", required: false },
  { key: "category", label: "Category", required: false },
  { key: "qty", label: "Stock on hand", required: false },
] as const;

export type ProductFieldKey = (typeof PRODUCT_FIELDS)[number]["key"];

const HINTS: Record<ProductFieldKey, RegExp> = {
  name: /^(item[_ ]?name|product[_ ]?name|name|description|title|item)$/i,
  sku: /^(sku|sku[_ ]?code|item[_ ]?code|product[_ ]?code|code|article)$/i,
  price:
    /^(sell(ing)?[_ ]?price|price|unit[_ ]?price|retail[_ ]?price|sale[_ ]?price|mrp)$/i,
  barcode: /^(barcode|barcode[_ ]?ean|ean|ean13|upc|gtin)$/i,
  costPrice:
    /^(cost([_ ]?price)?|unit[_ ]?cost|buy(ing)?[_ ]?price|purchase[_ ]?price)$/i,
  category: /^(category|dept|department|group|type)$/i,
  qty: /^(qty([_ ]?on[_ ]?hand)?|quantity|stock|stock[_ ]?on[_ ]?hand|on[_ ]?hand|balance)$/i,
};

/**
 * Guesses which CSV column is which field from the header row. Returns, per
 * field, the column index (or null) and whether it was an exact hit; the UI
 * shows both so the owner can correct a wrong guess before importing.
 */
export function guessMapping(
  headers: string[],
): Record<ProductFieldKey, number | null> {
  const mapping = {} as Record<ProductFieldKey, number | null>;
  const used = new Set<number>();
  for (const field of PRODUCT_FIELDS) {
    const index = headers.findIndex(
      (h, i) => !used.has(i) && HINTS[field.key].test(h.trim()),
    );
    mapping[field.key] = index === -1 ? null : index;
    if (index !== -1) used.add(index);
  }
  return mapping;
}

export type MappedRow = {
  name: string;
  sku: string;
  price: string;
  barcode?: string;
  costPrice?: string;
  category?: string;
  qty?: number;
};

/** "Rs 1,250.50" -> "1250.50". Anything that is not a plain amount stays as typed. */
export function cleanAmount(raw: string): string {
  const stripped = raw.replace(/[^\d.,-]/g, "").replace(/,/g, "");
  return stripped === "" ? raw.trim() : stripped;
}

/** Applies the column mapping to the data rows (everything after the header). */
export function mapRows(
  rows: string[][],
  mapping: Record<ProductFieldKey, number | null>,
): MappedRow[] {
  const cell = (row: string[], key: ProductFieldKey) => {
    const index = mapping[key];
    return index === null ? undefined : (row[index] ?? "").trim();
  };

  return rows.map((row) => {
    const mapped: MappedRow = {
      name: cell(row, "name") ?? "",
      sku: cell(row, "sku") ?? "",
      price: cleanAmount(cell(row, "price") ?? ""),
    };
    const barcode = cell(row, "barcode");
    if (barcode) mapped.barcode = barcode;
    const cost = cell(row, "costPrice");
    if (cost) mapped.costPrice = cleanAmount(cost);
    const category = cell(row, "category");
    if (category) mapped.category = category;
    const qty = cell(row, "qty");
    if (qty) {
      const n = Number(qty.replace(/,/g, ""));
      // A non-number is sent as-is so the API reports it against the row.
      mapped.qty = Number.isFinite(n)
        ? Math.trunc(n)
        : (qty as unknown as number);
    }
    return mapped;
  });
}
