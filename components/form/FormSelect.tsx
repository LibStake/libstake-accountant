"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const EMPTY = "__none__";

type Option = { value: string; label: string };

/**
 * Radix Select를 Server Action 폼에 쓰기 위한 래퍼.
 * Radix Select는 네이티브 폼 컨트롤이 아니고 빈 문자열 값을 허용하지 않으므로,
 * 선택값을 hidden input으로 비추되 "선택 없음"은 센티넬↔"" 로 매핑한다.
 *
 * ! - emptyLabel을 주면 그 항목 선택 시 hidden input에 ""가 담긴다(서버에서 null로 해석).
 */
export function FormSelect({
  name,
  defaultValue = "",
  options,
  placeholder,
  emptyLabel,
  className,
}: {
  name: string;
  defaultValue?: string;
  options: Option[];
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
}) {
  const [value, setValue] = React.useState(
    defaultValue || (emptyLabel ? EMPTY : ""),
  );
  const submitted = value === EMPTY ? "" : value;
  return (
    <>
      <input type="hidden" name={name} value={submitted} />
      <Select value={value || undefined} onValueChange={setValue}>
        <SelectTrigger className={cn("w-full", className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {emptyLabel && <SelectItem value={EMPTY}>{emptyLabel}</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
