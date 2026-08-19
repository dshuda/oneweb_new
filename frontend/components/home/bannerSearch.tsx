// app/components/ExpertSearchSection.tsx
"use client";

import { Service, ServiceCategory } from "@/types/home/response";
import { useState, useEffect, useCallback, useRef } from "react";
import DynamicIcon from "../dynamicIcon";
import { Wind } from "lucide-react";
import { useRouter } from "next/navigation";




interface BannerSearchProps {
    CATEGORIES: ServiceCategory[]
}

const BannerSearch: React.FC<BannerSearchProps> = ({ CATEGORIES }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
    const [selectedServiceName, setSelectedServiceName] = useState<string | null>(null);
    const router = useRouter();
    const [SERVICES, setServices] = useState<Service[]>([]);
    const [loadingServices, setLoadingServices] =
        useState(false);



    // For modal animation/mobile friendliness, we track body overflow
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isModalOpen]);

    // Open modal on search bar click (or on the "Search" button click)
    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        // reset selected category to default 'all categories' when modal closes? optional but nice UX
        // but we keep the user's last selected category (makes sense)
    };

    // Handle category selection
    const handleCategorySelect = (categoryId: number) => {
        setSelectedCategoryId(categoryId);
    };

    // Handle service selection: could show toast or just close modal (demo)
    const handleServiceSelect = (serviceName: string, serviceSlug: string) => {
        setSelectedServiceName(serviceName);
        setIsModalOpen(false);
        
        router.push(`/services/${serviceSlug}`); // navigate to service page (optional, for demo we just close modal)
    };

    // Filter services based on selected category (if "cat_all" show all services)
    useEffect(() => {
        const fetchServices = async () => {
            try {
                setLoadingServices(true);

                const url = `${process.env.NEXT_PUBLIC_API_URL ||
                    "http://localhost:5102"
                    }/api/v1/services?page=1&pageSize=50${selectedCategoryId
                        ? `&categoryId=${selectedCategoryId}`
                        : ""
                    }`;

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error("Failed to fetch services");
                }

                const data = await response.json();

                setServices(data.items || []);
            } catch (error) {
                console.error(error);
                setServices([]);
            } finally {
                setLoadingServices(false);
            }
        };

        fetchServices();
    }, [selectedCategoryId]);

    const filteredServices = SERVICES.filter((service) => {
        if (selectedCategoryId === 0) return true;
        return service;
    });

    // Get category display name (for nicer UI)
    const getCategoryName = (catId: number) => {
        if (catId === 0) return "All Categories";
        const cat = CATEGORIES.find((c) => c.id === catId);
        return cat ? cat.name : "Categories";
    };

    return (
        <>
            {/* HERO SECTION with background and title exactly matching design */}
            <section className="relative bg-[#F8F9FF]">
                <div className="relative h-96 overflow-hidden flex flex-col items-center justify-center px-4 text-center">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
                        <span>
                            Expert services,
                            <br />
                        </span>
                        <span className="text-[#64399C]">one tap away.</span>
                    </h1>

                    {/* SEARCH BAR (non-writing, opens modal) */}
                    <div className="w-full max-w-2xl mt-8 md:mt-10 ps-4 pe-0 py-2">
                        <div
                            onClick={openModal}
                            className="flex items-center bg-white rounded-2 shadow-md border border-gray-200 hover:shadow-lg transition cursor-pointer group"
                        >
                            {/* Magnifying glass icon at beginning */}
                            <div className="pl-5 pr-2 py-3 text-gray-400 group-hover:text-[#64399C] transition">
                                <span className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>

                            {/* Placeholder text (acts as input field but not editable) */}
                            <div className="flex-1 text-left text-gray-400 text-base sm:text-lg font-medium tracking-wide">
                                {selectedServiceName ? (
                                    <span className="text-gray-700">{selectedServiceName}</span>
                                ) : (
                                    <span>What expert service do you need today?</span>
                                )}
                            </div>

                            {/* Search button with text */}
                            <div className="py-1 pr-1" >
                                <button
                                    className="bg-[#64399C] hover:bg-[#542d82] text-white font-medium py-2 px-4 sm:px-6 text-sm sm:text-base transition"
                                    onClick={(e) => {
                                        e.stopPropagation(); // avoid double modal open?
                                        openModal();
                                    }}
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* MODAL: Two columns (category | services), scrollable, max-height 600px, mobile friendly */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all"
                    role="dialog"
                    aria-modal="true"
                >
                    {/* Backdrop with opacity */}
                    <div
                        className="modal-backdrop absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeModal}
                    ></div>

                    {/* Modal Panel - max-w full on mobile, max-w-4xl on larger, height auto, max-h-[600px] */}
                    <div className="modal-content relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col mx-4 sm:mx-6 max-h-[90vh] md:max-h-[600px]">
                        <button
                            onClick={closeModal}
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition rounded-full p-1 hover:bg-gray-100"
                        >
                            <i className="fas fa-times text-xl">&times;</i>
                        </button>

                        {/* Two column layout: categories (left) + services (right) */}
                        <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
                            {/* Left Column: Categories (scrollable) */}
                            <div className="w-full sm:w-1/3 bg-gray-50 border-r border-gray-100 overflow-y-auto custom-scroll">
                                <div className="py-2">
                                    {CATEGORIES.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() => handleCategorySelect(category.id)}
                                            className={`w-full text-left px-5 py-3 flex items-center gap-3 transition ${selectedCategoryId === category.id
                                                ? "bg-white text-[#64399C] font-medium shadow-sm"
                                                : "bg-[#64399C] text-white hover:bg-gray-100 hover:text-[#64399C]"
                                                }`}
                                        >
                                            <span className="text-xl"> <DynamicIcon name={category.serviceIcon || ''} w={24} h={24} /></span>
                                            <span className="truncate">{category.name}</span>
                                            {selectedCategoryId === category.id && (
                                                <i className="fas fa-chevron-right ml-auto text-xs text-[#64399C]"></i>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Right Column: Services under selected category (scrollable) */}
                            <div className="w-full sm:w-2/3 bg-white overflow-y-auto custom-scroll">
                                <div className="p-4">
                                    {/* Show category title and service count */}
                                    <div className="mb-3 flex justify-between items-center flex-wrap gap-2 border-b border-gray-100 pb-2">
                                        <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                                            <span>{getCategoryName(selectedCategoryId)}</span>
                                            <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                {filteredServices.length}
                                            </span>
                                        </h3>

                                    </div>

                                    {filteredServices.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                            <i className="fas fa-folder-open text-4xl mb-2"></i>
                                            <p>No services in this category yet.</p>
                                        </div>
                                    ) : (
                                        <ul className="space-y-2">
                                            {filteredServices.map((service) => (
                                                <li key={service.id}>
                                                    <button
                                                        onClick={() => handleServiceSelect(service.name, service.slug)}
                                                        className="w-full text-left flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-[#F3EFFA] transition group border border-transparent hover:border-[#64399C]/30"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-[#64399C]/10 flex items-center justify-center text-[#64399C]">
                                                                <i className="fas fa-briefcase text-sm"></i>
                                                            </div>
                                                            <span className="font-medium text-gray-800 group-hover:text-[#64399C]">
                                                                {service.name}
                                                            </span>
                                                        </div>
                                                        <i className="fas fa-arrow-right text-gray-300 group-hover:text-[#64399C] transition text-sm"></i>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Optional Footer note: mobile hint */}
                        <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-400 flex justify-between items-center bg-gray-50/80">
                            <span>🔍 Browse {filteredServices.length} services</span>
                            <span className="sm:hidden">📱 swipe columns →</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
export default BannerSearch;