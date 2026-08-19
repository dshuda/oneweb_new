"use client";

import type { SubService } from "@/app/data/services";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn, formatReviewCount } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { FiChevronRight, FiStar } from "react-icons/fi";
import { useCart } from "./CartProvider";
import ServiceDetailsDrawer from "./ServiceDetailsDrawer";

interface ServiceCardProps {
  title: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  isBestSeller?: boolean;
  priceUnit?: string;
  serviceCount?: number;
  subServices?: SubService[];
  /** Backend ids — carried into the cart so checkout can place a real order. */
  serviceId?: number;
  /** Show the "View Details" button + bottom details drawer (default true). */
  showDetails?: boolean;
}

export default function ServiceCard({
  title,
  image,
  rating,
  reviewCount,
  price,
  isBestSeller,
  priceUnit,
  serviceCount,
  subServices,
  serviceId,
  showDetails = true,
}: ServiceCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [packagesOpen, setPackagesOpen] = useState(false);
  const { requestSchedule } = useCart();

  const subServiceList = subServices ?? [];
  const hasPackages = subServiceList.length > 0;
  const displayCount = subServices?.length ?? serviceCount;

  const bookBase = () =>
    // priceId 0 tells the API to charge the service's own InitialPrice.
    requestSchedule({ serviceTitle: title, image, price, priceUnit, serviceId, priceId: 0 });

  const bookSub = (sub: SubService) => {
    requestSchedule({
      serviceTitle: title,
      subName: sub.name,
      image,
      price: sub.price,
      priceUnit: sub.priceUnit,
      serviceId,
      priceId: sub.priceId,
    });
    setPackagesOpen(false);
  };

  const openPackages = () => {
    setDetailsOpen(false);
    setPackagesOpen(true);
  };

  return (
    <>
      <Card className="group gap-0 overflow-hidden rounded-2xl bg-white p-0 shadow-sm ring-border transition-all hover:-translate-y-1 hover:shadow-lg">
        {/* Image Container */}
        <div className="relative h-40 w-full overflow-hidden bg-gray-200 sm:h-44">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {isBestSeller && (
            <Badge className="absolute top-3 left-3 rounded-md bg-yellow-400 px-2.5 py-1 text-xs font-bold text-black hover:bg-yellow-400">
              BEST SELLER
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2.5 p-4">
          <h3 className="line-clamp-2 font-bold text-foreground">{title}</h3>

          {/* Rating — hidden when the API carries no score, so a backend
              without review data doesn't render a bare "0". */}
          {rating > 0 && (
            <div className="flex items-center gap-1.5">
              <FiStar size={15} className="fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold text-foreground">{rating}</span>
              {reviewCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({formatReviewCount(reviewCount)} reviews)
                </span>
              )}
            </div>
          )}

          {/* Price + service count */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-lg font-extrabold text-primary">
              ৳{price.toLocaleString()}
              {priceUnit && (
                <span className="ml-1 text-xs font-semibold text-primary/70">
                  {priceUnit}
                </span>
              )}
            </span>
            {displayCount !== undefined && (
              <span className="text-xs font-medium italic text-muted-foreground">
                {displayCount} {displayCount === 1 ? "Service" : "Services"}
              </span>
            )}
          </div>

          {/* Action Bar */}
          <div className="mt-1 flex items-center justify-between gap-3 border-t pt-3">
            {showDetails && (
              <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                className="flex items-center gap-0.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                View Details
                <FiChevronRight size={16} />
              </button>
            )}
            <Button
              size="sm"
              className={cn(
                "rounded-full bg-primary hover:bg-primary/90 h-auto py-2 text-sm font-bold text-white shadow-md shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer",
                showDetails ? "px-5" : "flex-1",
              )}
              onClick={() => {
                if (hasPackages) {
                  setPackagesOpen(true);
                } else {
                  bookBase();
                }
              }}
            >
              {hasPackages ? "View" : "Book Now"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Details drawer (bottom) — rich tabbed service information */}
      {showDetails && (
        <ServiceDetailsDrawer
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          title={title}
          rating={rating}
          reviewCount={reviewCount}
          price={price}
          priceUnit={priceUnit}
          displayCount={displayCount}
          hasPackages={hasPackages}
          onBookBase={() => {
            bookBase();
            setDetailsOpen(false);
          }}
          onChoosePackage={openPackages}
        />
      )}

      {/* Child category services drawer (right side) — previous UI */}
      {hasPackages && (
        <Drawer
          swipeDirection="right"
          open={packagesOpen}
          onOpenChange={setPackagesOpen}
        >
          <DrawerContent className="bg-white">
            <DrawerHeader className="border-b">
              <div className="flex items-center gap-3">
                <DrawerClose
                  aria-label="Close"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ArrowLeft size={20} />
                </DrawerClose>
                <DrawerTitle className="text-lg font-bold text-foreground">
                  {title}
                </DrawerTitle>
              </div>
              <DrawerDescription>
                Choose your preferred package — quality assured, one tap away.
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              {subServiceList.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 rounded-xl border border-border/80 bg-white p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                    <Image
                      src={image}
                      alt={sub.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {sub.name}
                    </p>
                    <p className="text-base font-bold text-primary">
                      ৳{sub.price.toLocaleString()}
                      {sub.priceUnit && (
                        <span className="ml-0.5 text-xs font-semibold text-primary/70">
                          {sub.priceUnit}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 rounded-full bg-primary hover:bg-primary/90"
                    onClick={() => bookSub(sub)}
                  >
                    Book Now
                  </Button>
                </div>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
