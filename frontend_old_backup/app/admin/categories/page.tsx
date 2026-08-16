'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Search, Plus, Edit, Trash2, X, Loader2, Folder } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  level: number;
  status: boolean;
  serviceIcon?: string | null;
  bannerImage?: string | null;
  initialPrice?: number;
  children?: any[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', iconClass: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/admin/services/categories');
      setCategories(response.data?.data || []);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
      setError(err?.response?.data?.message || 'Unable to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? All sub-services will also be affected.')) return;
    try {
      await api.delete(`/api/v1/admin/services/${id}`);
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert('Failed to delete category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/v1/admin/services', {
        name: formData.name,
        slug: formData.slug,
        parentId: null,
        level: 0,
        bannerImage: formData.iconClass || '',
        initialPrice: 0,
        status: true,
      });
      setIsModalOpen(false);
      setFormData({ name: '', slug: '', iconClass: '' });
      fetchCategories();
    } catch (err) {
      console.error('Failed to create category:', err);
      alert('Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
          <p className="text-gray-500">Manage service categories</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#64399C] text-white px-4 py-2 rounded-lg hover:bg-[#522e80] transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#64399C]"
          />
        </div>
      </div>

      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-50 text-[#64399C] rounded-xl flex items-center justify-center font-semibold text-lg">
                    {category.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{category.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${category.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {category.status ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <span>
                  {category.children?.length || 0} subcategories
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Folder className="mx-auto text-gray-300" size={48} />
          <h3 className="mt-4 text-lg font-medium text-gray-800">No categories found</h3>
          <p className="text-gray-500">Add your first category</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Add New Category</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#64399C]"
                  placeholder="e.g. AC Servicing"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#64399C]"
                  placeholder="e.g. ac-servicing"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon / Banner Keyword</label>
                <input
                  type="text"
                  value={formData.iconClass}
                  onChange={(e) => setFormData({ ...formData, iconClass: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#64399C]"
                  placeholder="e.g. wind, car, droplets"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#64399C] text-white py-2 rounded-lg hover:bg-[#522e80] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
