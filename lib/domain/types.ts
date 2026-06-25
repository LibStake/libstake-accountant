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

export type Freq = "yearly" | "monthly" | "weekly" | "daily";
export type RecurMode = "auto" | "notify";
export type ExpiryPolicy = "skip" | "add" | "hold";
export type OccStatus = "pending" | "approved" | "skipped" | "auto";

// 결제일시 인코딩: 연=month+day+시각, 월=day+시각, 주=weekday+시각, 일=시각.
export type RecurringDef = {
  id: string;
  name: string;
  type: TxType;
  amount: number;
  categoryId: string | null;
  paymentMethodId: string | null;
  freq: Freq;
  month: number;
  day: number;
  weekday: number;
  hour: number;
  minute: number;
  mode: RecurMode;
  expiry: ExpiryPolicy;
};

// 도래 회차 — 정의가 특정 결제일시에 발화한 인스턴스(생성 시 정의값 스냅샷).
export type Occurrence = {
  id: string;
  defId: string;
  occurredAt: Date;
  status: OccStatus;
  name: string;
  amount: number;
  type: TxType;
  categoryId: string | null;
  paymentMethodId: string | null;
};
