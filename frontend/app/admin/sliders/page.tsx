'use client';

import { Fragment, useEffect, useState } from 'react';
import api from '@/lib/api';
import UploadImage from '@/components/Admin/UploadImage';

interface Slider {
  id: number;
  title: string;
  subTitle: string;
  image: string;
  status: boolean;
  position: number;
  buttonText?: string;
  link: string;
}

const initialForm = {
  id: 0,
  title: '',
  subTitle: '',
  image: '',
  status: true,
  position: 1,
  buttonText: '',
  link: '',
};

export default function AdminSlidersPage() {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
  const [uploader, setUpload] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>(initialForm);
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7106';

  useEffect(() => {
    fetchSliders();
  }, []);

  const fetchSliders = async () => {
    try {
      const response = await api.get('/api/v1/admin/sliders');
      setSliders(response.data.data);
    } catch (error) {
      console.error('Failed to fetch sliders:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingSlider(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (slider: Slider) => {
    setEditingSlider(slider);

    setFormData({
      id: slider.id,
      title: slider.title,
      subTitle: slider.subTitle,
      image: slider.image,
      status: slider.status,
      position: slider.position,
      buttonText: slider.buttonText || '',
      link: slider.link,
    });

    setIsModalOpen(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
      if (editingSlider) {
        await api.put(`/api/v1/admin/sliders/${editingSlider.id}`, formData);
      } else {
        await api.post('/api/v1/admin/sliders', formData);
      }

      fetchSliders();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save slider:', error);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = confirm(
      'Are you sure you want to delete this slider?'
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/api/v1/admin/sliders/${id}`);

      setSliders((prev) => prev.filter((slider) => slider.id !== id));
    } catch (error) {
      console.error('Failed to delete slider:', error);
    }
  };


  const onImageSelect = (path: string) => {
    setFormData({ ...formData, image: path });
    setUpload(false);
  }



  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Homepage Sliders</h3>

          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-lg text-white transition"
            style={{ backgroundColor: '#64399C' }}
          >
            + Add Slider
          </button>
        </div>

        {/* Slider Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sliders.map((slider) => (
            <div
              key={slider.id}
              className="border rounded-2xl overflow-hidden bg-white shadow-sm"
            >
              {/* Image */}
              <div className="h-48 bg-gray-100 overflow-hidden">
                {slider.image ? (
                  <img
                    src={BASE_URL + slider.image}
                    alt={slider.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h4 className="font-bold text-lg">{slider.title}</h4>

                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {slider.subTitle}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Position: {slider.position}
                  </span>

                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      slider.status
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {slider.status ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => openEditModal(slider)}
                    className="flex-1 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: '#64399C' }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(slider.id)}
                    className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">
                {editingSlider ? 'Edit Slider' : 'Add Slider'}
              </h2>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-black text-2xl"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Subtitle
                </label>

                <textarea
                  name="subTitle"
                  value={formData.subTitle}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2"
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Image URL
                </label>

                  <div onClick={() => setUpload(true)} className='cursor-pointer'>
                    {formData.image !== '' ? (
                      <img src={BASE_URL + formData.image} width={120} alt='Slider Image' />
                    ) : (
                      <div className='border border-2 px-3 py-2'>Chose Image</div>
                    )}
                  </div>



                  {uploader == true && (
                    <Fragment>
                      <UploadImage path='/api/v1/admin/images' onSelect={onImageSelect} />
                    </Fragment>
                  )}
              </div>

              {/* Button Text */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Button Text
                </label>

                <input
                  type="text"
                  name="buttonText"
                  value={formData.buttonText}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Link
                </label>

                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Position
                </label>

                <input
                  type="number"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2"
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
                  Active Slider
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-lg border hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-white"
                  style={{ backgroundColor: '#64399C' }}
                >
                  {editingSlider ? 'Update Slider' : 'Create Slider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}