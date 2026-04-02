import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Gavel, Menu, Moon, Sun, User, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

const NAV_LINKS = [
  { href: "/browse", label: "Browse" },
  { href: "/sell", label: "Sell" },
  { href: "/orders", label: "Orders" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      window.location.href = "/";
    },
  });

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-foreground/10">
      <div className="container">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
              <Gavel className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-black text-lg tracking-tight text-foreground">
              AIR<span className="text-primary">BID</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-4 text-sm font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                  location === link.href
                    ? "text-primary border-primary"
                    : "text-foreground/60 border-transparent hover:text-foreground hover:border-foreground/20"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Theme toggle + Auth */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="border border-foreground/20"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-foreground/20">
                    <User className="h-4 w-4" />
                    <span className="max-w-[120px] truncate">{user?.name ?? "Account"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/sell">List an Item</Link>
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="text-primary font-semibold">
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout.mutate()}
                    className="text-destructive"
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2 text-sm font-semibold uppercase tracking-wider ${
                  location === link.href ? "text-primary" : "text-foreground/60"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-4 pt-2">
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => logout.mutate()}
                >
                  Sign Out
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="w-full bg-primary text-primary-foreground"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
