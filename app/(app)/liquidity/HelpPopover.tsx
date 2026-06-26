"use client";

import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function HelpPopover({ children }: { children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="설명 보기"
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <CircleHelp className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex flex-col gap-2 text-xs leading-relaxed text-muted-foreground"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
