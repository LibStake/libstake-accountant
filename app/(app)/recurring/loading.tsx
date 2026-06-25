import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 py-8">
      <Skeleton className="h-7 w-28" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
