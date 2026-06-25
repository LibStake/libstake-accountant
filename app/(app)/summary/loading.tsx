import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <Skeleton className="size-8" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="size-8" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
      <Skeleton className="h-8 w-full" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}
