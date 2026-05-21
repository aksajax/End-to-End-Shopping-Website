// src/utils/api.js
import axios from 'axios';
import { getAuthToken } from './auth';

const API = axios.create({
    // baseURL: 'http://127.0.0.1:8000/api/',
    baseURL: 'https://end-to-end-shopping-website.onrender.com/api/',
});

// Request interceptor: Yeh har API call se pehle token automatic jor dega
API.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default API;