import { z } from "zod";
import { PIN_LENGTH } from "@/lib/auth/constants";

const email = z.string().trim().toLowerCase().max(320).pipe(z.email());
const newPassword = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다.")
  .max(200);
const pin = z
  .string()
  .regex(new RegExp(`^\\d{${PIN_LENGTH}}$`), `PIN은 숫자 ${PIN_LENGTH}자리입니다.`);

export const signupInput = z.object({ email, password: newPassword });
export const loginInput = z.object({
  email,
  password: z.string().min(1).max(200),
});
export const pinInput = z.object({ pin });
export const passwordChangeInput = z.object({
  current: z.string().min(1, "현재 비밀번호를 입력해주세요."),
  next: newPassword,
});
export const passwordResetInput = z.object({ next: newPassword });

export { fieldErrors } from "./form";
