import axios from "axios";


// bKash Payment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5001/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token interceptor
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('cust_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export interface BKashPaymentRequest {
    orderId: number;
    amount: number;
    payerReference: string;
    merchantInvoiceNumber: string;
}

export interface BKashPaymentWithAgreementRequest extends BKashPaymentRequest {
    agreementId: string | undefined;
}

export interface BKashExecuteRequest {
    paymentId: string;
    orderId?: number;
}

export interface BKashPaymentResponse {
    paymentId: string;
    bkashURL: string;
    agreementId?: string;
    paymentCreateTime?: string;
    transactionStatus?: string;
}

export interface BKashExecuteResponse {
    paymentId: string;
    trxId: string;
    transactionStatus: 'Initiated' | 'Completed' | 'Failed' | 'Cancelled';
    amount: string;
    currency: string;
    paymentExecuteTime: string;
    merchantInvoiceNumber: string;
    payerType: string;
    payerReference: string;
    payerAccount: string;
    agreementId?: string;
    maxRefundableAmount: string;
}

const bKashClient = {


    // bKash Payment Methods
    createBKashPayment: (data: BKashPaymentRequest): Promise<BKashPaymentResponse> =>
        apiClient.post('/api/bkash/payment/create', data).then(res => res.data),

    createBKashPaymentWithAgreement: (data: BKashPaymentWithAgreementRequest): Promise<BKashPaymentResponse> =>
        apiClient.post('/api/bkash/payment/create-with-agreement', data).then(res => res.data),

    executeBKashPayment: (data: BKashExecuteRequest): Promise<BKashExecuteResponse> =>
        apiClient.post('/api/bkash/payment/execute', data).then(res => res.data),

    queryBKashPayment: (paymentId: string) =>
        apiClient.post('/api/bkash/query/payment', { paymentId }).then(res => res.data),

    createBKashAgreement: (data: { payerReference: string; callbackURL: string }) =>
        apiClient.post('/api/bkash/agreement/create', data).then(res => res.data),

    executeBKashAgreement: (agreementId: string) =>
        apiClient.post('/api/bkash/agreement/execute', { agreementId }).then(res => res.data),

    cancelBKashAgreement: (agreementId: string) =>
        apiClient.post('/api/bkash/agreement/cancel', { agreementId }).then(res => res.data),

    queryBKashAgreement: (agreementId: string) =>
        apiClient.post('/api/bkash/query/agreement', { agreementId }).then(res => res.data),

    refundBKashPayment: (data: {
        paymentId: string;
        refundAmount: string;
        trxId: string;
        reason: string;
        sku: string;
    }) =>
        apiClient.post('/api/bkash/refund/payment', data).then(res => res.data),

    refundBKashStatus: (data: { paymentId: string; trxId: string }) =>
        apiClient.post('/api/bkash/refund/status', data).then(res => res.data),
};

export default bKashClient;




