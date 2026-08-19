import Link from 'next/link';

interface ServiceCardProps {
  id: number;
  name: string;
  slug: string;
  bannerImage: string | null;
  initialPrice: number;
  isTrending?: boolean;
}

export default function ServiceCard({
  id: _id,
  name,
  slug,
  bannerImage,
  initialPrice,
  isTrending,
}: ServiceCardProps) {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5102';

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {isTrending && (
        <div className="absolute top-4 left-4 bg-[#64399C] text-white text-xs font-bold px-3 py-1 rounded-full z-10">
          Trending
        </div>
      )}
      <Link href={`/services/${slug}`} className="block relative">
        {bannerImage ? (
          <img src={BASE_URL+bannerImage} alt={name} width={'100%'}    className="object-cover" />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}
      </Link>
      <div className="p-6">
        <h3 className="font-semibold text-lg text-gray-800 mb-2">{name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-[#64399C]">৳{initialPrice}</span>
          <Link
            href={`/services/${slug}`}
            className="bg-[#64399C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#004CCA] transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
