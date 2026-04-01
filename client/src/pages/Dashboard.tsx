import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatKES, getLoginUrl } from "@/const";
import { Bookmark, Gavel, Package, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: summary } = trpc.watchlist.dashboardSummary.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: myBids } = trpc.bids.myBids.useQuery(undefined, { enabled: isAuthenticated });
  const { data: watchlist } = trpc.watchlist.myWatchlist.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: payments } = trpc.payments.myPayments.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-black mb-4">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to view your dashboard.</p>
            <Button
              className="bg-primary text-primary-foreground font-bold uppercase tracking-wider"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Sign In
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <div className="border-b border-foreground/10">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 bg-primary" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              My Account
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            Welcome, {user?.name?.split(" ")[0] ?? "Bidder"}
          </h1>
        </div>
      </div>

      <div className="container py-8 flex-1">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border mb-8">
          {[
            {
              icon: <Gavel className="h-5 w-5" />,
              label: "Active Bids",
              value: summary?.activeBids ?? 0,
              accent: true,
            },
            {
              icon: <Bookmark className="h-5 w-5" />,
              label: "Watchlist",
              value: summary?.watchlistCount ?? 0,
            },
            {
              icon: <TrendingUp className="h-5 w-5" />,
              label: "Items Won",
              value: summary?.wonItemsCount ?? 0,
            },
            {
              icon: <Package className="h-5 w-5" />,
              label: "Payments",
              value: summary?.completedPayments ?? 0,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-background p-6 flex items-start gap-4 ${
                stat.accent ? "border-l-4 border-primary" : ""
              }`}
            >
              <div
                className={`w-10 h-10 flex items-center justify-center shrink-0 ${
                  stat.accent ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-black">{stat.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bids">
          <TabsList className="border-b border-foreground/10 bg-transparent w-full justify-start gap-0 h-auto p-0 mb-8">
            {[
              { value: "bids", label: "My Bids" },
              { value: "watchlist", label: "Watchlist" },
              { value: "payments", label: "Payment History" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="px-6 py-3 text-sm font-bold uppercase tracking-wider rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-foreground/50 hover:text-foreground"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ─── My Bids ──────────────────────────────────────────────────────── */}
          <TabsContent value="bids">
            {!myBids?.length ? (
              <div className="border border-dashed border-foreground/20 py-16 text-center">
                <Gavel className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium mb-2">No bids placed yet.</p>
                <Button asChild className="mt-2 bg-primary text-primary-foreground font-bold uppercase tracking-wider">
                  <Link href="/browse">Browse Auctions</Link>
                </Button>
              </div>
            ) : (
              <div className="border border-border">
                <div className="grid grid-cols-5 bg-muted px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span className="col-span-2">Item</span>
                  <span>Your Bid</span>
                  <span>Current</span>
                  <span>Status</span>
                </div>
                {myBids.map((bid) => {
                  const isHighest =
                    parseFloat(String(bid.bidAmount)) >=
                    parseFloat(String(bid.itemCurrentPrice ?? 0));
                  const isEnded =
                    bid.itemStatus !== "active" || (bid.itemEndTime ?? 0) < Date.now();
                  return (
                    <div
                      key={bid.id}
                      className="grid grid-cols-5 px-4 py-3 border-t border-border items-center text-sm"
                    >
                      <div className="col-span-2 flex items-center gap-3">
                        {bid.itemImageUrl && (
                          <img
                            src={bid.itemImageUrl}
                            alt={bid.itemTitle ?? ""}
                            className="w-10 h-10 object-cover border border-border shrink-0"
                          />
                        )}
                        <Link
                          href={`/items/${bid.itemId}`}
                          className="font-semibold hover:text-primary transition-colors line-clamp-1"
                        >
                          {bid.itemTitle}
                        </Link>
                      </div>
                      <span className="font-bold">{formatKES(bid.bidAmount)}</span>
                      <span className="text-muted-foreground">
                        {formatKES(bid.itemCurrentPrice ?? 0)}
                      </span>
                      <div>
                        {isEnded ? (
                          isHighest ? (
                            <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 font-bold uppercase">
                              Won
                            </span>
                          ) : (
                            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 font-bold uppercase">
                              Lost
                            </span>
                          )
                        ) : isHighest ? (
                          <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 font-bold uppercase">
                            Winning
                          </span>
                        ) : (
                          <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 font-bold uppercase">
                            Outbid
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ─── Watchlist ────────────────────────────────────────────────────── */}
          <TabsContent value="watchlist">
            {!watchlist?.length ? (
              <div className="border border-dashed border-foreground/20 py-16 text-center">
                <Bookmark className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium mb-2">
                  Your watchlist is empty.
                </p>
                <Button asChild className="mt-2 bg-primary text-primary-foreground font-bold uppercase tracking-wider">
                  <Link href="/browse">Discover Items</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
                {watchlist.map((w) => (
                  <Link key={w.id} href={`/items/${w.itemId}`}>
                    <div className="bg-background border-0 p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex gap-3">
                        {w.itemImageUrl ? (
                          <img
                            src={w.itemImageUrl}
                            alt={w.itemTitle ?? ""}
                            className="w-16 h-16 object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted border border-border shrink-0 flex items-center justify-center">
                            <Gavel className="h-6 w-6 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm line-clamp-1">{w.itemTitle}</p>
                          <p className="text-base font-black mt-1">
                            {formatKES(w.itemCurrentPrice ?? 0)}
                          </p>
                          {w.itemEndTime && (
                            <CountdownTimer
                              endTime={w.itemEndTime}
                              className="text-xs mt-1"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── Payments ─────────────────────────────────────────────────────── */}
          <TabsContent value="payments">
            {!payments?.length ? (
              <div className="border border-dashed border-foreground/20 py-16 text-center">
                <Package className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">No payment history yet.</p>
              </div>
            ) : (
              <div className="border border-border">
                <div className="grid grid-cols-5 bg-muted px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span className="col-span-2">Item</span>
                  <span>Amount</span>
                  <span>M-Pesa Code</span>
                  <span>Status</span>
                </div>
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-5 px-4 py-3 border-t border-border items-center text-sm"
                  >
                    <div className="col-span-2 flex items-center gap-3">
                      {p.itemImageUrl && (
                        <img
                          src={p.itemImageUrl}
                          alt={p.itemTitle ?? ""}
                          className="w-10 h-10 object-cover border border-border shrink-0"
                        />
                      )}
                      <span className="font-semibold line-clamp-1">{p.itemTitle}</span>
                    </div>
                    <span className="font-bold">{formatKES(p.amount)}</span>
                    <span className="text-muted-foreground font-mono text-xs">
                      {p.mpesaCode ?? "—"}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 w-fit ${
                        p.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : p.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
