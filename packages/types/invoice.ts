export type InvoiceData =
  | {
      invoice: {
        id: string;
        invoiceNumber: string;
        totalTax: number;
        totalDiscount: number;
        subTotal: number;
        grandTotal: number;
        createdAt: Date;
        updatedAt: Date;
      };
      order: null;
      orderItems: never[];
    }
  | {
      invoice: {
        id: string;
        invoiceNumber: string;
        totalTax: number;
        totalDiscount: number;
        subTotal: number;
        grandTotal: number;
        createdAt: Date;
        updatedAt: Date;
      };
      order: {
        id: string;
        businessId: string;
        supplierId: string;
        invoiceId: string;
        expectedDate: Date;
        status: string;
        totalAmount: number;
        createdAt: Date;
        updatedAt: Date;
      };
      orderItems: Array<{
        id: string;
        orderId: string;
        productId: string;
        qty: number;
        price: number;
        taxes: Array<{ rate: number }>;
        discounts: Array<{ value: number }>;
        product: { name: string };
      }>;
    }
  | null;

// Supported currency codes with IntelliSense
export const SUPPORTED_CURRENCIES = [
  "AED",
  "AFN",
  "ALL",
  "AMD",
  "ANG",
  "AOA",
  "ARS",
  "AUD",
  "AWG",
  "AZN",
  "BAM",
  "BBD",
  "BDT",
  "BGN",
  "BHD",
  "BIF",
  "BMD",
  "BND",
  "BOB",
  "BRL",
  "BSD",
  "BTN",
  "BWP",
  "BYN",
  "BZD",
  "CAD",
  "CDF",
  "CHF",
  "CLP",
  "CNY",
  "COP",
  "CRC",
  "CUP",
  "CVE",
  "CZK",
  "DJF",
  "DKK",
  "DOP",
  "DZD",
  "EGP",
  "ERN",
  "ETB",
  "EUR",
  "FJD",
  "FKP",
  "GBP",
  "GEL",
  "GGP",
  "GHS",
  "GIP",
  "GMD",
  "GNF",
  "GTQ",
  "GYD",
  "HKD",
  "HNL",
  "HRK",
  "HTG",
  "HUF",
  "IDR",
  "ILS",
  "IMP",
  "INR",
  "IQD",
  "IRR",
  "ISK",
  "JEP",
  "JMD",
  "JOD",
  "JPY",
  "KES",
  "KGS",
  "KHR",
  "KID",
  "KMF",
  "KRW",
  "KWD",
  "KYD",
  "KZT",
  "LAK",
  "LBP",
  "LKR",
  "LRD",
  "LSL",
  "LYD",
  "MAD",
  "MDL",
  "MGA",
  "MKD",
  "MMK",
  "MNT",
  "MOP",
  "MRU",
  "MUR",
  "MVR",
  "MWK",
  "MXN",
  "MYR",
  "MZN",
  "NAD",
  "NGN",
  "NIO",
  "NOK",
  "NPR",
  "NZD",
  "OMR",
  "PAB",
  "PEN",
  "PGK",
  "PHP",
  "PKR",
  "PLN",
  "PYG",
  "QAR",
  "RON",
  "RSD",
  "RUB",
  "RWF",
  "SAR",
  "SBD",
  "SCR",
  "SDG",
  "SEK",
  "SGD",
  "SHP",
  "SLE",
  "SLL",
  "SOS",
  "SRD",
  "SSP",
  "STN",
  "SYP",
  "SZL",
  "THB",
  "TJS",
  "TMT",
  "TND",
  "TOP",
  "TRY",
  "TTD",
  "TVD",
  "TWD",
  "TZS",
  "UAH",
  "UGX",
  "USD",
  "UYU",
  "UZS",
  "VES",
  "VND",
  "VUV",
  "WST",
  "XAF",
  "XCD",
  "XDR",
  "XOF",
  "XPF",
  "YER",
  "ZAR",
  "ZMW",
  "ZWL",
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

// Supported locales with IntelliSense
export const SUPPORTED_LOCALES = [
  "en-US",
  "en-GB",
  "en-CA",
  "en-AU",
  "en-IN",
  "de-DE",
  "fr-FR",
  "es-ES",
  "it-IT",
  "pt-BR",
  "pt-PT",
  "ja-JP",
  "ko-KR",
  "zh-CN",
  "zh-TW",
  "zh-HK",
  "ar-SA",
  "hi-IN",
  "bn-BD",
  "ur-PK",
  "si-LK",
  "en-LK",
  "th-TH",
  "vi-VN",
  "id-ID",
  "ms-MY",
  "fil-PH",
  "ru-RU",
  "tr-TR",
  "pl-PL",
  "nl-NL",
  "sv-SE",
  "da-DK",
  "fi-FI",
  "nb-NO",
  "cs-CZ",
  "el-GR",
  "he-IL",
  "ro-RO",
  "hu-HU",
  "uk-UA",
  "bg-BG",
] as const;

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number];

export interface InvoiceOptions {
  currency?: CurrencyCode;
  locale?: LocaleCode;
}
