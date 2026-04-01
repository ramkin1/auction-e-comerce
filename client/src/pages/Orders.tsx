import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatKES, getLoginUrl } from "@/const";
import { CheckCircle, Clock, Package, XCircle } from "lucide-react";
import { Link } from "wouter";

const STATUS_CONFIG = {
  pending: {
    icon: <Clock className="h-5 w-5 text-yellow-600" />,
    label: "Awaiting Payment",
    bg: "bg-yellow-50 border-yellow-300",
    text: "text-yellow-800",
  },
  completed: {
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    label: "Payment Confirmed",
    bg: "bg-green-50 border-green-300",
    text: "text-green-800",
  },
  failed: {
    icon: <XCircle className="h-5 w-5 text-red-600" />,
    label: "Payment Failed",
    bg: "bg-red-50 border-red-300",
    text: "text-red-800",
  },
};

export default function Orders() {
  const { isAuthenticated, loading } = useAuth();
  const { data: payments, isLoading } = trpc.payments.myPayments.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: myBids } = trpc.bids.myBids.useQuery(undefined, { enabled: isAuthenticated });

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

  // Won items: bids where bidAmount >= itemCurrentPrice and item is ended
  const wonItems = myBids?.filter((b) => {
    const isEnded = b.itemStatus !== "active" || (b.itemEndTime ?? 0) < Date.now();
    const isHighest =
      parseFloat(String(b.bidAmount)) >= parseFloat(String(b.itemCurrentPrice ?? 0));
    return isEnded && isHighest;
  });

  // Check if a won item has a payment
  const paidItemIds = new Set(payments?.filter((p) => p.status === "completed").map((p) => p.itemId));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="border-b border-foreground/10">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 bg-primary" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Tracking
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Order Tracking</h1>
        </div>
      </div>

      <div className="container py-10 flex-1 space-y-12">
        {/* ─── Won Auctions ─────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-primary" aria-hidden />
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Won Auctions ({wonItems?.length ?? 0})
            </h2>
          </div>

          {!wonItems?.length ? (
            <div className="border border-dashed border-foreground/20 py-12 text-center">
              <Package className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium mb-2">No won auctions yet.</p>
              <Button asChild className="mt-2 bg-primary text-primary-foreground font-bold uppercase tracking-wider">
                <Link href="/browse">Browse Auctions</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {wonItems.map((bid) => {
                const isPaid = paidItemIds.has(bid.itemId);
                const pendingPayment = payments?.find(
                  (p) => p.itemId === bid.itemId && p.status === "pending"
                );
                return (
                  <div
                    key={bid.id}
                    className={`border p-6 flex flex-col sm:flex-row gap-4 ${
                      isPaid
                        ? "border-green-300 bg-green-50"
                        : "border-yellow-300 bg-yellow-50"
                    }`}
                  >
                    {bid.itemImageUrl && (
                      <img
                        src={bid.itemImageUrl}
                        alt={bid.itemTitle ?? ""}
                        className="w-20 h-20 object-cover border border-border shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            href={`/items/${bid.itemId}`}
                            className="font-black text-lg hover:text-primary transition-colors"
                          >
                            {bid.itemTitle}
                          </Link>
                          <p className="text-2xl font-black text-primary mt-1">
                            {formatKES(bid.bidAmount)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isPaid ? (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <span className="text-sm font-bold text-green-800">Paid</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-5 w-5 text-yellow-600" />
                              <span className="text-sm font-bold text-yellow-800">
                                Payment Pending
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {pendingPayment && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          M-Pesa request sent. Waiting for confirmation.
                        </div>
                      )}

                      {!isPaid && !pendingPayment && (
                        <Button
                          asChild
                          className="mt-3 bg-primary text-primary-foreground font-bold uppercase tracking-wider text-xs px-4 h-8"
                        >
                          <Link href={`/pay/${bid.itemId}`}>Pay Now via M-Pesa</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ─── Payment History ──────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-primary" aria-hidden />
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Payment History ({payments?.length ?? 0})
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse" />
              ))}
            </div>
          ) : !payments?.length ? (
            <div className="border border-dashed border-foreground/20 py-12 text-center">
              <p className="text-muted-foreground font-medium">No payment history yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => {
                const config = STATUS_CONFIG[payment.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                return (
                  <div
                    key={payment.id}
                    className={`border p-5 flex flex-col sm:flex-row gap-4 items-start ${config.bg}`}
                  >
                    {payment.itemImageUrl && (
                      <img
                        src={payment.itemImageUrl}
                        alt={payment.itemTitle ?? ""}
                        className="w-16 h-16 object-cover border border-border shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-black text-base">{payment.itemTitle}</p>
                          <p className="text-xl font-black text-foreground mt-0.5">
                            {formatKES(payment.amount)}
                          </p>
                          {payment.mpesaCode && (
                            <p className="text-xs text-muted-foreground mt-1 font-mono">
                              M-Pesa: {payment.mpesaCode}
                            </p>
                          )}
                          {payment.resultDesc && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {payment.resultDesc}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(payment.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {config.icon}
                          <span className={`text-sm font-bold ${config.text}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}
