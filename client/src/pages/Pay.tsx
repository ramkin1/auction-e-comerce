import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatKES, getLoginUrl } from "@/const";
import { CheckCircle, Clock, Phone, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

export default function Pay() {
  const { itemId } = useParams<{ itemId: string }>();
  const id = parseInt(itemId ?? "0");
  const { isAuthenticated } = useAuth();

  const [phone, setPhone] = useState("");
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const { data: item } = trpc.items.getById.useQuery({ id }, { enabled: id > 0 });

  const initiate = trpc.payments.initiateMpesa.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setCheckoutId(data.checkoutRequestId);
      setPolling(true);
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: paymentStatus, refetch } = trpc.payments.checkStatus.useQuery(
    { checkoutRequestId: checkoutId ?? "" },
    { enabled: !!checkoutId && polling }
  );

  // Simulate complete for demo
  const simulate = trpc.payments.simulateComplete.useMutation({
    onSuccess: () => {
      toast.success("Payment simulated as complete!");
      refetch();
    },
  });

  // Poll every 3 seconds
  useEffect(() => {
    if (!polling || !checkoutId) return;
    const interval = setInterval(() => {
      refetch();
    }, 3000);
    return () => clearInterval(interval);
  }, [polling, checkoutId, refetch]);

  // Stop polling when resolved
  useEffect(() => {
    if (paymentStatus?.status === "completed" || paymentStatus?.status === "failed") {
      setPolling(false);
    }
  }, [paymentStatus]);

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="border-b border-foreground/10">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 bg-primary" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Payment
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Pay via M-Pesa</h1>
        </div>
      </div>

      <div className="container py-10 flex-1">
        <div className="max-w-lg">
          {/* Item summary */}
          {item && (
            <div className="border border-border p-6 mb-8 flex gap-4">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-20 h-20 object-cover border border-border shrink-0"
                />
              )}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Paying for
                </p>
                <p className="font-black text-lg leading-tight">{item.title}</p>
                <p className="text-2xl font-black text-primary mt-1">
                  {formatKES(item.currentPrice)}
                </p>
              </div>
            </div>
          )}

          {/* Payment status */}
          {paymentStatus && (
            <div
              className={`border p-6 mb-8 flex items-start gap-4 ${
                paymentStatus.status === "completed"
                  ? "border-green-500 bg-green-50"
                  : paymentStatus.status === "failed"
                  ? "border-red-500 bg-red-50"
                  : "border-yellow-400 bg-yellow-50"
              }`}
            >
              {paymentStatus.status === "completed" ? (
                <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
              ) : paymentStatus.status === "failed" ? (
                <XCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <Clock className="h-6 w-6 text-yellow-600 shrink-0 mt-0.5 animate-pulse" />
              )}
              <div>
                <p className="font-bold capitalize">{paymentStatus.status}</p>
                {paymentStatus.mpesaCode && (
                  <p className="text-sm text-muted-foreground mt-1">
                    M-Pesa Code: <span className="font-mono font-bold">{paymentStatus.mpesaCode}</span>
                  </p>
                )}
                {paymentStatus.resultDesc && (
                  <p className="text-sm text-muted-foreground mt-1">{paymentStatus.resultDesc}</p>
                )}
              </div>
            </div>
          )}

          {/* Payment form */}
          {!checkoutId && (
            <div className="border border-border p-6">
              <div className="flex items-center gap-2 mb-6">
                <Phone className="h-5 w-5 text-primary" />
                <h2 className="font-black text-base">Enter M-Pesa Phone Number</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                    Phone Number
                  </Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712345678"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the M-Pesa registered number (07XXXXXXXX or 254XXXXXXXXX)
                  </p>
                </div>

                <Button
                  onClick={() =>
                    item &&
                    initiate.mutate({
                      itemId: id,
                      phoneNumber: phone,
                      amount: parseFloat(String(item.currentPrice)),
                    })
                  }
                  disabled={!phone || initiate.isPending}
                  className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider h-12"
                >
                  {initiate.isPending ? "Sending STK Push..." : "Pay with M-Pesa"}
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-foreground/10">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>How it works:</strong> An STK Push notification will be sent to your phone.
                  Enter your M-Pesa PIN to complete the payment. The transaction is processed
                  securely by Safaricom.
                </p>
              </div>
            </div>
          )}

          {/* Pending: show simulate button for demo */}
          {checkoutId && paymentStatus?.status === "pending" && (
            <div className="border border-yellow-400 p-6">
              <p className="text-sm font-bold mb-2">Waiting for M-Pesa confirmation...</p>
              <p className="text-xs text-muted-foreground mb-4">
                Check your phone and enter your M-Pesa PIN. This page will update automatically.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => simulate.mutate({ checkoutRequestId: checkoutId })}
                disabled={simulate.isPending}
                className="text-xs font-bold uppercase tracking-wider border-foreground/20"
              >
                Simulate Payment (Demo)
              </Button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
