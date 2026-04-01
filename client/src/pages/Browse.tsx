import { trpc } from "@/lib/trpc";
import { ItemCard } from "@/components/ItemCard";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/const";
import { Filter, Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearch } from "wouter";

export default function Browse() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);

  const [search, setSearch] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "all");
  const [status, setStatus] = useState("active");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, status, minPrice, maxPrice]);

  const { data, isLoading } = trpc.items.list.useQuery({
    search: debouncedSearch || undefined,
    category: category === "all" ? undefined : category,
    status: status === "all" ? undefined : status,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    page,
    limit: 12,
  });

  const totalPages = data ? Math.ceil(data.total / 12) : 1;

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setStatus("active");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  };

  const hasFilters = search || category !== "all" || status !== "active" || minPrice || maxPrice;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Page header */}
      <div className="border-b border-foreground/10">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 bg-primary" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Catalogue
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Browse Auctions</h1>
        </div>
      </div>

      <div className="container py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ─── Sidebar filters ─────────────────────────────────────────────── */}
          <aside className="lg:col-span-1">
            <div className="border border-border p-6 sticky top-20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-bold uppercase tracking-wider">Filters</span>
                </div>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary font-semibold flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search items..."
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
                  Category
                </label>
                <div className="space-y-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                        category === cat.value
                          ? "bg-primary text-primary-foreground font-bold"
                          : "hover:bg-muted text-foreground/70"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="mb-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
                  Status
                </label>
                <div className="space-y-1">
                  {[
                    { value: "all", label: "All" },
                    { value: "active", label: "Active" },
                    { value: "ended", label: "Ended" },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStatus(s.value)}
                      className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                        status === s.value
                          ? "bg-primary text-primary-foreground font-bold"
                          : "hover:bg-muted text-foreground/70"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
                  Price Range (KES)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-1/2 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-1/2 text-sm"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* ─── Results ─────────────────────────────────────────────────────── */}
          <main className="lg:col-span-3">
            {/* Results count */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-foreground/10">
              <p className="text-sm text-muted-foreground">
                {isLoading ? (
                  "Loading..."
                ) : (
                  <>
                    <span className="font-bold text-foreground">{data?.total ?? 0}</span> items found
                  </>
                )}
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-px bg-border">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-muted animate-pulse aspect-[4/5]" />
                ))}
              </div>
            ) : !data?.items.length ? (
              <div className="border border-dashed border-foreground/20 py-20 text-center">
                <p className="text-muted-foreground font-medium mb-2">No items found.</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
                {hasFilters && (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-px bg-border">
                  {data.items.map((item) => (
                    <ItemCard key={item.id} item={item} className="bg-background" />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="font-bold uppercase tracking-wider"
                    >
                      Prev
                    </Button>
                    <span className="text-sm font-medium px-4">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="font-bold uppercase tracking-wider"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
