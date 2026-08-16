"use client";
import { X, Calendar, Clock } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react"
import HowToOrder from "./howToOrder";
import ReviewsSection from "./reviewsSection";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";


interface ServiceDetail {
    id: number;
    name: string;
    slug: string;
    bannerImage: string | null;
    about: string | null;
    serviceQuality: string | null;
    prices: { id: number; name: string | null; price: number }[];
    schedules: { id: number; day: string | null; startTime: string | null; endTime: string | null }[];
    cms: any;
}


interface ServiceDetailPageProps {
    params: {
        slug: string[];
    };
}

const ServiceDetails: React.FC<ServiceDetailPageProps> = ({ params }) => {
    const router = useRouter();
    const [service, setService] = useState<ServiceDetail | null>(null);
    const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null);
    const [showDateTimePicker, setShowDateTimePicker] = useState(false);
const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [selectedTime, setSelectedTime] = useState<string>("");
    const [showTimeStep, setShowTimeStep] = useState(false);
    const [isLoading, setIsloading] = useState(false);
    const [activeTab, setActiveTab] = useState(-1);


    const getService = async (slug: string[]): Promise<ServiceDetail | null> => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5102"}/api/v1/services/${slug[0]}`, {
                cache: "no-store",
            }
            );
            if (!response.ok) {
                return null;
            }

            return response.json();
        } catch {
            return null;
        }
    }



    useEffect(() => {
        setIsloading(true);
        getService(params.slug).then(service => {
            setService(service);
            setIsloading(false);
        }).catch(error => {
            console.error("Error fetching service details:", error);
        });
        setIsloading(false);
    }, [params.slug]);

    // Generate dates from today to next 7 days
    // const generateDates = () => {
    //     const dates = [];
    //     const today = new Date();
    //     for (let i = 0; i < 7; i++) {
    //         const date = new Date(today);
    //         date.setDate(today.getDate() + i);
    //         dates.push({
    //             date: date.toISOString().split('T')[0],
    //             label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    //         });
    //     }
    //     return dates;
    // };

    // Generate time slots
    const generateTimeSlots = () => {
        const times = [];

        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        const isToday =
            selectedDate &&
            selectedDate.toDateString() === now.toDateString();

        for (let i = 9; i < 18; i++) {
            for (let j = 0; j < 60; j += 30) {
                const slotDate = new Date();

                slotDate.setHours(i);
                slotDate.setMinutes(j);
                slotDate.setSeconds(0);

                // If booking today → skip past current+1hour
                if (isToday && slotDate <= oneHourLater) {
                    continue;
                }

                const hour = String(i).padStart(2, "0");
                const minute = String(j).padStart(2, "0");

                times.push(`${hour}:${minute}`);
            }
        }

        return times;
    };

    const handlePriceSelect = (priceId: number) => {
        setSelectedPriceId(priceId);
        setShowDateTimePicker(true);
        setSelectedDate(undefined);
        setSelectedTime("");
        setShowTimeStep(false);
    };

const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setShowTimeStep(true);
    setSelectedTime("");
};

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
    };

    const handleConfirm = () => {
        if (selectedDate && selectedTime) {
            const formattedDate = selectedDate.toISOString().split("T")[0];
router.push(`/checkout/${service?.id}/${selectedPriceId}?date=${formattedDate}&time=${selectedTime}`)         
        }
    };

    if (isLoading || !service) {
        <>
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Loading Service Details</h1>
                </div>
            </div>
        </>
    }

    else {


        return (
            <Fragment>
                <div className="bg-gray-900 text-white">
                    <div className="max-w-7xl mx-auto px-6 pt-16 pb-5">
                        {service.bannerImage ? (
                            <img
                                src={service.bannerImage}
                                alt={service.name}
                                width={800}
                                height={400}
                                className="w-full h-64 object-cover rounded-xl mb-8" />
                        ) : (
                            <div className="w-full h-64 bg-gray-700 rounded-xl mb-8 flex items-center justify-center">
                                <span className="text-gray-400">No image available</span>
                            </div>
                        )}

                        <h1 className="text-4xl font-bold mb-4">{service.name}</h1>

                    </div>
                </div>






                <div className="max-w-7xl mx-auto px-6 py-16">
                    {/* Pricing Table */}
                    {service.prices && service.prices.length > 0 && (
                        <section className="mb-16">
                            <h2 className="text-2xl font-bold mb-8">Pricing</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {service.prices.map((price) => (
                                    <div key={price.id} className="bg-white rounded-xl shadow-md p-6">
                                        <h3 className="text-lg font-semibold mb-2">{price.name || 'Standard'}</h3>
                                        <p className="text-3xl font-bold text-[#64399C] mb-4">৳{price.price}</p>
                                        <button className="w-full bg-[#64399C] text-white py-2 rounded-lg hover:bg-[#4a2c7a] transition-colors" onClick={() => handlePriceSelect(price.id)}>

                                            {selectedPriceId === price.id && <i>✓ &nbsp;</i>}
                                            Select
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <nav className="flex justify-centerhidden md:flex items-center space-x-8">
                        <div className="btn btn-sm" onClick={() => setActiveTab(0)}>About</div>
                        <div className="btn btn-sm" onClick={() => setActiveTab(1)}>How To Order</div>
                        <div className="btn btn-sm" onClick={() => setActiveTab(2)}>FAQs</div>
                        <div className="btn btn-sm" onClick={() => setActiveTab(3)}>Reviews</div>
                        <div className="btn btn-sm" onClick={() => setActiveTab(4)}>Details</div>
                    </nav>
                    {/* content  */}
                    <div className="max-w-7xl mx-auto px-6 py-3">
                        {service.cms?.about && (activeTab == -1 || activeTab == 0) && (
                            <div
                                className="prose prose-invert max-w-none mt-8"
                                dangerouslySetInnerHTML={{ __html: service.cms?.about }}
                            />
                        )}
                        {(activeTab == -1 || activeTab == 1) && (
                            <HowToOrder />
                        )}
                        {service.cms?.faq && (activeTab == -1 || activeTab == 2) && (
                            <div
                                className="prose prose-invert max-w-none mt-8"
                                dangerouslySetInnerHTML={{ __html: service.cms.faq }}
                            />
                        )}
                        {(activeTab == -1 || activeTab == 3) && (
                            <ReviewsSection />
                        )}
                        {service.cms?.detail && (activeTab == -1 || activeTab == 4) && (
                            <div
                                className="prose prose-invert max-w-none mt-8"
                                dangerouslySetInnerHTML={{ __html: service.cms.detail }}
                            />
                        )}
                    </div>





                    {/* Book Now Button */}
                    {selectedPriceId && selectedDate && selectedTime && (
                        <div className="text-center">
                            {/* <Link
                            href={`/checkout/${service.id}/${selectedPriceId}?date=${selectedDate}&time=${selectedTime}`}  className="bg-[#64399C] text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-[#4a2c7a] transition-colors inline-block" >
                            Book This Service
                        </Link> */}
                        </div>
                    )}
                </div>

                {/* Date and Time Picker Modal */}
                {showDateTimePicker && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-[#64399C] to-[#4a2c7a] px-6 py-6 flex justify-between items-center sticky top-0">
                                <div className="flex items-center gap-3">
                                    {!showTimeStep ? (
                                        <>
                                            <Calendar className="w-6 h-6 text-white" />
                                            <h2 className="text-2xl font-bold text-white">Select Date</h2>
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="w-6 h-6 text-white" />
                                            <h2 className="text-2xl font-bold text-white">Select Time</h2>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowDateTimePicker(false)}
                                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                {!showTimeStep ? (
                                    <div className="space-y-4">
                                        <p className="text-gray-600 mb-6">
                                            Choose your booking date
                                        </p>

                                        <div className="flex justify-center">
                                            <DayPicker
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={handleDateSelect}
                                                disabled={{ before: new Date() }}
                                                className="border rounded-xl p-4"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    // Time Selection Step
                                    <div className="space-y-4">
                                        <p className="text-gray-600 mb-6">Choose your preferred time slot</p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-96 overflow-y-auto pr-2">
                                            {generateTimeSlots().map((time) => (
                                                <button
                                                    key={time}
                                                    onClick={() => handleTimeSelect(time)}
                                                    className={`p-3 rounded-lg border-2 transition-all font-semibold text-sm ${selectedTime === time
                                                        ? "border-[#64399C] bg-gradient-to-br from-[#64399C] from-10% to-[#4a2c7a] text-white shadow-lg"
                                                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#64399C] hover:bg-purple-50"
                                                        }`}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="bg-gray-50 px-8 py-6 flex justify-between items-center gap-3 border-t">
                                {showTimeStep && (
                                    <button
                                        onClick={() => {
                                            setShowTimeStep(false);
                                            setSelectedTime("");
                                        }}
                                        className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
                                    >
                                        Back
                                    </button>
                                )}
                                <div className="flex-1" />
                                {showTimeStep ? (
                                    <button
                                        onClick={handleConfirm}
                                        disabled={!selectedDate || !selectedTime}
                                        className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${selectedDate && selectedTime
                                            ? "bg-gradient-to-r from-[#64399C] to-[#4a2c7a] hover:shadow-lg hover:scale-105"
                                            : "bg-gray-300 cursor-not-allowed"
                                            }`}
                                    >
                                        Confirm & Proceed
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => selectedDate && setShowTimeStep(true)}
                                        disabled={!selectedDate}
                                        className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${selectedDate
                                            ? "bg-gradient-to-r from-[#64399C] to-[#4a2c7a] hover:shadow-lg hover:scale-105"
                                            : "bg-gray-300 cursor-not-allowed"
                                            }`}
                                    >
                                        Next
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Fragment>
        )
    }
}

export default ServiceDetails;