export default function DestinationsLoading() {
  return (
    <>
      <div className="h-[50vh] min-h-[360px] w-full bg-soft animate-pulse" />
      <section className="bg-soft py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-10 h-20 rounded-2xl border border-black/5 bg-white shadow-sm animate-pulse" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm"
              >
                <div className="aspect-[16/10] bg-soft animate-pulse" />
                <div className="p-5">
                  <div className="h-4 w-1/3 bg-soft rounded animate-pulse" />
                  <div className="mt-3 h-5 w-3/4 bg-soft rounded animate-pulse" />
                  <div className="mt-2 h-4 w-full bg-soft rounded animate-pulse" />
                  <div className="mt-1.5 h-4 w-2/3 bg-soft rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
