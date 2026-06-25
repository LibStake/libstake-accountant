import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-8">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-14 w-full" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
