import Navbar from '@/components/Navbar';
import { Metadata } from 'next';
import ServiceDetails from '@/components/services/serviceDetails';
type Props = {
    params: {
        slug: string[];
    }
};


export async function generateMetadata({
  params}: Props): Promise<Metadata> {
  const serviceName = params.slug[0]?.replace("-", " ") ?? '';

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


const ServiceDetailPage = async ({params}: Props) => {



  return (
    <div>
      <Navbar />
      <ServiceDetails params={params}/>
    </div>
  );
}

export default ServiceDetailPage;