import axios from 'axios';

/**
 * Creates a centralized Axios instance for making API calls.
 * - Configures the base URL for the Flask backend.
 * - Enables 'withCredentials' to automatically handle session cookies.
 */
const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true,
});

export default api;