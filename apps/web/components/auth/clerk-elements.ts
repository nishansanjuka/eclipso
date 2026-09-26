/**
 * Clerk renders its own card; these classes make it sit flat inside the auth
 * frame (48px fields, 12px radius, accent primary button) so it reads as part
 * of the Aperture screens rather than a widget dropped into them.
 */
export const clerkFormElements = {
  rootBox: "w-full",
  cardBox: "w-full shadow-none border-0 bg-transparent",
  card: "w-full shadow-none border-0 bg-transparent p-0 gap-5",
  header: "hidden",
  footer: "bg-transparent",
  socialButtonsBlockButton:
    "h-12 rounded-xl border border-input bg-surface text-sm font-bold shadow-none",
  formFieldLabel: "text-[13px] font-semibold",
  formFieldInput:
    "h-12 rounded-xl border border-input bg-surface px-3 text-[15px] shadow-none focus:border-primary focus:ring-4 focus:ring-accent-soft",
  formButtonPrimary:
    "h-12 rounded-[14px] bg-primary text-[15px] font-bold shadow-none hover:bg-primary-hover",
  footerActionLink: "font-bold text-accent-text",
  identityPreviewEditButton: "text-accent-text",
} as const;
