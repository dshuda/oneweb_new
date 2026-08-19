"use client";

import { asset } from "@/app/lib/assets";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { useAuth } from "./AuthProvider";
import { useCart } from "./CartProvider";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Blogs", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact-us" },
];

const normalize = (p: string) => p.replace(/\/$/, "") || "/";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cartCount, openCart } = useCart();
  const { user, authLoaded, openAuth } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Open the login drawer when redirected here by the profile middleware
  // (/?login=1) — but only after the persisted session has been restored, so
  // a logged-in user who merely lost their cookie isn't prompted to log in.
  useEffect(() => {
    if (
      authLoaded &&
      !user &&
      new URLSearchParams(window.location.search).has("login")
    ) {
      openAuth();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [authLoaded, user, openAuth]);
  const isActive = (href: string) => normalize(pathname) === normalize(href);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="mx-auto flex max-w-6xl items-center justify-center px-4 py-5 sm:px-6">
        {/* Floating pill container */}
        <div
          className={`flex w-full items-center justify-between rounded-2xl bg-white px-4 py-2.5 transition-all duration-300 sm:px-6 ${
            scrolled
              ? "shadow-xl shadow-primary/40"
              : "shadow-lg shadow-primary/30"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src={asset("/logo_onetap.svg")}
              alt=""
              width={69}
              height={40}
              priority
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-semibold transition-colors hover:text-primary ${
                  isActive(item.href) ? "text-primary" : "text-foreground/70"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Cart"
              onClick={openCart}
              className="relative rounded-full hover:bg-primary/10 hover:text-primary"
            >
              <Image
                src={asset("/icons/cart.svg")}
                alt=""
                width={20}
                height={20}
                className="h-5 w-5"
              />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={user ? "My Profile" : "Login"}
              onClick={() => {
                if (user) {
                  router.push("/profile");
                } else {
                  openAuth();
                }
              }}
              className={`relative rounded-full hover:bg-primary/10 ${
                user
                  ? "bg-primary/10 text-primary hover:text-primary"
                  : "text-foreground/70 hover:text-primary"
              }`}
            >
              <Image
                src={asset("/icons/circle-user.svg")}
                alt=""
                width={24}
                height={24}
                className="h-5 w-5"
              />
              {user && (
                <span
                  title="Signed in"
                  className="absolute top-1 right-1 h-2 w-2 rounded-full bg-green-500 ring-2 ring-white"
                />
              )}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-full hover:bg-primary/10 hover:text-primary lg:hidden"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mx-auto max-w-6xl px-4 pb-4 sm:px-6 lg:hidden">
          <div className="rounded-2xl bg-white p-3 shadow-xl">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-primary/10 hover:text-primary ${
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
