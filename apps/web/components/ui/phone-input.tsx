"use client";

import * as React from "react";
import PhoneInputWithCountrySelect, {
  type Country,
  type Value,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

export interface PhoneInputProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof PhoneInputWithCountrySelect>,
    "onChange" | "value"
  > {
  value?: string;
  onChange?: (value: string | undefined) => void;
  className?: string;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, defaultCountry = "LK", ...props }) => {
    return (
      <div
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring disabled:cursor-not-allowed disabled:opacity-50 items-center font-mono [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:w-full [&_.PhoneInputCountry]:mr-2 font-mono",
          className,
        )}
      >
        <PhoneInputWithCountrySelect
          defaultCountry={defaultCountry as Country}
          value={(value || "") as Value}
          onChange={(val) => onChange?.(val ? String(val) : undefined)}
          className="flex items-center w-full"
          {...props}
        />
      </div>
    );
  },
);

PhoneInput.displayName = "PhoneInput";
