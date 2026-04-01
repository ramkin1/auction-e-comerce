import { Gavel } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-foreground/10 bg-background mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-primary flex items-center justify-center">
                <Gavel className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-black text-base tracking-tight">
                ART<span className="text-primary">BID</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Kenya's premier online auction platform for artwork and antiques.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Platform
            </p>
            <ul className="space-y-2">
              {[
                { href: "/browse", label: "Browse Auctions" },
                { href: "/sell", label: "Sell an Item" },
                { href: "/dashboard", label: "My Dashboard" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-foreground/60 hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Support
            </p>
            <ul className="space-y-2">
              {[
                { href: "/faq", label: "FAQ" },
                { href: "/how-it-works", label: "How It Works" },
                { href: "/contact", label: "Contact Us" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-foreground/60 hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Payment
            </p>
            <div className="flex items-center gap-2">
              <div className="border border-border px-3 py-1.5">
                <span className="text-xs font-bold text-foreground">M-PESA</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              Secure payments via Safaricom M-Pesa STK Push.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-foreground/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ArtBid. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 bg-primary" aria-hidden />
            <span className="text-xs text-muted-foreground">International Typographic Style</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
