'use client';

import { useState, useEffect, Fragment } from 'react';
import api from '@/lib/api';
import { Plus, Edit2, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import UploadImage from '@/components/Admin/UploadImage';
import Link from 'next/link';
interface PriceItem {
  id?: number | null;
  name: string;
  price: number;
  serviceId: number;
  status: boolean;
}
interface Service {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  bannerImage: string;
  level: number;
  status: boolean;
  initialPrice: number;
  prices?: PriceItem[];
  children?: Service[];
}
interface FormData {
  name: string;
  slug: string;
  parentId: number | null;
  bannerImage: string;
  level: number;
  initialPrice: number;
  status: boolean;
}



export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<PriceItem | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [uploader, setUpload] = useState<boolean>(false);
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7106';

  const [priceModal, setPriceModal] = useState<PriceItem>({
    id: null,
    serviceId: 0,
    price: 0,
    status : false,
    name : ""
  })

  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    parentId: null,
    bannerImage: '',
    level: 0,
    initialPrice: 0,
    status: true
  });

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/admin/services/categories');
      setServices(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const toggleExpand = (id: number) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      slug: service.slug,
      parentId: service.parentId,
      bannerImage: service.bannerImage,
      level: service.level,
      initialPrice: service.initialPrice || 0,
      status: service.status
    });
    setIsModalOpen(true);
  };

  const handleAdd = (parentId: number | null = null, level: number = 0) => {
    setSelectedService(null);
    setFormData({
      name: '',
      slug: '',
      parentId: parentId,
      bannerImage: '',
      level: level,
      initialPrice: 0,
      status: true
    });
    setIsModalOpen(true);
  };


  const handleAddPrice=(serviceId:number)=>{
    setSelectedPrice(null);
    setPriceModal({
      id: null,
      serviceId: serviceId,
      price : 0,
      name: '',
      status: true
    })
    setIsPriceModalOpen(true);
  }

  const handleEditPrice = (price: PriceItem, serviceId: number) => {
    setSelectedPrice(price);
    setPriceModal({
      id: price.id,
      serviceId: serviceId,
      name: price.name,
      price: price.price,
      status: price.status,
    });
    setIsPriceModalOpen(true);

  };


  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service? All children will also be affected.')) return;

    try {
      await api.delete(`/api/v1/admin/services/${id}`);
      fetchServices();
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  };
  const handlePriceDelete = async (id?: number | null) => {
    if (!confirm('Are you sure you want to delete this Price?')) return;

    try {
      await api.delete(`/api/v1/admin/services/remove-pricing/${id}`);
      fetchServices();
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedService) {
        await api.put(`/api/v1/admin/services/${selectedService.id}`, formData);
      } else {
        await api.post('/api/v1/admin/services', formData);
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (error) {
      console.error('Failed to save service:', error);
    }
  };
  const handlePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedPrice) {
        await api.put(`/api/v1/admin/services/update-price/${selectedPrice.id}`, priceModal);
      } else {
        await api.post('/api/v1/admin/services/add-pricing', priceModal);
      }
      setIsPriceModalOpen(false);
      fetchServices();
    } catch (error) {
      console.error('Failed to save service:', error);
    }
  };

  const renderServiceRow = (service: Service, depth: number = 0) => {
    const isExpanded = expanded[service.id];
    const hasChildren = service.children && service.children.length > 0;

    return (
      <div key={service.id} className="border-b last:border-0">
        <div
          className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${depth > 0 ? 'bg-gray-50/50' : ''
            }`}
          style={{ paddingLeft: `${(depth * 2) + 1}rem` }}
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button onClick={() => toggleExpand(service.id)} className="text-gray-400 hover:text-gray-600">
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
            ) : (
              <div className="w-[18px]" />
            )}
            <div>
              <span className="font-semibold text-gray-800">{service.name}</span>
              <span className="ml-2 text-xs text-gray-400 font-mono">{service.slug}</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${service.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
              {service.status ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {service.level == 1 && (
              <Link href={'services/'+service.id} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Edit2 size={18} />
              </Link>
            )}
            {service.level < 2 && (
              <button
                onClick={() => handleAdd(service.id, service.level + 1)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Add Sub-service"
              >
                <Plus size={18} />
              </button>
            )}
            {service.level=== 2 && (
              <button
              onClick={()=> handleAddPrice(service.id)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Add Sub-service"
              >
                <Plus size={18} />
              </button>
            )}
            <button
              onClick={() => handleEdit(service)}
              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => handleDelete(service.id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          service.children?.map((child) => (
            <Fragment key={child.id}>
              {renderServiceRow(child, depth + 1)}
            </Fragment>
          ))
        )}
{/* Prices */}
{service.level >= 2 &&
  service.prices &&
  service.prices.length > 0 && (
    <div
      style={{
        marginLeft: `${(depth * 2) + 4}rem`
      }}
      className="mb-4"
    >
      <div className="flex flex-wrap gap-3">
        {service.prices.map((price) => (
          <div
            key={price.id}
            className="group min-w-[220px] rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3 hover:bg-white hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">
                  {price.name}
                </h4>

                <p className="text-lg font-bold text-[#64399C] mt-1">
                  ৳ {price.price}
                </p>
              </div>

              <span
                className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                  price.status
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {price.status ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
              onClick={()=> handleEditPrice(price, service.id)}
                className="p-2 text-orange-600 hover:bg-orange-100 rounded-xl"
                title="Edit Price"
              >
                <Edit2 size={15} />
              </button>

              <button
              onClick={()=> handlePriceDelete(price?.id)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-xl"
                title="Delete Price"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
)}




      </div>
    );
  };

  const onImageSelect = (path: string) => {
    setFormData({ ...formData, bannerImage: path });
    setUpload(false);
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Service Architecture</h2>
          <p className="text-gray-500 mt-1">Manage categories, sub-categories and bookable services</p>
        </div>
        <button
          onClick={() => handleAdd(null, 0)}
          className="bg-[#64399C] text-white px-6 py-3 rounded-xl hover:bg-[#64399C] transition-all shadow-lg shadow-[#64399C] flex items-center gap-2 font-bold"
        >
          <Plus size={20} />
          Create Root Category
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-400 font-medium">Synchronizing with system...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50/50 p-4 border-b text-xs font-bold text-gray-400 uppercase tracking-widest flex justify-between">
            <span>Structure & Hierarchy</span>
            <span className="mr-32">Actions</span>
          </div>
          {services.map((service) => renderServiceRow(service))}
          {services.length === 0 && (
            <div className="p-20 text-center text-gray-400">
              No services defined yet. Start by creating a root category.
            </div>
          )}
        </div>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedService ? 'Update Service' : 'New Service Entity'}
              </h3>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-mono text-gray-500">
                Level {formData.level}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 ml-1">Entity Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all"
                    placeholder="e.g. AC Repairing"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 ml-1">System Slug (URL identifier)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-mono"
                    placeholder="ac-repair-services"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 ml-1">Banner Image</label>
                   {formData.bannerImage !== '' ? (
                      <img src={BASE_URL + formData.bannerImage} width={120} alt='Banner Image' />
                    ) : (
                      <></>
                    )}
                      <div className='clearfix'>
                        <input type='text' className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all" placeholder='Paste Image CDN Url' onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}/>
                      </div>
                  {/* <div onClick={() => setUpload(true)} className='cursor-pointer'>
                    {formData.bannerImage !== '' ? (
                      <img src={BASE_URL + formData.bannerImage} width={120} alt='Banner Image' />
                    ) : (
                      <div className='border border-2 px-3 py-2'>Chose Image</div>
                    )}
                  </div>
                  {uploader == true && (
                    <Fragment>
                      <UploadImage path='/api/v1/admin/images' onSelect={onImageSelect} />
                    </Fragment>
                  )} */}


                </div>


                {formData.level === 2 && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 ml-1">Base Price (BDT)</label>
                    <input
                      type="number"
                      value={formData.initialPrice}
                      onChange={(e) => setFormData({ ...formData, initialPrice: parseFloat(e.target.value) })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <input
                  type="checkbox"
                  id="status"
                  checked={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                  className="w-5 h-5 text-orange-600 rounded-lg focus:ring-orange-500"
                />
                <label htmlFor="status" className="text-sm font-bold text-orange-900 cursor-pointer">
                  Activate this entity in customer view
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 border-2 border-gray-100 text-gray-400 rounded-2xl hover:bg-gray-50 hover:text-gray-600 transition-all font-bold"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200 font-bold"
                >
                  {selectedService ? 'Save Changes' : 'Initialize Entity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Price */}
      {isPriceModalOpen  && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedPrice ? 'Update Price' : 'New Service Price'}
              </h3>
            </div>

            <form  onSubmit={handlePriceSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 ml-1">Pricing Name</label>
                  <input
                    type="text"
                    value={priceModal.name}
                    onChange={(e) => setPriceModal({ ...priceModal, name: e.target.value })}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all"
                    placeholder="e.g. AC Repairing"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 ml-1">Price</label>
                  <input
                    type="number"
                    value={priceModal.price}
                    onChange={(e) => setPriceModal({ ...priceModal, price: parseFloat(e.target.value) })}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-mono"
                    placeholder="ac-repair-services"
                    required
                  />
                </div>

              </div>

              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <input
                  type="checkbox"
                  id="status"
                  checked={priceModal.status}
                  onChange={(e) => setPriceModal({ ...priceModal, status: e.target.checked })}
                  className="w-5 h-5 text-orange-600 rounded-lg focus:ring-orange-500"
                />
                <label htmlFor="status" className="text-sm font-bold text-orange-900 cursor-pointer">
                  Activate this entity in customer view
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPriceModalOpen(false)}
                  className="flex-1 px-6 py-4 border-2 border-gray-100 text-gray-400 rounded-2xl hover:bg-gray-50 hover:text-gray-600 transition-all font-bold"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200 font-bold"
                >
                  {selectedPrice ? 'Save Changes' : 'Initialize Entity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
