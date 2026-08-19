import Link from "next/link";
import { Fragment } from "react";

interface SliderProps  {
sliders:any[]
}

const BannerSlider:React.FC<SliderProps>=({sliders})=> {

    return (
        <Fragment>
                  <section className="relative bg-gray-900 text-white">
                    {sliders.length > 0 ? (
                      <div className="relative h-96 overflow-hidden">
                        {sliders.map((slider, index) => (
                          <div
                            key={slider.id}
                            className={`absolute inset-0 transition-opacity duration-1000 ${index === 0 ? 'opacity-100' : 'opacity-0'}`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
                            <div className="relative z-10 flex items-center h-full max-w-7xl mx-auto px-6">
                              <div>
                                <h1 className="text-4xl font-bold mb-4">{slider.title || 'Welcome to OneWeb'}</h1>
                                <Link
                                  href={slider.link || '/services'}
                                  className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                                >
                                  Explore Services
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-96 flex items-center justify-center">
                        <h1 className="text-4xl font-bold">Welcome to OneWeb</h1>
                      </div>
                    )}
                  </section>
        </Fragment>
    )
}
export default BannerSlider;