"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

type Props = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "inputMode" | "defaultValue" | "name"
> & {
  name: string;
  defaultValue?: string;
};

const onlyDigits = (s: string) => s.replace(/[^0-9]/g, "");
const grouped = (digits: string) =>
  digits ? Number(digits).toLocaleString("ko-KR") : "";

// 보이는 입력은 세 자리마다 콤마로 묶고, 제출값은 hidden input에 순수 숫자로 담는다.
export function AmountInput({ name, defaultValue = "", ...props }: Props) {
  const [digits, setDigits] = React.useState(() => onlyDigits(defaultValue));
  return (
    <>
      <input type="hidden" name={name} value={digits} />
      <Input
        {...props}
        inputMode="numeric"
        value={grouped(digits)}
        onChange={(e) => setDigits(onlyDigits(e.target.value))}
      />
    </>
  );
}
