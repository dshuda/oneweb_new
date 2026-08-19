const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5102';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // setToken(token: string | null) {
  //   this.token = token;
  //   if (token) {
  //     localStorage.setItem('access_token', token);
  //   } else {
  //     localStorage.removeItem('access_token');
  //   }
  // }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('cust_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }
  async UpdateName(name: string) {
    return this.request<{ accessToken: string; user: any }>('/auth/update-name', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async register(data: { name: string; email: string; phone: string; password: string }) {
    return this.request<{ accessToken: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Users
  async getUsers(params?: { page?: number; pageSize?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('page_size', params.pageSize.toString());
    if (params?.search) query.set('search', params.search);
    return this.request<{ users: any[]; pagination: any }>(`/users?${query}`);
  }

  async getUser(id: number) {
    return this.request<{ user: any }>(`/users/${id}`);
  }

  async createUser(data: { name: string; email: string; phone: string; password: string }) {
    return this.request<{ user: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: Partial<{ name: string; email: string; phone: string; isActive: boolean }>) {
    return this.request<{ user: any }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: number) {
    return this.request<void>(`/users/${id}`, { method: 'DELETE' });
  }

  // Orders
  async getOrders(params?: { 
    page?: number; 
    pageSize?: number; 
    status?: string; 
    userId?: number;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('page_size', params.pageSize.toString());
    if (params?.status) query.set('status', params.status);
    if (params?.userId) query.set('user_id', params.userId.toString());
    if (params?.search) query.set('search', params.search);
    return this.request<{ orders: any[]; pagination: any }>(`/orders?${query}`);
  }

  async getOrder(id: number) {
    return this.request<{ order: any }>(`/orders/${id}`);
  }

  async createOrder(data: {
    userId: number | any;
    serviceId: number;
    priceId : number | undefined;
    serviceDate: string | undefined;
    time: string | undefined;
    shippingAddress: string;
    additionalInfo?: string;
    paymentType?: string;
    couponCode?: string;
    latitude?: string;
    longitude?: string;
    orderFrom?: string;
  }) {
    return this.request<{ order: any }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrder(id: number, data: { status?: string; paymentStatus?: string }) {
    return this.request<{ order: any }>(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async cancelOrder(id: number, reason?: string) {
    return this.request<{ order: any }>(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Services
  async getServices(params?: {
    page?: number;
    pageSize?: number;
    categoryId?: number;
    brandId?: number;
    featured?: boolean;
    isActive?: boolean;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('page_size', params.pageSize.toString());
    if (params?.categoryId) query.set('category_id', params.categoryId.toString());
    if (params?.brandId) query.set('brand_id', params.brandId.toString());
    if (params?.featured) query.set('featured', 'true');
    if (params?.isActive !== undefined) query.set('is_active', params.isActive.toString());
    if (params?.search) query.set('search', params.search);
    return this.request<{ services: any[]; pagination: any }>(`/services?${query}`);
  }

  async getService(id: number) {
    return this.request<{ service: any }>(`/services/${id}`);
  }

  async createService(data: {
    name: string;
    slug?: string;
    categoryId: number;
    brandId?: number;
    vendorId?: number;
    shortDescription?: string;
    description?: string;
    thumbnail?: string;
    featured?: boolean;
  }) {
    return this.request<{ service: any }>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id: number, data: Partial<{
    name: string;
    shortDescription: string;
    description: string;
    thumbnail: string;
    featured: boolean;
    isActive: boolean;
  }>) {
    return this.request<{ service: any }>(`/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: number) {
    return this.request<void>(`/services/${id}`, { method: 'DELETE' });
  }

  // Service Prices
  async getServicePrices(serviceId: number) {
    return this.request<{ prices: any[] }>(`/services/${serviceId}/prices`);
  }

  async createServicePrice(data: {
    serviceId: number;
    variant: string;
    price: number;
    cost?: number;
    stock?: number;
  }) {
    return this.request<{ price: any }>('/service-prices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Brands
  async getBrands(params?: { page?: number; pageSize?: number; trending?: boolean; status?: boolean }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('page_size', params.pageSize.toString());
    if (params?.trending) query.set('trending', 'true');
    if (params?.status !== undefined) query.set('status', params.status.toString());
    return this.request<{ brands: any[]; pagination: any }>(`/brands?${query}`);
  }

  // Categories
  async getCategories(params?: { page?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('page_size', params.pageSize.toString());
    return this.request<{ categories: any[]; pagination: any }>(`/categories?${query}`);
  }

  // Payment/Coupon
  async getCoupons(params?: { page?: number; pageSize?: number; type?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('page_size', params.pageSize.toString());
    if (params?.type) query.set('type', params.type);
    return this.request<{ coupons: any[]; pagination: any }>(`/coupons?${query}`);
  }

  async validateCoupon(code: string, orderAmount: number) {
    return this.request<{ valid: boolean; discountAmount: number; finalAmount: number; coupon: any }>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, orderAmount }),
    });
  }

  async createCoupon(data: { code: string; type: string; discount: number; discountType: string; details?: string; startDate?: string; endDate?: string; usageLimit?: number }) {
    return this.request<{ coupon: any }>('/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCoupon(id: number, data: Partial<{ code: string; type: string; discount: number; discountType: string; details: string; startDate: string; endDate: string; usageLimit: number; status: boolean }>) {
    return this.request<{ coupon: any }>(`/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCoupon(id: number) {
    return this.request<{ success: boolean }>(`/coupons/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard Stats
  async getDashboardStats() {
    return this.request<{
      totalOrders: number;
      totalRevenue: number;
      totalUsers: number;
      totalVendors: number;
      recentOrders: any[];
    }>('/dashboard/stats');
  }

  // Vendors
  async getVendors(params?: { page?: number; pageSize?: number; isActive?: boolean }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('page_size', params.pageSize.toString());
    if (params?.isActive !== undefined) query.set('is_active', params.isActive.toString());
    return this.request<{ vendors: any[]; pagination: any }>(`/vendors?${query}`);
  }

  async createVendor(data: { name: string; email: string; phone: string; address?: string; description?: string; logo?: string }) {
    return this.request<{ vendor: any }>('/vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVendor(id: number, data: Partial<{ name: string; email: string; phone: string; address: string; description: string; logo: string; isActive: boolean }>) {
    return this.request<{ vendor: any }>(`/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVendor(id: number) {
    return this.request<{ success: boolean }>(`/vendors/${id}`, {
      method: 'DELETE',
    });
  }

  // Blogs
  async getBlogs(params?: { page?: number; pageSize?: number; status?: boolean; categoryId?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('page_size', params.pageSize.toString());
    if (params?.status !== undefined) query.set('status', params.status.toString());
    if (params?.categoryId) query.set('category_id', params.categoryId.toString());
    return this.request<{ blogs: any[]; pagination: any }>(`/blogs?${query}`);
  }

  async createBlog(data: { title: string; slug: string; content: string; categoryId?: number; thumbnail?: string; isFeatured?: boolean }) {
    return this.request<{ blog: any }>('/blogs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBlog(id: number, data: Partial<{ title: string; slug: string; content: string; categoryId: number; thumbnail: string; isFeatured: boolean; status: boolean }>) {
    return this.request<{ blog: any }>(`/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBlog(id: number) {
    return this.request<{ success: boolean }>(`/blogs/${id}`, {
      method: 'DELETE',
    });
  }

  // Pages (Custom Pages)
  async getPages(params?: { page?: number; pageSize?: number; type?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('page_size', params.pageSize.toString());
    if (params?.type) query.set('type', params.type);
    return this.request<{ pages: any[]; pagination: any }>(`/pages?${query}`);
  }

  async createPage(data: { title: string; slug: string; content: string; type?: string }) {
    return this.request<{ page: any }>('/pages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePage(id: number, data: Partial<{ title: string; slug: string; content: string; type: string; status: boolean }>) {
    return this.request<{ page: any }>(`/pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePage(id: number) {
    return this.request<{ success: boolean }>(`/pages/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  async createCategory(data: { name: string; slug: string; description?: string; icon?: string }) {
    return this.request<{ category: any }>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: number, data: Partial<{ name: string; slug: string; description: string; icon: string; isActive: boolean }>) {
    return this.request<{ category: any }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: number) {
    return this.request<{ success: boolean }>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Settings
  async getSettings() {
    return this.request<{ settings: Record<string, any> }>('/settings');
  }

  async updateSetting(type: string, value: string) {
    return this.request<{ success: boolean }>(`/settings/${type}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  }

}

export const api = new ApiClient();
export default api;


