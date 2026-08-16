'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api/client';

interface FetchOptions {
  immediate?: boolean;
}

export function useFetch<T>(endpoint: string, options?: FetchOptions) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Parse endpoint and call appropriate API method
      const result = await parseAndCallAPI(endpoint);
      setData(result as T);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (options?.immediate !== false) {
      fetchData();
    }
  }, [fetchData, options?.immediate]);

  return { data, isLoading, error, refetch: fetchData };
}

async function parseAndCallAPI(endpoint: string): Promise<any> {
  // Parse endpoint to determine which API method to call
  const normalizedEndpoint = endpoint.replace(/^\//, '');
  
  // Dashboard stats
  if (normalizedEndpoint === 'dashboard/stats') {
    return api.getDashboardStats();
  }
  
  // Orders
  if (normalizedEndpoint.startsWith('orders')) {
    const params = extractQueryParams(normalizedEndpoint);
    return api.getOrders(params);
  }
  
  // Users
  if (normalizedEndpoint.startsWith('users')) {
    const params = extractQueryParams(normalizedEndpoint);
    return api.getUsers(params);
  }
  
  // Services
  if (normalizedEndpoint.startsWith('services')) {
    const params = extractQueryParams(normalizedEndpoint);
    return api.getServices(params);
  }
  
  // Categories
  if (normalizedEndpoint.startsWith('categories')) {
    const params = extractQueryParams(normalizedEndpoint);
    return api.getCategories(params);
  }
  
  // Brands
  if (normalizedEndpoint.startsWith('brands')) {
    const params = extractQueryParams(normalizedEndpoint);
    return api.getBrands(params);
  }
  
  // Coupons
  if (normalizedEndpoint.startsWith('coupons')) {
    const params = extractQueryParams(normalizedEndpoint);
    return api.getCoupons(params);
  }
  
  // Vendors
  if (normalizedEndpoint.startsWith('vendors')) {
    const params = extractQueryParams(normalizedEndpoint);
    return api.getVendors(params);
  }
  
  // Blogs
  if (normalizedEndpoint.startsWith('blogs')) {
    const params = extractQueryParams(normalizedEndpoint);
    return api.getBlogs(params);
  }
  
  // Pages
  if (normalizedEndpoint.startsWith('pages')) {
    const params = extractQueryParams(normalizedEndpoint);
    return api.getPages(params);
  }
  
  // Settings
  if (normalizedEndpoint === 'settings') {
    return api.getSettings();
  }

  // Fallback - try direct fetch
  const token = localStorage.getItem('access_token');
  const response = await fetch(`http://localhost:8080/${normalizedEndpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

function extractQueryParams(endpoint: string): any {
  const params: any = {};
  
  if (endpoint.includes('?')) {
    const [path, queryString] = endpoint.split('?');
    const searchParams = new URLSearchParams(queryString);
    
    if (searchParams.has('page')) params.page = parseInt(searchParams.get('page')!);
    if (searchParams.has('page_size')) params.pageSize = parseInt(searchParams.get('page_size')!);
    if (searchParams.has('status')) params.status = searchParams.get('status');
    if (searchParams.has('search')) params.search = searchParams.get('search');
    if (searchParams.has('category_id')) params.categoryId = parseInt(searchParams.get('category_id')!);
    if (searchParams.has('featured')) params.featured = true;
    if (searchParams.has('trending')) params.trending = true;
  }
  
  return params;
}

// Mutation hooks for write operations
export function useMutation<T, R>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST'
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (endpoint: string, body?: T): Promise<R | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const normalizedEndpoint = endpoint.replace(/^\//, '');
      
      // Parse endpoint and call appropriate API method
      let result: any;
      
      // Orders
      if (normalizedEndpoint.startsWith('orders')) {
        if (method === 'POST') result = await api.createOrder(body as any);
        else if (method === 'PATCH') result = await api.updateOrder(parseInt(normalizedEndpoint.split('/')[1]), body as any);
      }
      
      // Users
      else if (normalizedEndpoint.startsWith('users')) {
        if (method === 'POST') result = await api.createUser(body as any);
        else if (method === 'PATCH') result = await api.updateUser(parseInt(normalizedEndpoint.split('/')[1]), body as any);
        else if (method === 'DELETE') result = await api.deleteUser(parseInt(normalizedEndpoint.split('/')[1]));
      }
      
      // Services
      else if (normalizedEndpoint.startsWith('services')) {
        if (method === 'POST') result = await api.createService(body as any);
        else if (method === 'PATCH') result = await api.updateService(parseInt(normalizedEndpoint.split('/')[1]), body as any);
        else if (method === 'DELETE') result = await api.deleteService(parseInt(normalizedEndpoint.split('/')[1]));
      }
      
      // Coupons
      else if (normalizedEndpoint.startsWith('coupons')) {
        if (method === 'POST') result = await api.createCoupon(body as any);
        else if (method === 'PATCH') result = await api.updateCoupon(parseInt(normalizedEndpoint.split('/')[1]), body as any);
        else if (method === 'DELETE') result = await api.deleteCoupon(parseInt(normalizedEndpoint.split('/')[1]));
      }
      
      // Vendors
      else if (normalizedEndpoint.startsWith('vendors')) {
        if (method === 'POST') result = await api.createVendor(body as any);
        else if (method === 'PATCH') result = await api.updateVendor(parseInt(normalizedEndpoint.split('/')[1]), body as any);
        else if (method === 'DELETE') result = await api.deleteVendor(parseInt(normalizedEndpoint.split('/')[1]));
      }
      
      // Blogs
      else if (normalizedEndpoint.startsWith('blogs')) {
        if (method === 'POST') result = await api.createBlog(body as any);
        else if (method === 'PATCH') result = await api.updateBlog(parseInt(normalizedEndpoint.split('/')[1]), body as any);
        else if (method === 'DELETE') result = await api.deleteBlog(parseInt(normalizedEndpoint.split('/')[1]));
      }
      
      // Pages
      else if (normalizedEndpoint.startsWith('pages')) {
        if (method === 'POST') result = await api.createPage(body as any);
        else if (method === 'PATCH') result = await api.updatePage(parseInt(normalizedEndpoint.split('/')[1]), body as any);
        else if (method === 'DELETE') result = await api.deletePage(parseInt(normalizedEndpoint.split('/')[1]));
      }
      
      // Categories
      else if (normalizedEndpoint.startsWith('categories')) {
        if (method === 'POST') result = await api.createCategory(body as any);
        else if (method === 'PATCH') result = await api.updateCategory(parseInt(normalizedEndpoint.split('/')[1]), body as any);
        else if (method === 'DELETE') result = await api.deleteCategory(parseInt(normalizedEndpoint.split('/')[1]));
      }
      
      else {
        throw new Error(`Unknown endpoint: ${endpoint}`);
      }
      
      setIsLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, [method]);

  return { mutate, isLoading, error };
}

// Pre-built hooks for common data
export function useOrders(params?: { page?: number; status?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  
  const queryString = query.toString();
  return useFetch<{ items: any[]; pagination: any }>(queryString ? `/orders?${queryString}` : '/orders');
}

export function useServices(params?: { page?: number; categoryId?: number; featured?: boolean; search?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.categoryId) query.set('category_id', params.categoryId.toString());
  if (params?.featured) query.set('featured', 'true');
  if (params?.search) query.set('search', params.search);
  
  const queryString = query.toString();
  return useFetch<{ services: any[]; pagination: any }>(queryString ? `/services?${queryString}` : '/services');
}

export function useUsers(params?: { page?: number; search?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.search) query.set('search', params.search);
  
  const queryString = query.toString();
  return useFetch<{ users: any[]; pagination: any }>(queryString ? `/users?${queryString}` : '/users');
}

export function useDashboardStats() {
  return useFetch<{
    totalOrders: number;
    totalRevenue: number;
    totalUsers: number;
    totalVendors: number;
    recentOrders: any[];
  }>('/dashboard/stats');
}

export function useCategories(params?: { page?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  
  const queryString = query.toString();
  return useFetch<{ categories: any[]; pagination: any }>(queryString ? `/categories?${queryString}` : '/categories');
}

export function useBrands(params?: { page?: number; trending?: boolean }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.trending) query.set('trending', 'true');
  
  const queryString = query.toString();
  return useFetch<{ brands: any[]; pagination: any }>(queryString ? `/brands?${queryString}` : '/brands');
}

export function useCoupons(params?: { page?: number; type?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.type) query.set('type', params.type);
  
  const queryString = query.toString();
  return useFetch<{ coupons: any[]; pagination: any }>(queryString ? `/coupons?${queryString}` : '/coupons');
}

export function useVendors(params?: { page?: number; isActive?: boolean }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.isActive !== undefined) query.set('is_active', params.isActive.toString());
  
  const queryString = query.toString();
  return useFetch<{ vendors: any[]; pagination: any }>(queryString ? `/vendors?${queryString}` : '/vendors');
}

export function useBlogs(params?: { page?: number; status?: boolean }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.status !== undefined) query.set('status', params.status.toString());
  
  const queryString = query.toString();
  return useFetch<{ blogs: any[]; pagination: any }>(queryString ? `/blogs?${queryString}` : '/blogs');
}

export function usePages(params?: { page?: number; type?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.type) query.set('type', params.type);
  
  const queryString = query.toString();
  return useFetch<{ pages: any[]; pagination: any }>(queryString ? `/pages?${queryString}` : '/pages');
}

export function useSettings() {
  return useFetch<{ settings: Record<string, any> }>('/settings');
}