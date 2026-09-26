"use client";

import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useDialogStore } from "@/stores";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DialogWrapperProps {
  dialogKey: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  successButtonElement?: React.ReactNode;
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  onCancel?: () => void;
  widthClass?: string;
  scrollAreaClassName?: string;
}

export function DialogWrapper({
  dialogKey,
  title,
  className,
  description,
  size,
  children,
  onCancel,
  successButtonElement,
  widthClass = "sm:max-w-2xl",
  scrollAreaClassName = "max-h-[60vh]",
}: DialogWrapperProps) {
  const setOpen = useDialogStore((s) => s.setOpen);
  const open = useDialogStore((s) => s.openDialogs.has(dialogKey));

  const handleCancel = () => {
    onCancel?.();
    setOpen(dialogKey, false);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => setOpen(dialogKey, value)}>
      <DialogPopup className={cn(widthClass, className)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        <DialogPanel>
          <ScrollArea className={cn(scrollAreaClassName, "-mx-6 px-6")}>
            {children}
          </ScrollArea>
        </DialogPanel>
        <DialogFooter className="justify-between flex">
          <Button size={size} variant={"destructive"} onClick={handleCancel}>
            Close
          </Button>
          <div className="flex-1/2 flex justify-end items-center">
            {successButtonElement}
          </div>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
