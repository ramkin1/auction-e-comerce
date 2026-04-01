import { trpc } from "@/lib/trpc";
import { ItemCard } from "@/components/ItemCard";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getLoginUrl, CATEGORIES } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowRight, Gavel, Shield, Zap } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: featured, isLoading } = trpc.items.featured.useQuery({ limit: 6 });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ─── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="border-b border-foreground/10">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
            {/* Left: copy */}
            <div className="lg:col-span-7 flex flex-col justify-center py-16 lg:pr-16 lg:border-r border-foreground/10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-primary" aria-hidden />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Kenya's Premier Art Auction
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tight mb-8 text-foreground">
                BID ON<br />
                <span className="text-primary">RARE</span><br />
                ARTWORKS
              </h1>
              <p className="text-base text-muted-foreground max-w-md mb-10 leading-relaxed">
                Discover authenticated artwork and antiques. Place bids in real-time,
                pay securely via M-Pesa, and own a piece of history.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider px-8 h-12"
                >
                  <Link href="/browse">Browse Auctions</Link>
                </Button>
                {!isAuthenticated && (
                  <Button
                    variant="outline"
                    className="border-foreground/30 font-bold uppercase tracking-wider px-8 h-12"
                    onClick={() => (window.location.href = getLoginUrl())}
                  >
                    Sign In to Bid
                  </Button>
                )}
              </div>
            </div>

            {/* Right: stats grid */}
            <div className="lg:col-span-5 grid grid-cols-2 border-t lg:border-t-0">
              {[
                { label: "Active Auctions", value: "200+", accent: true },
                { label: "Categories", value: "6" },
                { label: "M-Pesa Payments", value: "Instant" },
                { label: "Authenticated Items", value: "100%" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`p-8 border-b border-r border-foreground/10 flex flex-col justify-end ${
                    stat.accent ? "bg-primary text-primary-foreground" : ""
                  }`}
                >
                  <p
                    className={`text-3xl font-black mb-1 ${
                      stat.accent ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {stat.value}
                  </p>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      stat.accent ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Categories ───────────────────────────────────────────────────────── */}
      <section className="border-b border-foreground/10">
        <div className="container py-8">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">
              Browse by
            </span>
            <div className="w-px h-4 bg-foreground/20 shrink-0" />
            {CATEGORIES.slice(1).map((cat) => (
              <Link
                key={cat.value}
                href={`/browse?category=${cat.value}`}
                className="shrink-0 px-4 py-2 border border-foreground/20 text-xs font-bold uppercase tracking-wider text-foreground/70 hover:border-primary hover:text-primary transition-colors"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Auctions ────────────────────────────────────────────────── */}
      <section className="border-b border-foreground/10">
        <div className="container py-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-4 h-4 bg-primary" aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Live Now
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight">Featured Auctions</h2>
            </div>
            <Button variant="ghost" asChild className="gap-2 font-bold uppercase tracking-wider text-xs">
              <Link href="/browse">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-background aspect-[4/5] animate-pulse bg-muted" />
              ))}
            </div>
          ) : !featured?.length ? (
            <div className="border border-dashed border-foreground/20 py-20 text-center">
              <Gavel className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">No active auctions yet.</p>
              <Button asChild className="mt-4 bg-primary text-primary-foreground">
                <Link href="/sell">List the First Item</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
              {featured.map((item) => (
                <ItemCard key={item.id} item={item} className="bg-background" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────────────── */}
      <section className="border-b border-foreground/10">
        <div className="container py-16">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-4 h-4 bg-primary" aria-hidden />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Process
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border">
            {[
              { step: "01", title: "Register", desc: "Create your account and verify your identity to start bidding." },
              { step: "02", title: "Browse & Bid", desc: "Explore authenticated artwork and antiques. Place bids above the current price." },
              { step: "03", title: "Win", desc: "If your bid is highest when the auction ends, you win the item." },
              { step: "04", title: "Pay via M-Pesa", desc: "Complete payment securely via M-Pesa STK Push within 24 hours." },
            ].map((s) => (
              <div key={s.step} className="bg-background p-8">
                <div className="text-5xl font-black text-primary/20 mb-4">{s.step}</div>
                <h3 className="font-black text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trust signals ────────────────────────────────────────────────────── */}
      <section className="border-b border-foreground/10">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            {[
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Authenticated Items",
                desc: "Every item comes with seller-uploaded certificates of authenticity, appraisals, and provenance records.",
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Instant M-Pesa",
                desc: "Pay securely via Safaricom M-Pesa. STK Push sent directly to your phone — no card required.",
              },
              {
                icon: <Gavel className="h-6 w-6" />,
                title: "Real-Time Bidding",
                desc: "Live countdown timers and instant bid updates. Never miss an auction with outbid notifications.",
              },
            ].map((f, i) => (
              <div key={i} className="bg-background p-8 flex gap-4">
                <div className="w-10 h-10 bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-black text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="bg-foreground text-background">
          <div className="container py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-4xl font-black tracking-tight mb-4">
                  Ready to Start Bidding?
                </h2>
                <p className="text-background/60 leading-relaxed">
                  Join thousands of collectors discovering unique artwork and antiques on ArtBid.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider px-8 h-12"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Create Account
                </Button>
                <Button
                  variant="outline"
                  className="border-background/30 text-background hover:bg-background/10 font-bold uppercase tracking-wider px-8 h-12"
                  asChild
                >
                  <Link href="/browse">Browse First</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
