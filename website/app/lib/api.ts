/**
 * Thin client for the OneWeb ASP.NET API (see src/OneWeb.Api).
 *
 * Everything here is browser-side: tokens live in localStorage and are attached
 * to each request, with a single automatic refresh on 401. Callers get typed
 * results and an `ApiError` they can branch on.
 */

/**
 * Base URL of the API, without a trailing slash.
 *
 * Set NEXT_PUBLIC_API_URL at build time. When it is absent we fall back to the
 * page's own origin, which is what a production deploy that puts the API behind
 * the same hostname (reverse proxy, same domain) wants — so a missing env var
 * degrades to same-origin rather than to somebody's laptop.
 */
export function resolveApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export const API_BASE_URL = resolveApiBase();

const TOKEN_KEY = 'onetap.tokens.v1';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  userId: number;
  userType: string;
  /**
   * API these tokens were issued by. User ids are per-database, so a session
   * from one backend is meaningless against another — and because environments
   * can share a JWT signing key, such a token may still *validate* while
   * referring to a different user entirely.
   */
  apiBase?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }

  /** True when the API could not be reached at all (offline / CORS / down). */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

/* ---------------------------------------------------------------- tokens -- */

export function loadTokens(): AuthTokens | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const tokens = JSON.parse(raw) as AuthTokens;

    // Session belongs to a different backend — drop it rather than send it.
    if (tokens.apiBase && tokens.apiBase !== resolveApiBase()) {
      clearTokens();
      return null;
    }
    return tokens;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      TOKEN_KEY,
      JSON.stringify({ ...tokens, apiBase: resolveApiBase() }),
    );
  } catch {
    // Ignore quota/security errors.
  }
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore.
  }
}

/* ---------------------------------------------------------------- fetcher -- */

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Attach the stored access token (and refresh it once on 401). */
  auth?: boolean;
  signal?: AbortSignal;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function messageFrom(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    for (const key of ['message', 'Message', 'title', 'error']) {
      const value = record[key];
      if (typeof value === 'string' && value) return value;
    }
  }
  if (typeof payload === 'string' && payload) return payload;
  return fallback;
}

async function rawRequest<T>(
  path: string,
  { method = 'GET', body, auth = false, signal }: RequestOptions,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    // Resolved per call, not captured at module load, so the same-origin
    // fallback is correct once the module is running in the browser.
    response = await fetch(`${resolveApiBase()}${path}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    throw new ApiError(
      0,
      error instanceof Error && error.name === 'AbortError'
        ? 'Request cancelled'
        : 'Could not reach the server. Please check your connection.',
    );
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      messageFrom(payload, `Request failed (${response.status})`),
      payload,
    );
  }

  return payload as T;
}

/** Single-flight refresh so parallel 401s don't each burn a refresh token. */
let refreshInFlight: Promise<AuthTokens | null> | null = null;

async function refreshTokens(): Promise<AuthTokens | null> {
  const stored = loadTokens();
  if (!stored?.refreshToken || !stored.userId) return null;

  try {
    const result = await rawRequest<{
      accessToken: string;
      refreshToken: string;
      userType: string;
    }>('/api/v1/auth/refresh-token', {
      method: 'POST',
      body: { userId: stored.userId, refreshToken: stored.refreshToken },
    });

    const next: AuthTokens = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken || stored.refreshToken,
      userId: stored.userId,
      userType: result.userType || stored.userType,
    };
    saveTokens(next);
    return next;
  } catch {
    clearTokens();
    return null;
  }
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const tokens = options.auth ? loadTokens() : null;

  try {
    return await rawRequest<T>(path, options, tokens?.accessToken);
  } catch (error) {
    const unauthorized =
      error instanceof ApiError && error.status === 401 && options.auth;
    if (!unauthorized) throw error;

    refreshInFlight = refreshInFlight ?? refreshTokens();
    let refreshed: AuthTokens | null;
    try {
      refreshed = await refreshInFlight;
    } finally {
      refreshInFlight = null;
    }

    if (!refreshed) throw error;
    return rawRequest<T>(path, options, refreshed.accessToken);
  }
}

/* ------------------------------------------------------------------- auth -- */

export interface SendOtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  userType: string;
  userId: number;
  nameRequired: boolean;
  name?: string | null;
  phone?: string | null;
}

export function sendOtp(phone: string): Promise<SendOtpResponse> {
  return request<SendOtpResponse>('/api/v1/auth/send-otp', {
    method: 'POST',
    body: { phone },
  });
}

export async function verifyOtp(
  phone: string,
  otp: string,
): Promise<VerifyOtpResponse> {
  // The API serialises this one field as "NameRequired" — normalise it here so
  // the rest of the app only ever sees camelCase.
  const raw = await request<
    Omit<VerifyOtpResponse, 'nameRequired'> & {
      nameRequired?: boolean;
      NameRequired?: boolean;
    }
  >('/api/v1/auth/verify-otp', { method: 'POST', body: { phone, otp } });

  const result: VerifyOtpResponse = {
    ...raw,
    nameRequired: raw.nameRequired ?? raw.NameRequired ?? false,
  };

  saveTokens({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    userId: result.userId,
    userType: result.userType,
  });

  return result;
}

export function updateName(name: string): Promise<unknown> {
  return request('/api/v1/auth/update-name', {
    method: 'POST',
    body: { name },
    auth: true,
  });
}

export async function logout(): Promise<void> {
  try {
    await request('/api/v1/auth/logout', { method: 'POST', auth: true });
  } catch {
    // Logging out locally matters more than the server round-trip.
  } finally {
    clearTokens();
  }
}

/* -------------------------------------------------------------- catalogue -- */

export interface ApiService {
  id: number;
  name: string;
  slug: string | null;
  parentId: number | null;
  level: number;
  serviceIcon: string | null;
  bannerImage: string | null;
  initialPrice: number;
  isTrending: boolean;
  status: boolean;
  children?: ApiService[] | null;
  priceUnit?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  prices?: ApiServicePrice[] | null;
}

export interface ApiServicePrice {
  id: number;
  name: string | null;
  price: number;
}

export interface ApiServiceDetail {
  id: number;
  name: string;
  slug: string | null;
  about: string | null;
  cms?: { about?: string; detail?: string; faq?: string } | null;
  bannerImage: string | null;
  serviceQuality: string | null;
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
  prices: ApiServicePrice[];
}

export interface Paged<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function getCategories(signal?: AbortSignal): Promise<ApiService[]> {
  return request<ApiService[]>('/api/v1/services/categories', { signal });
}

export function getServices(
  params: {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: number;
  } = {},
  signal?: AbortSignal,
): Promise<Paged<ApiService>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.search) query.set('search', params.search);
  if (params.categoryId) query.set('categoryId', String(params.categoryId));
  const qs = query.toString();
  return request<Paged<ApiService>>(
    `/api/v1/services${qs ? `?${qs}` : ''}`,
    { signal },
  );
}

export function getServiceBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<ApiServiceDetail> {
  return request<ApiServiceDetail>(
    `/api/v1/services/${encodeURIComponent(slug)}`,
    { signal },
  );
}

export function getServiceById(
  id: number,
  signal?: AbortSignal,
): Promise<ApiServiceDetail> {
  return request<ApiServiceDetail>(`/api/v1/services/detail?Id=${id}`, {
    signal,
  });
}

/* ----------------------------------------------------------------- orders -- */

export interface CreateOrderPayload {
  serviceId: number;
  priceId: number;
  /** YYYY-MM-DD */
  serviceDate: string;
  /** HH:mm:ss */
  time: string;
  shippingAddress: string;
  additionalInfo?: string | null;
  paymentType?: string | null;
  couponCode?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  /** Human-readable place name shown to admins and vendors. */
  locationName?: string | null;
  orderFrom?: string;
}

export interface CreateOrderResponse {
  orderId: number;
  trackingCode: string;
}

export interface ApiOrder {
  id: number;
  trackingCode: string | null;
  deliveryStatus: string;
  paymentStatus: string;
  paymentType: string | null;
  grandTotal: number | null;
  couponDiscount: number;
  shippingAddress: string | null;
  additionalInfo: string | null;
  createdAt: string | null;
  customer: string | null;
  vendor: string | null;
  vendorContact: string | null;
  service: { id: number; name: string; slug: string | null } | null;
  orderFrom: string | null;
}

export function createOrder(
  payload: CreateOrderPayload,
): Promise<CreateOrderResponse> {
  return request<CreateOrderResponse>('/api/v1/orders', {
    method: 'POST',
    body: { orderFrom: 'web', ...payload },
    auth: true,
  });
}

export function getOrders(
  page = 1,
  pageSize = 50,
  signal?: AbortSignal,
): Promise<Paged<ApiOrder>> {
  return request<Paged<ApiOrder>>(
    `/api/v1/orders?page=${page}&pageSize=${pageSize}`,
    { auth: true, signal },
  );
}

export function cancelOrder(id: number): Promise<unknown> {
  return request(`/api/v1/orders/${id}/cancel`, { method: 'POST', auth: true });
}

/* --------------------------------------------------------------- payments -- */

export interface SslCommerzSession {
  success: boolean;
  gatewayPageUrl: string;
  sessionKey: string | null;
  transactionId: string;
}

/** Where the gateway should drop the customer back on this site. */
export function paymentReturnUrl(path = '/profile?tab=bookings'): string {
  if (typeof window === 'undefined') return '';
  return new URL(path, window.location.origin).toString();
}

/**
 * Open an SSLCommerz hosted-checkout session for an order. The caller should
 * send the browser to `gatewayPageUrl`; the API is told the outcome out of band
 * via the signed IPN callback.
 *
 * `returnUrl` is derived from the current origin rather than configured, so the
 * same build works on localhost, staging and production. The API still checks it
 * against its allow-list before redirecting anywhere.
 */
export function initiateSslCommerz(
  orderId: number,
  returnUrl: string = paymentReturnUrl(),
): Promise<SslCommerzSession> {
  return request<SslCommerzSession>('/api/v1/payments/sslcommerz/initiate', {
    method: 'POST',
    body: { orderId, returnUrl },
    auth: true,
  });
}

/* ---------------------------------------------------------------- offers -- */

export interface ApiSlider {
  id: number;
  title: string | null;
  subTitle: string | null;
  image: string | null;
  link: string | null;
  position: number;
}

/** Promotional slides managed in the portal (Offers / Sliders). */
export function getSliders(signal?: AbortSignal): Promise<ApiSlider[]> {
  return request<ApiSlider[]>('/api/v1/sliders', { signal });
}

/* --------------------------------------------------------------- settings -- */

export function getSettings(
  signal?: AbortSignal,
): Promise<Record<string, string>> {
  return request<Record<string, string>>('/api/v1/settings', { signal });
}
