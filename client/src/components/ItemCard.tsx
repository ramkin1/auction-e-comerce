import { Link } from "wouter";
import { CountdownTimer } from "./CountdownTimer";
import { formatKES, CATEGORY_LABELS } from "@/const";
import { Gavel } from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: {
    id: number;
    title: string;
    description?: string | null;
    category: string;
    currentPrice: string | number;
    imageUrl?: string | null;
    endTime: number;
    status: string;
    bidCount: number;
  };
  className?: string;
}

export function ItemCard({ item, className }: ItemCardProps) {
  const isEnded = item.status !== "active" || Date.now() > item.endTime;

  return (
    <Link href={`/items/${item.id}`}>
      <article
        className={cn(
          "group bg-card border border-border hover:border-foreground transition-colors duration-150 cursor-pointer",
          className
        )}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Gavel className="h-12 w-12 opacity-20" />
            </div>
          )}
          {/* Category badge */}
          <div className="absolute top-0 left-0 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest px-2 py-1">
            {CATEGORY_LABELS[item.category] ?? item.category}
          </div>
          {/* Status badge */}
          {isEnded && (
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-1">
              Ended
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 border-t border-border">
          <h3 className="font-bold text-sm leading-tight line-clamp-2 mb-3 text-foreground group-hover:text-primary transition-colors">
            {item.title}
          </h3>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                Current Bid
              </p>
              <p className="text-lg font-black text-foreground">
                {formatKES(item.currentPrice)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                {isEnded ? "Status" : "Ends In"}
              </p>
              {isEnded ? (
                <span className="text-sm font-bold text-muted-foreground">Ended</span>
              ) : (
                <CountdownTimer endTime={item.endTime} showIcon={false} className="text-sm" />
              )}
            </div>
          </div>

          {/* Bid count */}
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-1 text-[11px] text-muted-foreground">
            <Gavel className="h-3 w-3" />
            <span>{item.bidCount} bid{item.bidCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
