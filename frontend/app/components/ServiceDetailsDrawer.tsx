"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Asterisk,
  CircleCheck,
  CircleX,
  Droplets,
  PaintBucket,
  Plug,
  Wrench,
} from "lucide-react";
import { FiChevronDown, FiStar, FiX } from "react-icons/fi";
import { formatReviewCount } from "@/lib/utils";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  getServiceDetails,
  type EssentialIcon,
  type ServiceEssential,
} from "@/app/data/services";

interface ServiceDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  rating: number;
  reviewCount: number;
  price: number;
  priceUnit?: string;
  displayCount?: number;
  hasPackages: boolean;
  onBookBase: () => void;
  onChoosePackage: () => void;
}

const TABS = [
  { id: "about", label: "About" },
  { id: "progress", label: "Working Progress" },
  { id: "notes", label: "Service Notes" },
  { id: "faq", label: "FAQ" },
  { id: "reviews", label: "Reviews" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const ESSENTIAL_ICONS: Record<EssentialIcon, typeof Plug> = {
  socket: Plug,
  bucket: PaintBucket,
  water: Droplets,
  tool: Wrench,
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-bold text-foreground">{children}</h3>
  );
}

function ListRow({
  icon,
  color,
  text,
}: {
  icon: React.ReactNode;
  color: string;
  text: string;
}) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground">
      <span className={`mt-0.5 shrink-0 ${color}`}>{icon}</span>
      {text}
    </li>
  );
}

function EssentialsGrid({ essentials }: { essentials: ServiceEssential[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {essentials.map((item) => {
        const Icon = ESSENTIAL_ICONS[item.icon] ?? Wrench;
        return (
          <div
            key={item.label}
            className="flex flex-col items-center gap-2 rounded-xl border border-border/80 bg-muted/40 p-3 text-center"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon size={20} strokeWidth={2} />
            </span>
            <span className="text-xs font-semibold text-foreground">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ServiceDetailsDrawer({
  open,
  onOpenChange,
  title,
  rating,
  reviewCount,
  price,
  priceUnit,
  displayCount,
  hasPackages,
  onBookBase,
  onChoosePackage,
}: ServiceDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("about");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const details = getServiceDetails(title);

  // Reset to the first tab every time the drawer opens.
  useEffect(() => {
    if (open) {
      setActiveTab("about");
      setOpenFaq(0);
    }
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="bg-white sm:mx-auto sm:w-1/2">
        {/* Header */}
        <DrawerHeader className="border-b px-4 pb-3 pt-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DrawerTitle className="text-lg font-bold text-foreground">
                {title}
              </DrawerTitle>
              <div className="mt-1 flex items-center gap-1.5">
                <FiStar size={14} className="fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-bold text-foreground">
                  {rating}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({formatReviewCount(reviewCount)} reviews)
                </span>
              </div>
            </div>
            <DrawerClose
              aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <FiX size={18} />
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Tab bar */}
        <div className="scrollbar-hide flex shrink-0 gap-2 overflow-x-auto border-b px-4 py-2.5">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-foreground text-white shadow-sm"
                    : "border border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {/* About */}
          {activeTab === "about" && (
            <>
              <div className="space-y-2">
                <SectionHeading>About</SectionHeading>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {details.about}
                </p>
              </div>

              {details.includes.length > 0 && (
                <div className="space-y-2.5">
                  <SectionHeading>Service Includes</SectionHeading>
                  <ul className="space-y-2">
                    {details.includes.map((item) => (
                      <ListRow
                        key={item}
                        icon={<CircleCheck size={16} />}
                        color="text-green-600"
                        text={item}
                      />
                    ))}
                  </ul>
                </div>
              )}

              {details.excludes.length > 0 && (
                <div className="space-y-2.5">
                  <SectionHeading>Service Excludes</SectionHeading>
                  <ul className="space-y-2">
                    {details.excludes.map((item) => (
                      <ListRow
                        key={item}
                        icon={<CircleX size={16} />}
                        color="text-red-500"
                        text={item}
                      />
                    ))}
                  </ul>
                </div>
              )}

              {details.essentials.length > 0 && (
                <div className="space-y-2.5">
                  <SectionHeading>Essentials Needed on Spot</SectionHeading>
                  <EssentialsGrid essentials={details.essentials} />
                </div>
              )}
            </>
          )}

          {/* Working Progress */}
          {activeTab === "progress" && (
            <div className="space-y-4">
              <SectionHeading>Working Process</SectionHeading>
              {details.workingSteps.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Working process details are not available for this service yet.
                </p>
              ) : (
                <ol className="space-y-6">
                  {details.workingSteps.map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <div className="relative flex shrink-0 flex-col items-center">
                        {i < details.workingSteps.length - 1 && (
                          <span
                            aria-hidden
                            className="absolute top-12 bottom-[-1.5rem] left-1/2 w-px -translate-x-1/2 bg-border"
                          />
                        )}
                        <span className="text-[10px] font-bold tracking-wide text-primary">
                          Step
                        </span>
                        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                          {i + 1}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pb-1">
                        {step.image && (
                          <div className="relative mb-2 h-28 w-full overflow-hidden rounded-xl bg-gray-200 sm:h-32">
                            <Image
                              src={step.image}
                              alt={step.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <h4 className="text-sm font-bold text-foreground">
                          {step.title}
                        </h4>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* Service Notes */}
          {activeTab === "notes" && (
            <>
              {details.notes.length > 0 && (
                <div className="space-y-2.5">
                  <SectionHeading>Important Notes</SectionHeading>
                  <ul className="space-y-2">
                    {details.notes.map((note) => (
                      <ListRow
                        key={note}
                        icon={<Asterisk size={16} />}
                        color="text-orange-500"
                        text={note}
                      />
                    ))}
                  </ul>
                </div>
              )}

              {details.essentials.length > 0 && (
                <div className="space-y-2.5">
                  <SectionHeading>Essentials Needed on Spot</SectionHeading>
                  <EssentialsGrid essentials={details.essentials} />
                </div>
              )}
            </>
          )}

          {/* FAQ */}
          {activeTab === "faq" && (
            <div className="space-y-2.5">
              <SectionHeading>FAQ</SectionHeading>
              {details.faqs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No FAQs available for this service yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {details.faqs.map((faq, i) => {
                    const isOpen = openFaq === i;
                    return (
                      <div
                        key={i}
                        className="overflow-hidden rounded-xl border border-border/80 bg-white"
                      >
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => setOpenFaq(isOpen ? null : i)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/40"
                        >
                          {faq.question}
                          <FiChevronDown
                            size={16}
                            className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <p className="border-t border-border/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                            {faq.answer}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reviews */}
          {activeTab === "reviews" && (
            <div className="space-y-2.5">
              <SectionHeading>User Reviews</SectionHeading>
              {details.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No reviews yet — be the first to review this service.
                </p>
              ) : (
                <div className="divide-y divide-border/70">
                  {details.reviews.map((review) => {
                    const initials = review.name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((word) => word[0])
                      .join("")
                      .toUpperCase();
                    return (
                      <div key={review.name} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                          {initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <p className="text-sm font-bold text-foreground">
                              {review.name}
                            </p>
                            <span className="flex items-center gap-0.5 text-xs font-semibold text-foreground">
                              <FiStar
                                size={12}
                                className="fill-yellow-400 text-yellow-400"
                              />
                              {review.rating}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t p-4">
          <div className="min-w-0">
            <span className="block text-xs font-medium text-muted-foreground">
              {displayCount !== undefined
                ? `${displayCount} ${displayCount === 1 ? "Service" : "Services"}`
                : "Total"}
            </span>
            <span className="text-lg font-extrabold text-primary">
              ৳{price.toLocaleString()}
              {priceUnit && (
                <span className="ml-1 text-xs font-semibold text-primary/70">
                  {priceUnit}
                </span>
              )}
            </span>
          </div>
          <Button
            size="lg"
            className="shrink-0 rounded-xl bg-primary px-8 hover:bg-primary/90"
            onClick={() => {
              if (hasPackages) {
                onChoosePackage();
              } else {
                onBookBase();
              }
            }}
          >
            {hasPackages ? "Choose Package" : "Book Now"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
