'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Vendor {
  id: number;
  userId: number;
  userName: string;
  phone: string;
  balance: number;
  pendingBalance: number;
  totalEarnings: number;
  status: boolean;
  createdAt: string | null;
  current?: boolean;
  serviceIds: number[];
  commissionRate?: number;
}

const initialFormState = {
  userName: '',
  phone: '',
  current: false,
  serviceIds: Array<number>(),
  commissionRate: 0,
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [services, setServices] = useState([])

  useEffect(() => {
    fetchVendors();
    fetchRootServices();
  }, [page]);

    const fetchVendors = async () => {
      try {
        const response = await api.get('/api/v1/admin/vendors', {
          params: { page, pageSize: 15 }
        });
        setVendors(response.data.items || []);
        setTotalPages(response.data.totalPages || 1);
      } catch (error) {
        console.error('Failed to fetch vendors:', error);
      } finally {
        setLoading(false);
      }
    };
  const fetchRootServices=async()=> {
       const response = await api.get('/api/v1/admin/services/services-root');
       setServices(response.data.data || [])
  }




  const openAddModal = () => {
    setEditingVendor(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      userName: vendor.userName || '',
      phone: vendor.phone || '',
      current:  vendor.status ?? vendor.current,
      serviceIds: vendor.serviceIds ?? [],
      commissionRate: vendor.commissionRate || 0,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVendor(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      userName: formData.userName,
      phone: formData.phone,
      current: formData.current,
      serviceIds: formData.serviceIds,
      commissionRate: formData.commissionRate,
    };

    try {
      if (editingVendor) {
        const response = await api.put(`/api/v1/admin/vendors/${editingVendor.id}`, payload);
        setVendors(vendors.map((vendor) =>
          vendor.id === editingVendor.id ? { ...vendor, ...response.data, ...payload } : vendor
        ));
      } else {
        const response = await api.post('/api/v1/admin/vendors', payload);
        if(response){
          fetchVendors();
        } 
          
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save vendor:', error);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await api.put(`/api/v1/admin/vendors/${id}/status`, {
        isBanned: !currentStatus
      });
      setVendors(vendors.map(v =>
        v.id === id ? { ...v, status: !currentStatus, current: !currentStatus } : v
      ));
    } catch (error) {
      console.error('Failed to update vendor status:', error);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Vendors Management</h2>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-[#64399C] text-white hover:bg-[#64399C]"
        >
          Add Vendor
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Commission</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="border-t">
                    <td className="px-6 py-4">{vendor.id}</td>
                    <td className="px-6 py-4">{vendor.userName}</td>
                    <td className="px-6 py-4">{vendor.phone}</td>
                    <td className="px-6 py-4">{vendor.commissionRate != null ? `${vendor.commissionRate}%` : '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${vendor.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {vendor.status ? 'Active' : 'Banned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => openEditModal(vendor)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      {/* <button
                        onClick={() => handleToggleStatus(vendor.id, vendor.status)}
                        className={`text-sm ${vendor.status ? 'text-red-600' : 'text-green-600'}`}
                      >
                        {vendor.status ? 'Ban' : 'Approve'}
                      </button> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-4 py-2 rounded-lg ${page === pageNum ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
                {editingVendor ? 'Update Vendor' : 'Add Vendor'}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">Cancel</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Vendor Name</span>
                  <input
                    value={formData.userName}
                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                    className="mt-1 w-full rounded-xl border-gray-300 bg-gray-50 p-3 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="Enter vendor name"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Phone</span>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border-gray-300 bg-gray-50 p-3 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="Phone number"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Commission Rate</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border-gray-300 bg-gray-50 p-3 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="e.g. 10"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Current</span>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.current}
                      onChange={(e) => setFormData({ ...formData, current: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-600">Mark as current vendor</span>
                  </div>
                </label>
              </div>

            
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 ml-1">Services</label>
                  <select 
                    
                    multiple
                    onChange={(e) => setFormData({ ...formData, serviceIds: Array.from((e.target as HTMLSelectElement).selectedOptions, option => Number(option.value)) })}
                    className='w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-mono'
                  >
                    {services.map((item: any) => (
                      <option key={item.id} value={item.id}> {item.name}</option>
                    ))}
                  </select>
                </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#64399C] px-5 py-3 text-sm font-medium text-white hover:bg-[#64399C]"
                >
                  {editingVendor ? 'Update Vendor' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
