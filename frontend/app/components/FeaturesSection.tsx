"use client";

import { Card } from "@/components/ui/card";
import { FiCheckCircle, FiClock, FiCreditCard, FiShield } from "react-icons/fi";

const features = [
  {
    id: 1,
    icon: FiShield,
    title: "Verified Providers",
    description: "Background checked and highly skilled professionals.",
  },
  {
    id: 2,
    icon: FiClock,
    title: "On-time Service",
    description: "We value your time. Guaranteed punctuality every time.",
  },
  {
    id: 3,
    icon: FiCreditCard,
    title: "Transparent Pricing",
    description: "No hidden costs. Pay only for the service you get.",
  },
  {
    id: 4,
    icon: FiCheckCircle,
    title: "Service Warranty",
    description: "Up to 7 days of service warranty for your peace of mind.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Features Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Card
                key={feature.id}
                className="items-center gap-3 rounded-2xl p-6 text-center shadow-sm ring-border transition-all hover:-translate-y-1 hover:shadow-md"
              >
                {/* Icon */}
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                  <IconComponent size={30} className="text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-foreground">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
