import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  XCircleIcon,
} from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/components/providers/query-provider";
import "./globals.css";

const manrope = Raleway({
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aperture — Point of sale and stock",
  description: "Sales, inventory and purchasing for your business.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        theme: [shadcn],
        signIn: { theme: shadcn },
        signUp: { theme: shadcn },
        variables: {
          borderRadius: "12px",
          fontFamily: "var(--font-manrope), Segoe UI, sans-serif",
        },
      }}
    >
      <html
        lang="en"
        className={`${manrope.variable} ${manrope.className} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <TooltipProvider>
                {children}
                <Toaster
                  position="top-right"
                  closeButton
                  richColors
                  icons={{
                    success: <CheckCircleIcon className="size-4" />,
                    error: <XCircleIcon className="size-4" />,
                    warning: <AlertTriangleIcon className="size-4" />,
                    info: <InfoIcon className="size-4" />,
                  }}
                />
              </TooltipProvider>
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
