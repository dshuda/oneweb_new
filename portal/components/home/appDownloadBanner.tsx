// components/AppDownloadBanner.tsx

import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/assets";


export default function AppDownloadBanner() {

  const _title = "Everything at your fingertips.";
  const description = "Download the One Tap Service app for faster bookings, exclusive offers, and real-time tracking.";
  const image = asset("/img/mobile-screen.png");



  return (
    <section className="w-full py-8 max-w-7xl mx-auto px-12">
      <div className="overflow-hidden rounded-[32px] bg-[#071B46]">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center">
          {/* Left Content */}
          <div className="px-8 py-12 md:px-14">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight text-white max-w-md">
              Everything at your{" "}
              <span className="text-purple-400">
                fingertips.
              </span>
            </h2>

            <p className="mt-6 text-gray-300 max-w-lg leading-7">
              {description}
            </p>

            {/* Store Buttons */}
            <div className="flex flex-wrap gap-4 mt-8">
             <div className="col-6 col-sm-4 col-md-3">
                                <Link href="https://play.google.com/store/apps/details?id=com.lifeplus.onetapservice" target="_blank">
                                    <Image src={asset("/img/google-play.svg")} className="btn-transition" width={100} height={40} alt="google-store"/>
                                </Link>
                            </div>

              <div className="col-6 col-sm-4 col-md-3">
                <Link href="https://apps.apple.com/us/app/one-tap-service/id6745725043">
                  <Image src={asset("/img/app-store.svg")} className="btn-transition" width={120} height={40} alt="app-store"/>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative h-[300px] md:h-[420px]">
            <Image
              src={image}
              alt="Mobile App"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
