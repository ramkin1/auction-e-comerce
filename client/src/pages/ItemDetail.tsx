import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatKES, CATEGORY_LABELS, DOC_TYPE_LABELS, getLoginUrl } from "@/const";
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ExternalLink,
  FileText,
  Gavel,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const itemId = parseInt(id ?? "0");
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [bidAmount, setBidAmount] = useState("");

  const { data: item, isLoading: itemLoading } = trpc.items.getById.useQuery(
    { id: itemId },
    { refetchInterval: 10000 } // poll every 10s for live price updates
  );
  const { data: bidHistory } = trpc.bids.getByItem.useQuery(
    { itemId },
    { refetchInterval: 10000 } // poll every 10s for live bid updates
  );
  const { data: docs } = trpc.documents.getByItem.useQuery({ itemId });
  const { data: watching } = trpc.watchlist.isWatching.useQuery(
    { itemId },
    { enabled: isAuthenticated }
  );

  const placeBid = trpc.bids.place.useMutation({
    onSuccess: () => {
      toast.success("Bid placed successfully!");
      setBidAmount("");
      utils.items.getById.invalidate({ id: itemId });
      utils.bids.getByItem.invalidate({ itemId });
    },
    onError: (err) => toast.error(err.message),
  });

  const addWatch = trpc.watchlist.add.useMutation({
    onSuccess: () => {
      toast.success("Added to watchlist");
      utils.watchlist.isWatching.invalidate({ itemId });
    },
  });
  const removeWatch = trpc.watchlist.remove.useMutation({
    onSuccess: () => {
      toast.success("Removed from watchlist");
      utils.watchlist.isWatching.invalidate({ itemId });
    },
  });

  if (itemLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-bold mb-2">Item not found</p>
            <Button asChild variant="outline">
              <Link href="/browse">Back to Browse</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentPrice = parseFloat(String(item.currentPrice));
  const startingPrice = parseFloat(String(item.startingPrice));
  const isActive = item.status === "active" && Date.now() < item.endTime;
  const minBid = currentPrice + 1;
  const isOwner = user?.id === item.sellerId;

  const handleBid = () => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount < minBid) {
      toast.error(`Bid must be at least ${formatKES(minBid)}`);
      return;
    }
    placeBid.mutate({ itemId, bidAmount: amount });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Breadcrumb */}
      <div className="border-b border-foreground/10">
        <div className="container py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/browse" className="hover:text-foreground flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Browse
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate">{item.title}</span>
          </div>
        </div>
      </div>

      <div className="container py-10 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ─── Left: Image ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-7">
            <div className="aspect-[4/3] bg-muted border border-border overflow-hidden">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Gavel className="h-20 w-20 text-muted-foreground/20" />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mt-8 border-t border-foreground/10 pt-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Description
              </h2>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {item.description ?? "No description provided."}
              </p>
            </div>

            {/* Documents */}
            {docs && docs.length > 0 && (
              <div className="mt-8 border-t border-foreground/10 pt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    Authenticity Documents
                  </h2>
                </div>
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 border border-border hover:border-primary transition-colors group"
                    >
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── Right: Bid panel ─────────────────────────────────────────────── */}
          <div className="lg:col-span-5">
            <div className="sticky top-20">
              {/* Category + title */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-foreground text-background px-2 py-0.5">
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </span>
                  {!isActive && (
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-widest">
                      {item.status}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-black tracking-tight leading-tight">{item.title}</h1>
              </div>

              {/* Price block */}
              <div className="border border-foreground/20 p-6 mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Current Bid
                    </p>
                    <p className="text-3xl font-black text-foreground">{formatKES(currentPrice)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Starting Price
                    </p>
                    <p className="text-lg font-bold text-muted-foreground">
                      {formatKES(startingPrice)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-foreground/10">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      {isActive ? "Ends In" : "Status"}
                    </p>
                    {isActive ? (
                      <CountdownTimer endTime={item.endTime} className="text-base" />
                    ) : (
                      <span className="text-base font-bold text-muted-foreground capitalize">
                        {item.status}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Total Bids
                    </p>
                    <p className="text-base font-bold">{item.bidCount}</p>
                  </div>
                </div>
              </div>

              {/* Bid form */}
              {isActive && !isOwner && (
                <div className="border border-foreground/20 p-6 mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Place Your Bid (min. {formatKES(minBid)})
                  </p>
                  {isAuthenticated ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                          KES
                        </span>
                        <Input
                          type="number"
                          min={minBid}
                          step={1}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={String(minBid)}
                          className="pl-12 font-bold"
                        />
                      </div>
                      <Button
                        onClick={handleBid}
                        disabled={placeBid.isPending}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider px-6"
                      >
                        {placeBid.isPending ? "Bidding..." : "Bid"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider"
                      onClick={() => (window.location.href = getLoginUrl())}
                    >
                      Sign In to Bid
                    </Button>
                  )}
                </div>
              )}

              {/* Won — pay now */}
              {!isActive && item.status === "ended" && isAuthenticated && !isOwner && (
                <div className="border border-primary p-6 mb-4">
                  <p className="text-sm font-bold mb-3">
                    This auction has ended. If you won, complete your payment.
                  </p>
                  <Button asChild className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                </div>
              )}

              {/* Watchlist */}
              {isAuthenticated && !isOwner && (
                <Button
                  variant="outline"
                  className="w-full mb-4 font-bold uppercase tracking-wider gap-2 border-foreground/20"
                  onClick={() =>
                    watching
                      ? removeWatch.mutate({ itemId })
                      : addWatch.mutate({ itemId })
                  }
                >
                  {watching ? (
                    <>
                      <BookmarkCheck className="h-4 w-4 text-primary" /> Watching
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" /> Add to Watchlist
                    </>
                  )}
                </Button>
              )}

              {/* Seller: upload docs */}
              {isOwner && (
                <Button asChild variant="outline" className="w-full font-bold uppercase tracking-wider gap-2 border-foreground/20">
                  <Link href={`/sell/edit/${item.id}`}>
                    <FileText className="h-4 w-4" /> Manage Listing & Documents
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Bid History ──────────────────────────────────────────────────────── */}
        <div className="mt-12 border-t border-foreground/10 pt-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">
            Bid History ({bidHistory?.length ?? 0})
          </h2>
          {!bidHistory?.length ? (
            <p className="text-sm text-muted-foreground">No bids yet. Be the first to bid!</p>
          ) : (
            <div className="border border-border">
              <div className="grid grid-cols-3 bg-muted px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span>Bidder</span>
                <span>Amount</span>
                <span>Time</span>
              </div>
              {bidHistory.map((bid, i) => (
                <div
                  key={bid.id}
                  className={`grid grid-cols-3 px-4 py-3 text-sm border-t border-border ${
                    i === 0 ? "bg-primary/5 font-bold" : ""
                  }`}
                >
                  <span className="text-foreground/70">
                    {bid.userName
                      ? bid.userName.slice(0, 3) + "***"
                      : `Bidder #${bid.userId}`}
                    {i === 0 && (
                      <span className="ml-2 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 font-bold uppercase">
                        Highest
                      </span>
                    )}
                  </span>
                  <span className="font-bold">{formatKES(bid.bidAmount)}</span>
                  <span className="text-muted-foreground">
                    {new Date(bid.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
