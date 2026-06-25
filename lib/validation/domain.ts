import { z } from "zod";

const optionalId = z
  .string()
  .trim()
  .max(64)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

export const txInput = z.object({
  name: z.string().trim().min(1, "지출명을 입력해주세요.").max(100),
  amount: z.coerce
    .number()
    .int("금액은 정수로 입력해주세요.")
    .positive("금액은 1원 이상이어야 해요."),
  type: z.enum(["expense", "income"]),
  categoryId: optionalId,
  paymentMethodId: optionalId,
  occurredAt: z.string().min(1, "발생일시를 확인해주세요."),
  memo: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});

export const categoryInput = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요.").max(40),
});

export const paymentInput = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요.").max(40),
  kind: z.enum(["card", "account"]),
});
