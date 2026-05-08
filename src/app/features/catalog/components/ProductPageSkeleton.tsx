export function ProductPageSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-16 animate-pulse">
      <div className="mb-8 h-4 w-64 rounded bg-gray-200" />
      <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
        <div className="w-full md:w-1/2">
          <div className="aspect-square rounded-[16px] bg-gray-200" />
          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="aspect-square rounded-[12px] bg-gray-100" />
            <div className="aspect-square rounded-[12px] bg-gray-100" />
            <div className="aspect-square rounded-[12px] bg-gray-100" />
            <div className="aspect-square rounded-[12px] bg-gray-100" />
          </div>
        </div>
        <div className="w-full md:w-1/2 space-y-4">
          <div className="h-4 w-28 rounded bg-gray-200" />
          <div className="h-10 w-4/5 rounded bg-gray-200" />
          <div className="h-4 w-40 rounded bg-gray-100" />
          <div className="h-8 w-36 rounded bg-gray-200" />
          <div className="h-20 w-full rounded bg-gray-100" />
          <div className="h-16 w-full rounded bg-gray-100" />
          <div className="h-14 w-full rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
