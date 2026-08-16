"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { FaApple, FaGooglePlay } from "react-icons/fa";

export default function AppPromotion() {
  return (
    <section className="bg-white py-4 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#5e3a8a] via-[#7b52b3] to-[#a78bfa] px-6 py-0 pt-6 sm:px-12 sm:py-16 lg:mb-0 lg:pr-0">
          {/* Decorative Elements (clipped to the banner) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          </div>

          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            {/* Left Content */}
            <div className="flex flex-col">
              {/* Eyebrow badge */}
              <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                Get the App
              </span>

              <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Everything at your fingertips.
              </h2>
              <p className="mb-8 max-w-md text-base leading-relaxed text-white/90 sm:text-lg">
                Download the One Tap Service app for faster bookings, exclusive
                offers, and real-time tracking.
              </p>

              {/* Download Buttons */}
              <p className="mb-3 text-sm font-semibold text-white">
                Download the App
              </p>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<a href="#" />}
                  className="h-auto w-full items-center gap-3 rounded-xl border-transparent bg-black px-5 py-3.5 text-white shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-black/90 hover:text-white hover:shadow-xl sm:w-auto"
                >
                  <FaGooglePlay size={22} />
                  <span className="text-left leading-tight">
                    <span className="block text-[10px] text-white/70">
                      GET IT ON
                    </span>
                    <span className="block text-sm font-semibold">
                      Google Play
                    </span>
                  </span>
                </Button>
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<a href="#" />}
                  className="h-auto w-full items-center gap-3 rounded-xl border-transparent bg-black px-5 py-3.5 text-white shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-black/90 hover:text-white hover:shadow-xl sm:w-auto"
                >
                  <FaApple size={22} />
                  <span className="text-left leading-tight">
                    <span className="block text-[10px] text-white/70">
                      Download on the
                    </span>
                    <span className="block text-sm font-semibold">
                      App Store
                    </span>
                  </span>
                </Button>
              </div>
            </div>

            {/* Right - in-flow image on mobile/tablet; hidden on desktop where the absolute bleed version takes over */}
            <div className="flex justify-center lg:hidden">
              <Image
                src="/mockup-hand.webp"
                alt="One Tap Service mobile app held in hand"
                width={745}
                height={526}
                className="w-full max-w-xl"
              />
            </div>
          </div>

          {/* Mockup image bleeding past the bottom-right corner (desktop only) */}
          <Image
            src="/mockup-hand.webp"
            alt="One Tap Service mobile app held in hand"
            width={745}
            height={526}
            className="pointer-events-none absolute right-6 bottom-4 hidden h-auto w-[340px] translate-y-14 lg:right-10 lg:block lg:w-[400px] lg:translate-x-2 lg:translate-y-16 xl:w-[440px]"
          />
        </div>
      </div>
    </section>
  );
}
