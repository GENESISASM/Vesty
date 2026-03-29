import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
})

axiosInstance.interceptors.request.use((config) => {
    if (typeof window != 'undefined') {
        const token = localStorage.getItem('vesty_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
    }
    return config;
})

axiosInstance.interceptors.response.use(
    (response) => response, (error) => {
        if (error.response && error.response.status == 401) {
            if (typeof window != 'undefined') {
                localStorage.removeItem('vesty_token');
                localStorage.removeItem('vesty_user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
)

export default axiosInstance;