'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Coupon {
  id: number;
  code: string;
  discountType: string;
  maxDiscount: number;
  discount: number;
  minimumPurchase: number;
  status: boolean;
  endDate: string;
}

const initialForm = {
  code: '',
  discountType: 'percentage',
  maxDiscount: '',
  discount: 0,
  minimumPurchase: '',
  endDate: '',
  status: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [formData, setFormData] = useState<any>(initialForm);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await api.get('/api/v1/admin/coupons');
      setCoupons(response.data.data);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCoupon(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);

    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      maxDiscount: coupon.maxDiscount,
      discount: coupon.discount,
      minimumPurchase: coupon.minimumPurchase,
      endDate: coupon.endDate.split('T')[0],
      status: coupon.status,
    });

    setIsModalOpen(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData({
      ...formData,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCoupon) {
        await api.put(`/api/v1/admin/coupons/${editingCoupon.id}`, formData);
      } else {
        await api.post('/api/v1/admin/coupons', formData);
      }

      fetchCoupons();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save coupon:', error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-semibold">Promotion Coupons</h3>

          <button
            onClick={openAddModal}
            className="bg-[#64399C] hover:bg-[#64399C] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Add Coupon
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Min Purchase
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Expiry
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {coupons.map((coupon) => (
                <tr
                  key={coupon.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-[#64399C]">
                    {coupon.code}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    {coupon.discountType === 'percentage'
                      ? `${coupon.maxDiscount}%`
                      : `৳${coupon.maxDiscount}`}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    ৳{coupon.minimumPurchase}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        coupon.status
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {coupon.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(coupon.endDate).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEditModal(coupon)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">
                {editingCoupon ? 'Edit Coupon' : 'Add Coupon'}
              </h2>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-black text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Coupon Code */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Coupon Code
                </label>

                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#64399C]"
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Discount Type
                </label>

                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#64399C]"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Discount
                </label>

                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#64399C]"
                />
              </div>
              {/* Max Discount */}
              <div>
                <label className="block text-sm font-medium mb-1">
                 Max Discount
                </label>

                <input
                  type="number"
                  name="maxDiscount"
                  value={formData.maxDiscount}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#64399C]"
                />
              </div>

              {/* Minimum Purchase */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Minimum Purchase
                </label>

                <input
                  type="number"
                  name="minimumPurchase"
                  value={formData.minimumPurchase}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#64399C]"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Expiry Date
                </label>

                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#64399C]"
                />
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="status"
                  checked={formData.status}
                  onChange={handleChange}
                />

                <label className="text-sm font-medium">
                  Active Coupon
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-[#64399C] hover:bg-[#64399C] text-white px-5 py-2 rounded-lg"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}