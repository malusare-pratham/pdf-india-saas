import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

const API = axios.create({
    baseURL: `${API_URL}/api/v1`,
});

const isPublicEndpoint = (url = '') =>
    url.startsWith('/auth/login') ||
    url.startsWith('/auth/register') ||
    url.startsWith('/subscription/plans') ||
    url.startsWith('/pdf/merge') ||
    url.startsWith('/pdf/split') ||
    url.startsWith('/pdf/compress') ||
    url.startsWith('/pdf/convert') ||
    url.startsWith('/pdf/govt-compress') ||
    url.startsWith('/pdf/student-mode');

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const isPublic = isPublicEndpoint(config.url || '');

    if (!isPublic && !token) {
        const authError = new Error('Please login again to continue.');
        authError.code = 'AUTH_TOKEN_MISSING';
        throw authError;
    }

    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

let hasRedirectedForAuth = false;
API.interceptors.response.use((response) => response, (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || '';
    const isAuthError =
        status === 401 ||
        message.toLowerCase().includes('not authorized') ||
        message.toLowerCase().includes('token');

    if (isAuthError) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!hasRedirectedForAuth) {
            hasRedirectedForAuth = true;
            window.location.href = '/login';
        }
    }

    return Promise.reject(error);
});

export const getFileDownloadUrl = (downloadUrl) => {
    if (!downloadUrl) return null;
    if (downloadUrl.startsWith('http')) return downloadUrl;
    return `${API_URL}${downloadUrl}`;
};

export const downloadProcessedFile = async (downloadUrl, fileName = 'downloaded_file') => {
    const absoluteUrl = getFileDownloadUrl(downloadUrl);
    if (!absoluteUrl) {
        throw new Error('Download URL is missing.');
    }

    const res = await fetch(absoluteUrl);
    if (!res.ok) {
        throw new Error('Failed to download file.');
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
};

const postForm = async (url, formData) => {
    const res = await API.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

export const mergePDFs = (formData) => postForm('/pdf/merge', formData);
export const compressPDF = (formData) => postForm('/pdf/compress', formData);
export const splitPDF = (formData) => postForm('/pdf/split', formData);
export const convertToWord = (formData) => {
    formData.append('convertTo', 'docx');
    return postForm('/pdf/convert', formData);
};
export const convertToPdf = (formData) => {
    formData.append('convertTo', 'pdf');
    return postForm('/pdf/convert', formData);
};
export const govtResize = (formData) => postForm('/pdf/govt-compress', formData);
export const studentMode = (formData) => postForm('/pdf/student-mode', formData);

export const loginUser = (authData) => API.post('/auth/login', authData, {
    headers: { 'Content-Type': 'application/json' }
});
export const registerUser = (userData) => API.post('/auth/register', userData, {
    headers: { 'Content-Type': 'application/json' }
});
export const getMyProfile = () => API.get('/auth/profile');
export const getMyFileHistory = (limit = 20) => API.get(`/pdf/history?limit=${limit}`);
export const deleteMyFileHistory = (id) => API.delete(`/pdf/history/${id}`);
export const getPricingPlans = () => API.get('/subscription/plans');
export const getMySubscription = () => API.get('/subscription/me');
export const subscribeToPlan = (planCode, paymentMethod = 'mock') =>
    API.post('/subscription/subscribe', { planCode, paymentMethod }, {
        headers: { 'Content-Type': 'application/json' },
    });
export const cancelMySubscription = () => API.post('/subscription/cancel');
export const createPaymentOrder = (planCode) => API.post('/payment/create-order', { planCode }, {
    headers: { 'Content-Type': 'application/json' },
});
export const verifyPayment = (payload) => API.post('/payment/verify', payload, {
    headers: { 'Content-Type': 'application/json' },
});
export const getAdminStats = () => API.get('/admin/stats');
export const getAdminUsers = (page = 1, limit = 20, q = '') =>
    API.get(`/admin/users?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`);
export const getAdminHealth = () => API.get('/admin/health');
export const updateAdminUser = (id, payload) => API.patch(`/admin/users/${id}`, payload, {
    headers: { 'Content-Type': 'application/json' },
});
export const deleteAdminUser = (id) => API.delete(`/admin/users/${id}`);
export const getAdminTransactions = (page = 1, limit = 20, q = '') =>
    API.get(`/admin/transactions?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`);
export const getAdminReportSummary = () => API.get('/admin/reports/summary');

export default API;
