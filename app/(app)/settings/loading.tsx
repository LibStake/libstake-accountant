import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-8">
      <Skeleton className="h-7 w-16" />
      {Array.from({ length: 2 }).map((_, s) => (
        <Skeleton key={s} className="h-48 w-full rounded-xl" />
      ))}
    </div>
  );
}
