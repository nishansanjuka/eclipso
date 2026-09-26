"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { handleActionResponse } from "@/lib/action-client";
import {
  checkWorkspaceAddress,
  createBusiness,
  getOnboardingState,
  saveBusiness,
} from "@/lib/actions/onboarding";
import { tenancyConfig } from "@/lib/tenancy/host";
import { useOnboarding } from "@/stores/onboarding";
import { StepFooter, StepHeading } from "./wizard-frame";

export const COUNTRIES = [
  { code: "LK", name: "Sri Lanka" },
  { code: "IN", name: "India" },
  { code: "MV", name: "Maldives" },
  { code: "BD", name: "Bangladesh" },
  { code: "SG", name: "Singapore" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
] as const;

const TYPES = [
  { value: "retail", label: "General retail" },
  { value: "service", label: "Services" },
  { value: "manufacturing", label: "Manufacturing" },
] as const;

/** "Aperture Retail (Pvt) Ltd" -> "aperture-retail-pvt-ltd" (a starting point only). */
function suggestSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

type Availability =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "ok" }
  | { state: "bad"; reason: "invalid" | "taken" };

export function StepBusiness({ onNext }: { onNext: () => void }) {
  const { orgId, business, hydrate, setCreated } = useOnboarding();

  const [name, setName] = useState(business?.name ?? "");
  const [registeredName, setRegisteredName] = useState(
    business?.registeredName ?? "",
  );
  const [type, setType] = useState<string>(business?.businessType ?? "retail");
  const [registration, setRegistration] = useState(
    business?.registrationNumber ?? "",
  );
  const [phone, setPhone] = useState(business?.phone ?? "");
  const [country, setCountry] = useState(business?.country ?? "LK");
  const [address, setAddress] = useState(business?.addressLine ?? "");
  const [city, setCity] = useState(business?.city ?? "");
  const [postal, setPostal] = useState(business?.postalCode ?? "");
  const [typedSlug, setTypedSlug] = useState<string | null>(
    business ? business.slug : null,
  );
  // Until the owner types their own address, it follows the business name.
  const slug = typedSlug ?? suggestSlug(name);
  const [checked, setChecked] = useState<{
    slug: string;
    available: boolean;
    reason: "invalid" | "taken" | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rootDomain = tenancyConfig().rootDomain || "yourdomain";

  // Debounced availability check for the address as it is typed.
  useEffect(() => {
    if (!slug || slug === business?.slug) return;
    const handle = setTimeout(async () => {
      const response = handleActionResponse(
        await checkWorkspaceAddress({ slug }),
      );
      if (response.success) setChecked(response.data);
    }, 350);
    return () => clearTimeout(handle);
  }, [slug, business?.slug]);

  const availability: Availability =
    !slug || slug === business?.slug
      ? { state: "idle" }
      : checked?.slug === slug
        ? checked.available
          ? { state: "ok" }
          : { state: "bad", reason: checked.reason ?? "invalid" }
        : { state: "checking" };

  const slugMessage = useMemo(() => {
    if (availability.state === "bad") {
      return availability.reason === "taken"
        ? "That address is taken. Try another."
        : "Use 3-40 letters, digits or single hyphens. Some words are reserved.";
    }
    return null;
  }, [availability]);

  function validate() {
    const next: Record<string, string> = {};
    if (name.trim().length < 3) next.name = "Enter the name your customers see";
    if (!slug) next.slug = "Choose a workspace address";
    else if (availability.state === "bad")
      next.slug = slugMessage ?? "Not available";
    else if (availability.state === "checking")
      next.slug = "Checking that address…";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setBusy(true);
    try {
      const profile = {
        registeredName: registeredName || undefined,
        registrationNumber: registration || undefined,
        phone: phone || undefined,
        country,
        addressLine: address || undefined,
        city: city || undefined,
        postalCode: postal || undefined,
      };
      let id = orgId;
      if (!id) {
        const created = handleActionResponse(
          await createBusiness({
            name: name.trim(),
            slug,
            businessType: type as "retail",
            ...profile,
          }),
        );
        if (!created.success) throw new Error(created.error.message);
        id = created.data.orgId;
        setCreated(id, created.data.slug);
      } else {
        const saved = handleActionResponse(
          await saveBusiness({
            orgId: id,
            name: name.trim(),
            ...(slug !== business?.slug && { slug }),
            businessType: type as "retail",
            ...profile,
          }),
        );
        if (!saved.success) throw new Error(saved.error.message);
      }

      const state = handleActionResponse(
        await getOnboardingState({ orgId: id }),
      );
      if (!state.success) throw new Error(state.error.message);
      hydrate({ orgId: id, ...state.data });
      onNext();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StepHeading
        index={0}
        title="Tell us about the business"
        text="This is what prints on receipts and shows up on reports. You can change any of it later."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Registered business name" htmlFor="registered">
          <Input
            id="registered"
            value={registeredName}
            onChange={(e) => setRegisteredName(e.target.value)}
            placeholder="Aperture Retail (Pvt) Ltd"
          />
        </Field>
        <Field
          label="Name customers see"
          htmlFor="name"
          hint="Prints on receipts and shows in the app"
          error={errors.name}
        >
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aperture Retail"
          />
        </Field>

        <Field
          label="Workspace address"
          htmlFor="slug"
          className="sm:col-span-2"
          hint={
            <>
              Your team signs in at{" "}
              <span className="font-semibold text-foreground">
                {slug || "your-shop"}.{rootDomain}
              </span>
            </>
          }
          error={errors.slug ?? slugMessage}
        >
          <div className="relative">
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setTypedSlug(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                );
              }}
              aria-invalid={availability.state === "bad"}
              className="pr-24"
            />
            <span className="absolute inset-y-0 right-3 flex items-center gap-1 text-xs font-semibold">
              {availability.state === "checking" && (
                <span className="text-muted-foreground">Checking…</span>
              )}
              {availability.state === "ok" && (
                <span className="flex items-center gap-1 text-ok">
                  <CheckIcon className="size-3.5" /> Available
                </span>
              )}
              {availability.state === "bad" && (
                <span className="flex items-center gap-1 text-bad">
                  <XIcon className="size-3.5" /> Unavailable
                </span>
              )}
            </span>
          </div>
        </Field>

        <Field
          label="What do you sell"
          hint="Sets your starting categories and quick keys"
        >
          <Select value={type} onValueChange={(v) => v && setType(v)}>
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
            value={registration}
            onChange={(e) => setRegistration(e.target.value)}
          />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+94 11 555 0100"
          />
        </Field>
        <Field label="Country">
          <Select value={country} onValueChange={(v) => v && setCountry(v)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string) => COUNTRIES.find((c) => c.code === v)?.name ?? v}
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
        <Field label="Address line" htmlFor="address" className="sm:col-span-2">
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>
        <Field label="City" htmlFor="city">
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </Field>
        <Field label="Postal code" htmlFor="postal">
          <Input
            id="postal"
            value={postal}
            onChange={(e) => setPostal(e.target.value)}
          />
        </Field>
      </div>

      <StepFooter
        index={0}
        primary={submit}
        primaryLabel="Continue to stores"
        busy={busy}
      />
    </>
  );
}
