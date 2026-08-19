import { useRouter, usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Metadata } from 'next';
import ServiceGrid from '@/components/services/servicesGrid';



// SEO section start here ------------------------------------------------------------------

type Props = {
  params: {
    slug: string;
  },

  searchParams: {
      search?: string;
      categoryId?: string;
  }
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const serviceName = params.slug?.replace("-", " ") ?? '';

  return {
      metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ),
    title: `${serviceName} Services`,
    description: `Book professional ${serviceName} services near you.`,
    keywords: [serviceName, "home services"],
    openGraph: {
      title: `${serviceName} Services`,
      description: `Professional ${serviceName} experts.`,
      images: ["/images/service-banner.jpg"],
    },
  };
}

// SEO section end here here -----------------------------------------------------------------

const   ServicesPage:React.FC<Props>=({searchParams, params})=> {

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const searchValue = formData.get('search') as string;
    //const params = new URLSearchParams(searchParams.toString());
    if (searchValue) {
   //   params.set('search', searchValue);
    } else {
     // params.delete('search');
    }
  //  router.push(`${pathname}?${params.toString()}`);
  };



  return (
    <div>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Our Services</h1>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <form className="flex-1">
            <input
              type="text"
              name="search"
              defaultValue={searchParams.search || ''}
              placeholder="Search services..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </form>
        </div>
        <ServiceGrid search={searchParams.search} categoryId={searchParams.categoryId} />

      </div>
    </div>
  );
}

export default ServicesPage;