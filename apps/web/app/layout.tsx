import type { Metadata } from "next";
import { Nunito } from "next/font/google";
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

const nunito = Nunito({
  variable: "--font-nunito-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eclipso — Point of Sale",
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
      }}
    >
      <html
        lang="en"
        className={`${nunito.className} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
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
