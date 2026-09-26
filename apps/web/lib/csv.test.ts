import { describe, expect, it } from "vitest";
import { cleanAmount, guessMapping, mapRows, parseCsv } from "./csv";

describe("parseCsv", () => {
  it("reads plain rows, CRLF and a BOM", () => {
    expect(parseCsv("﻿a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles quotes, commas, escaped quotes and newlines inside fields", () => {
    const csv = 'name,note\n"Shirt, cotton","said ""hi"""\n"two\nlines",x';
    expect(parseCsv(csv)).toEqual([
      ["name", "note"],
      ["Shirt, cotton", 'said "hi"'],
      ["two\nlines", "x"],
    ]);
  });

  it("skips blank lines and keeps a last row with no trailing newline", () => {
    expect(parseCsv("a,b\n\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("keeps empty cells", () => {
    expect(parseCsv("a,,c\n1,,")).toEqual([
      ["a", "", "c"],
      ["1", "", ""],
    ]);
    // A row of nothing but empty cells is a blank line, not data.
    expect(parseCsv("a,b\n,\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("guessMapping", () => {
  it("matches the headers of a typical old-till export", () => {
    const headers = [
      "item_name",
      "sku_code",
      "barcode_ean",
      "unit_cost",
      "sell_price",
      "dept",
      "qty_on_hand",
    ];
    expect(guessMapping(headers)).toEqual({
      name: 0,
      sku: 1,
      barcode: 2,
      costPrice: 3,
      price: 4,
      category: 5,
      qty: 6,
    });
  });

  it("leaves unknown columns unmapped and never uses a column twice", () => {
    const m = guessMapping(["Name", "Price", "Colour"]);
    expect(m.name).toBe(0);
    expect(m.price).toBe(1);
    expect(m.sku).toBeNull();
    expect(m.category).toBeNull();
  });
});

describe("mapRows", () => {
  const mapping = guessMapping(["name", "sku", "price", "qty", "category"]);

  it("builds API rows, cleaning currency formatting", () => {
    const rows = mapRows(
      [["Shirt", "S-1", "Rs 1,250.50", "1,200", "Apparel"]],
      mapping,
    );
    expect(rows).toEqual([
      {
        name: "Shirt",
        sku: "S-1",
        price: "1250.50",
        qty: 1200,
        category: "Apparel",
      },
    ]);
  });

  it("omits optional fields that are blank", () => {
    const rows = mapRows([["Mug", "M-1", "450", "", ""]], mapping);
    expect(rows[0]).toEqual({ name: "Mug", sku: "M-1", price: "450" });
  });
});

describe("cleanAmount", () => {
  it("strips symbols and thousands separators", () => {
    expect(cleanAmount("Rs 13,136.70")).toBe("13136.70");
    expect(cleanAmount("450")).toBe("450");
    expect(cleanAmount("n/a")).toBe("n/a");
  });
});
