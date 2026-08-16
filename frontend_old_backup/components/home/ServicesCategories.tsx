import Link from "next/link"
import { Fragment } from "react"
import DynamicIcon from "../dynamicIcon"
import { ServiceCategory } from "@/types/home/response"

interface ServicesCategoriesProps {
    categories:ServiceCategory[]
}

const ServicesCategories: React.FC<ServicesCategoriesProps> = ({ categories }) => {
    const bgColors = [
      "bg-blue-100 text-blue-600",
      "bg-orange-100 text-orange-600",
      "bg-cyan-100 text-cyan-600",
      "bg-pink-100 text-pink-600",
      "bg-indigo-100 text-indigo-600",
      "bg-purple-100 text-purple-600",
      "bg-green-100 text-green-600",
      "bg-yellow-100 text-yellow-700",
      "bg-red-100 text-red-600",
      "bg-emerald-100 text-emerald-600",
    ];
    
    const getRandomColor = () => {
      return bgColors[Math.floor(Math.random() * bgColors.length)];
    };
    
    return (
        <Fragment>
                  <section className="max-w-7xl mx-auto px-6 py-16">
                    {/* <h2 className="text-3xl font-bold text-center mb-12">Service Categories</h2> */}
                    <div className="grid grid-cols-3 md:grid-cols-8 gap-1">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`${cat.id > 0 ? `/services?categoryId=${cat.id}` : '/services'}`}
                          className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow"
                        >
                          <div className={`w-16 h-16 mx-auto mb-4 ${getRandomColor()} rounded-full flex items-center justify-center`}>
                            <span className="text-2xl">
                              <DynamicIcon name={cat.serviceIcon || '' } w={30} h={30} />
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-800">{cat.name}</h3>
                        </Link>
                      ))}
                    </div>
                  </section>
        </Fragment>
    )
}
export default ServicesCategories;