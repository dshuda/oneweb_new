"use client"
import { Fragment, useEffect, useState } from "react"
import ServiceCard from "../ServiceCard";

interface Service {
    id: number;
    name: string;
    slug: string;
    bannerImage: string | null;
    initialPrice: number;
    isTrending: boolean;
}

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface ServiceGridProps {
    search?: string;
    categoryId?: string | null;
}


const ServiceGrid = ({ search = '', categoryId = null }: ServiceGridProps) => {
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        categoryId
    );
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [servicesRes, categoriesRes] = await Promise.all([
                    fetch(
                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5102'}/api/v1/services?page=${page}&pageSize=12&search=${search}&${selectedCategory ? `categoryId=${selectedCategory}` : ''}`
                    ),
                    fetch(
                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5102'}/api/v1/services/categories`
                    ),
                ]);

                if (servicesRes.ok) {
                    const data = await servicesRes.json();
                    setServices(data.items || []);
                    setTotalPages(data.totalPages || 1);
                }

                if (categoriesRes.ok) {
                    const data = await categoriesRes.json();
                    setCategories(data || []);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [page, search, selectedCategory]);



    const handleCategoryClick = (categoryId: string | null) => {
        setSelectedCategory(categoryId);
        setPage(1);
    };


    return (
        <Fragment>
            {/* Categories Sidebar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                    <div className="bg-white rounded-xl shadow-md p-4">
                        <h3 className="font-semibold mb-4">Categories</h3>
                        <ul className="space-y-2">
                            <li>
                                <button
                                    onClick={() => handleCategoryClick(null)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === null ? 'bg-[#64399C] text-white' : 'hover:bg-gray-100'
                                        }`}
                                >
                                    All Categories
                                </button>
                            </li>
                            {categories.map((cat) => (
                                <li key={cat.id}>
                                    <button
                                        onClick={() => handleCategoryClick(cat.id.toString())}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === cat.id.toString() ? 'bg-[#64399C] text-white' : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        {cat.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Services Grid */}
                <div className="md:col-span-3">
                    {loading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : services.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {services.map((service) => (
                                <ServiceCard
                                    key={service.id}
                                    id={service.id}
                                    name={service.name}
                                    slug={service.slug}
                                    bannerImage={service.bannerImage}
                                    initialPrice={service.initialPrice}
                                    isTrending={service.isTrending}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No services found. Try a different search or category.
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-8">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`px-4 py-2 rounded-lg ${page === pageNum
                                        ? 'bg-[#64399C] text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Fragment>
    )
}

export default ServiceGrid;