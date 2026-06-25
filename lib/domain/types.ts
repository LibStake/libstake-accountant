export type TxType = "expense" | "income";
export type PaymentKind = "card" | "account";
export type TxSource = "manual" | "recurring";

export type Category = { id: string; name: string; order: number };

export type Payment = {
  id: string;
  name: string;
  kind: PaymentKind;
  archived: boolean;
  order: number;
};

export type Transaction = {
  id: string;
  name: string;
  amount: number;
  type: TxType;
  categoryId: string | null;
  paymentMethodId: string | null;
  occurredAt: Date;
  memo: string | null;
  source: TxSource;
};
