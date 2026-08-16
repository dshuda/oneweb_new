"use client";

import Image from "next/image";
import { CATEGORY_HERO_BANNER } from "@/app/data/services";

interface CategoryHeroProps {
  name: string;
  title: string;
  titleAccent: string;
  subtitle: string;
}

/**
 * Full-width category hero — purple gradient on the left with the
 * category headline, and the shared banner photo blended in on the right.
 */
export default function CategoryHero({
  name,
  title,
  titleAccent,
  subtitle,
}: CategoryHeroProps) {
  return (
    <section className="relative w-full overflow-hidden bg-primary">
      {/* Banner photo — faint backdrop on mobile, right side on desktop */}
      <div className="absolute inset-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[58%]">
        <Image
          src={CATEGORY_HERO_BANNER}
          alt=""
          fill
          priority
          sizes="(min-width: 640px) 58vw, 100vw"
          className="object-cover object-right opacity-40 sm:opacity-100"
        />
      </div>

      {/* Scrim blending the photo into the brand gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/30 sm:via-primary/60 sm:to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[420px] w-full max-w-7xl flex-col justify-center px-4 pb-14 pt-36 sm:min-h-[500px] sm:px-6 sm:pb-16 sm:pt-44 lg:min-h-[560px] lg:px-8">
        <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white ring-1 ring-white/25 backdrop-blur">
          {name}
        </p>
        <h1 className="max-w-2xl text-3xl leading-tight font-semibold text-white sm:text-5xl sm:leading-tight">
          {title} <span className="font-extrabold">{titleAccent}</span>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85 sm:mt-5 sm:text-base">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
