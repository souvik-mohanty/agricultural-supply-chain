import axios from 'axios';

// Axios instance
const API = axios.create({
    baseURL: 'http://localhost:8083/api', // Your Spring Boot backend
    headers: {
        'Content-Type': 'application/json',
    },
});

export const createOrder = async (orderData) => {
    return API.post('/orders', orderData);
};