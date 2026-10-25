import { DishCardSkeleton } from "@/components/site/dish-card";

export default function MenuLoading() {
  return (
    <div role="status" aria-label="Loading the menu">
      <div className="h-64 border-b border-line bg-charcoal sm:h-72" />
      <div className="container-page section pt-10">
        <div className="skeleton h-12 w-full rounded-xl" />
        <div className="mt-5 flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-11 w-28 rounded-full" />
          ))}
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <DishCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
