import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between">
        <Skeleton className="size-8" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="size-8" />
      </div>
      <Skeleton className="h-8 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
