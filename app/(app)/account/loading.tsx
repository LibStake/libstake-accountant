import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  );
}
