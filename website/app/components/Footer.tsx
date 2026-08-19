"use client";

import { asset } from "@/app/lib/assets";
import Image from "next/image";
import Link from "next/link";
import { FiFacebook, FiInstagram, FiLinkedin, FiYoutube } from "react-icons/fi";

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Blog & Insights", href: "/blog" },
  { label: "Careers", href: "/careers" },
  { label: "Partner with Us", href: "/partner-with-us" },
];

const supportLinks = [
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Contact Support", href: "/contact-us" },
];

const socialLinks = [
  {
    icon: FiFacebook,
    href: "https://www.facebook.com/onetapservicebd/",
    label: "Facebook",
  },
  {
    icon: FiYoutube,
    href: "https://www.youtube.com/onetapservicebd",
    label: "YouTube",
  },
  {
    icon: FiInstagram,
    href: "https://www.youtube.com/@OneTapService",
    label: "Instagram",
  },
  {
    icon: FiLinkedin,
    href: "https://www.linkedin.com/company/one-tap-service-bd",
    label: "LinkedIn",
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#f9f9fb]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div>
            <div className="mb-4">
              <Image
                src={asset("/logo_onetap.svg")}
                alt="One Tap Service"
                width={69}
                height={40}
                className="h-12 w-auto"
              />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Connecting you with the best service providers for your home and
              lifestyle needs. Quality assured.
            </p>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Company</h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">
              Legal &amp; Support
            </h3>
            <ul className="space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Stay Connected */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">
              Stay Connected
            </h3>
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-sm ring-1 ring-border transition-all hover:bg-primary hover:text-white hover:ring-primary"
                  >
                    <IconComponent size={18} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t border-border/70 pt-6">
          <p className="text-center text-xs text-muted-foreground">
            © 2026 One Tap Service Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
