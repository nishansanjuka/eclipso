"use client";

import React from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";
import { Button, type buttonVariants } from "./button";
import type { VariantProps } from "class-variance-authority";
import type { Button as ButtonPrimitive } from "@base-ui/react/button";

export interface TooltipButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {
  tooltip: React.ReactNode;
  tooltipSide?: "top" | "bottom" | "left" | "right";
  tooltipAlign?: "start" | "center" | "end";
}

export function TooltipButton({
  tooltip,
  tooltipSide = "top",
  tooltipAlign = "center",
  ...buttonProps
}: TooltipButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button {...buttonProps} />} />
      <TooltipContent side={tooltipSide} align={tooltipAlign}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
