// 폼 화면 공통 클래스. 화면별로 흩어지지 않게 한곳에 둔다.
export const ui = {
  input:
    "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2.5 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100",
  button:
    "w-full rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900",
  ghost:
    "rounded-lg border border-zinc-300 px-4 py-2.5 font-medium disabled:opacity-50 dark:border-zinc-700",
  danger: "rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white disabled:opacity-50",
  label: "flex flex-col gap-1 text-sm",
  alert: "text-sm text-red-600",
  ok: "text-sm text-green-600",
};
