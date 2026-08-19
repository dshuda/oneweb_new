// app/components/FeaturesSection.tsx
"use client";

import React from "react";

//import { ShieldCheckIcon, ClockIcon, CurrencyDollarIcon, DocumentCheckIcon } from "@heroicons/react/24/outline";

interface Feature {
    id: string;
    title: string;
    description: string;
    iconClass: string;
    svg: React.ReactNode
}

const FEATURES: Feature[] = [
    {
        id: "verified",
        title: "Verified Providers",
        description: "Background checked and highly skilled professionals.",
        iconClass: "fas fa-shield-alt",
        svg: <svg width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.4 31.5L8.55 26.7L3.15 25.5L3.675 19.95L0 15.75L3.675 11.55L3.15 6L8.55 4.8L11.4 0L16.5 2.175L21.6 0L24.45 4.8L29.85 6L29.325 11.55L33 15.75L29.325 19.95L29.85 25.5L24.45 26.7L21.6 31.5L16.5 29.325L11.4 31.5ZM12.675 27.675L16.5 26.025L20.4 27.675L22.5 24.075L26.625 23.1L26.25 18.9L29.025 15.75L26.25 12.525L26.625 8.325L22.5 7.425L20.325 3.825L16.5 5.475L12.6 3.825L10.5 7.425L6.375 8.325L6.75 12.525L3.975 15.75L6.75 18.9L6.375 23.175L10.5 24.075L12.675 27.675ZM14.925 21.075L23.4 12.6L21.3 10.425L14.925 16.8L11.7 13.65L9.6 15.75L14.925 21.075Z" fill="#64399C" />
        </svg>

    },
    {
        id: "ontime",
        title: "On-time Service",
        description: "We value your time. Guaranteed punctuality every time.",
        iconClass: "fas fa-clock",
        svg: <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.95 22.05L22.05 19.95L16.5 14.4V7.5H13.5V15.6L19.95 22.05ZM15 30C12.925 30 10.975 29.6063 9.15 28.8188C7.325 28.0312 5.7375 26.9625 4.3875 25.6125C3.0375 24.2625 1.96875 22.675 1.18125 20.85C0.39375 19.025 0 17.075 0 15C0 12.925 0.39375 10.975 1.18125 9.15C1.96875 7.325 3.0375 5.7375 4.3875 4.3875C5.7375 3.0375 7.325 1.96875 9.15 1.18125C10.975 0.39375 12.925 0 15 0C17.075 0 19.025 0.39375 20.85 1.18125C22.675 1.96875 24.2625 3.0375 25.6125 4.3875C26.9625 5.7375 28.0312 7.325 28.8188 9.15C29.6063 10.975 30 12.925 30 15C30 17.075 29.6063 19.025 28.8188 20.85C28.0312 22.675 26.9625 24.2625 25.6125 25.6125C24.2625 26.9625 22.675 28.0312 20.85 28.8188C19.025 29.6063 17.075 30 15 30ZM15 27C18.325 27 21.1562 25.8312 23.4937 23.4937C25.8312 21.1562 27 18.325 27 15C27 11.675 25.8312 8.84375 23.4937 6.50625C21.1562 4.16875 18.325 3 15 3C11.675 3 8.84375 4.16875 6.50625 6.50625C4.16875 8.84375 3 11.675 3 15C3 18.325 4.16875 21.1562 6.50625 23.4937C8.84375 25.8312 11.675 27 15 27Z" fill="#64399C" />
        </svg>

    },
    {
        id: "pricing",
        title: "Transparent Pricing",
        description: "No hidden costs. Pay only for the service you get.",
        iconClass: "fas fa-tag",
        svg: <svg width="33" height="24" viewBox="0 0 33 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.5 13.5C18.25 13.5 17.1875 13.0625 16.3125 12.1875C15.4375 11.3125 15 10.25 15 9C15 7.75 15.4375 6.6875 16.3125 5.8125C17.1875 4.9375 18.25 4.5 19.5 4.5C20.75 4.5 21.8125 4.9375 22.6875 5.8125C23.5625 6.6875 24 7.75 24 9C24 10.25 23.5625 11.3125 22.6875 12.1875C21.8125 13.0625 20.75 13.5 19.5 13.5ZM9 18C8.175 18 7.46875 17.7062 6.88125 17.1187C6.29375 16.5312 6 15.825 6 15V3C6 2.175 6.29375 1.46875 6.88125 0.88125C7.46875 0.29375 8.175 0 9 0H30C30.825 0 31.5313 0.29375 32.1188 0.88125C32.7063 1.46875 33 2.175 33 3V15C33 15.825 32.7063 16.5312 32.1188 17.1187C31.5313 17.7062 30.825 18 30 18H9ZM12 15H27C27 14.175 27.2938 13.4688 27.8813 12.8813C28.4688 12.2938 29.175 12 30 12V6C29.175 6 28.4688 5.70625 27.8813 5.11875C27.2938 4.53125 27 3.825 27 3H12C12 3.825 11.7062 4.53125 11.1187 5.11875C10.5312 5.70625 9.825 6 9 6V12C9.825 12 10.5312 12.2938 11.1187 12.8813C11.7062 13.4688 12 14.175 12 15ZM28.5 24H3C2.175 24 1.46875 23.7062 0.88125 23.1187C0.29375 22.5312 0 21.825 0 21V4.5H3V21H28.5V24ZM9 15V3V15Z" fill="#64399C" />
        </svg>

    },
    {
        id: "warranty",
        title: "Service Warranty",
        description: "Up to 7 days of service warranty for your peace of mind.",
        iconClass: "fas fa-file-signature",
        svg: <svg width="24" height="30" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.425 20.325L18.9 11.85L16.7625 9.7125L10.425 16.05L7.275 12.9L5.1375 15.0375L10.425 20.325ZM12 30C8.525 29.125 5.65625 27.1312 3.39375 24.0187C1.13125 20.9062 0 17.45 0 13.65V4.5L12 0L24 4.5V13.65C24 17.45 22.8688 20.9062 20.6063 24.0187C18.3438 27.1312 15.475 29.125 12 30ZM12 26.85C14.6 26.025 16.75 24.375 18.45 21.9C20.15 19.425 21 16.675 21 13.65V6.5625L12 3.1875L3 6.5625V13.65C3 16.675 3.85 19.425 5.55 21.9C7.25 24.375 9.4 26.025 12 26.85Z" fill="#64399C" />
        </svg>

    },
];

export default function FeaturesSection() {
    return (
        <section className="py-16 md:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Grid layout - responsive: 1 column on mobile, 2 on tablet, 4 on desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {FEATURES.map((feature) => (
                        <div
                            key={feature.id}
                            className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* Icon circle with brand color */}
                            <div className="w-14 h-14 rounded-full bg-[#64399C]/10 flex items-center justify-center text-[#64399C] mb-4 group-hover:bg-[#64399C] group-hover:text-white transition-all duration-300">
                                {feature.svg}
                            </div>

                            {/* Title */}
                            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                                {feature.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm md:text-base text-gray-500 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}