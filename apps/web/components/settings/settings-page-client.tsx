"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
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
import { LogoUpload } from "@/components/settings/logo-upload";
import { COUNTRIES, TYPES } from "@/components/onboarding/step-business";
import { CURRENCIES, ROUNDING } from "@/components/onboarding/step-stores";
import { handleActionResponse } from "@/lib/action-client";
import { updateBusinessProfile } from "@/lib/actions/settings";
import { ACCESS_QUERY_KEY } from "@/lib/query-options/access";
import { businessProfileQueryOptions } from "@/lib/query-options/settings";

function unwrap<T>(result: Parameters<typeof handleActionResponse<T>>[0]) {
  const response = handleActionResponse(result);
  if (!response.success) throw new Error(response.error.message);
  return response.data;
}

export function SettingsPageClient() {
  const queryClient = useQueryClient();
  const { data: business } = useQuery(businessProfileQueryOptions);

  const [name, setName] = useState(business?.name ?? "");
  const [registeredName, setRegisteredName] = useState(
    business?.registeredName ?? "",
  );
  const [businessType, setBusinessType] = useState(
    business?.businessType ?? "retail",
  );
  const [registrationNumber, setRegistrationNumber] = useState(
    business?.registrationNumber ?? "",
  );
  const [phone, setPhone] = useState(business?.phone ?? "");
  const [country, setCountry] = useState(business?.country ?? "LK");
  const [addressLine, setAddressLine] = useState(business?.addressLine ?? "");
  const [city, setCity] = useState(business?.city ?? "");
  const [postalCode, setPostalCode] = useState(business?.postalCode ?? "");
  const [vatRegistered, setVatRegistered] = useState(
    business?.vatRegistered ?? false,
  );
  const [vatNumber, setVatNumber] = useState(business?.vatNumber ?? "");
  const [currency, setCurrency] = useState(business?.currency ?? "LKR");
  const [rounding, setRounding] = useState(business?.rounding ?? "none");

  const save = useMutation({
    mutationFn: async () =>
      unwrap(
        await updateBusinessProfile({
          name: name.trim(),
          registeredName: registeredName || undefined,
          businessType: businessType as "retail",
          registrationNumber: registrationNumber || undefined,
          phone: phone || undefined,
          country,
          addressLine: addressLine || undefined,
          city: city || undefined,
          postalCode: postalCode || undefined,
          vatRegistered,
          vatNumber: vatNumber || undefined,
          currency,
          rounding: rounding as "none",
        }),
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["settings", "business-profile"],
        }),
        queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEY }),
      ]);
      toast.success("Settings saved");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!business) return null;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          The business profile shown on receipts, reports and the workspace
          switcher.
        </p>
      </div>

      <div className="flex flex-col gap-6 rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Logo</h2>
        <LogoUpload name={business.name} imageUrl={business.imageUrl} />
      </div>

      <div className="flex flex-col gap-5 rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Business profile</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Registered business name" htmlFor="registered">
            <Input
              id="registered"
              value={registeredName ?? ""}
              onChange={(e) => setRegisteredName(e.target.value)}
            />
          </Field>
          <Field
            label="Name customers see"
            htmlFor="name"
            hint="Prints on receipts and shows in the app"
          >
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="What do you sell">
            <Select
              value={businessType}
              onValueChange={(v) => v && setBusinessType(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) => TYPES.find((t) => t.value === v)?.label ?? v}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Business registration number" htmlFor="reg">
            <Input
              id="reg"
              value={registrationNumber ?? ""}
              onChange={(e) => setRegistrationNumber(e.target.value)}
            />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input
              id="phone"
              type="tel"
              value={phone ?? ""}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Field label="Country">
            <Select value={country} onValueChange={(v) => v && setCountry(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) =>
                    COUNTRIES.find((c) => c.code === v)?.name ?? v
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label="Address line"
            htmlFor="address"
            className="sm:col-span-2"
          >
            <Input
              id="address"
              value={addressLine ?? ""}
              onChange={(e) => setAddressLine(e.target.value)}
            />
          </Field>
          <Field label="City" htmlFor="city">
            <Input
              id="city"
              value={city ?? ""}
              onChange={(e) => setCity(e.target.value)}
            />
          </Field>
          <Field label="Postal code" htmlFor="postal">
            <Input
              id="postal"
              value={postalCode ?? ""}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Tax &amp; currency</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="VAT registered" htmlFor="vat">
            <div className="flex h-9 items-center">
              <Switch
                id="vat"
                checked={vatRegistered}
                onCheckedChange={setVatRegistered}
              />
            </div>
          </Field>
          <Field label="VAT number" htmlFor="vatNumber">
            <Input
              id="vatNumber"
              value={vatNumber ?? ""}
              disabled={!vatRegistered}
              onChange={(e) => setVatNumber(e.target.value)}
            />
          </Field>
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
          <Field label="Cash rounding">
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
      </div>

      <div className="flex justify-end">
        <Button
          disabled={!name.trim() || save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending && <Loader2Icon className="animate-spin" />}
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
