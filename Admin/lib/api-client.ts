import axios from 'axios';

// Get API URL dynamically - must be called each time to ensure env vars are loaded
// Must be an absolute URL (starting with http:// or https://)
const getApiBaseURL = (): string => {
  // Default fallback
  const defaultUrl = 'http://localhost:8080';
  
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    // Server-side: use environment variable or default
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || defaultUrl;
    return serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
  }
  
  // Client-side: check localStorage first (for dynamic config), then env, then default
  try {
    const storedUrl = localStorage.getItem('api_base_url');
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = storedUrl || envUrl || defaultUrl;
    
    // Ensure it's an absolute URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.warn('API URL is not absolute, defaulting to', defaultUrl);
      return defaultUrl;
    }
    
    // Remove trailing slash if present
    return url.endsWith('/') ? url.slice(0, -1) : url;
  } catch (e) {
    console.warn('Error getting API URL, using default:', e);
    return defaultUrl;
  }
};

// Get baseURL once at module load (will be validated in interceptor)
const DEFAULT_BASE_URL = 'http://localhost:8080';

// Create axios instance with baseURL set
export const apiClient = axios.create({
  baseURL: DEFAULT_BASE_URL, // Set default, will be updated in interceptor if needed
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: function (status) {
    return status < 500; // Don't throw on 4xx errors
  },
});

// Add token to requests and ensure baseURL is set correctly
apiClient.interceptors.request.use(
  (config) => {
    // Always get baseURL dynamically to ensure it's correct
    const baseURL = getApiBaseURL();
    
    // CRITICAL: Always set baseURL to ensure it's an absolute URL
    config.baseURL = baseURL;
    
    // Ensure URL path starts with /
    if (config.url && !config.url.startsWith('http://') && !config.url.startsWith('https://')) {
      if (!config.url.startsWith('/')) {
        config.url = '/' + config.url;
      }
    }
    
    // Get token
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Build full URL for logging and validation
    const fullUrl = config.baseURL + (config.url?.startsWith('/') ? config.url : '/' + config.url);
    
    // Validate that we have an absolute URL
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      console.error('ERROR: URL is not absolute!', {
        baseURL: config.baseURL,
        url: config.url,
        fullUrl: fullUrl
      });
      throw new Error(`Invalid API URL: ${fullUrl}. BaseURL: ${config.baseURL}, Path: ${config.url}`);
    }
    
    // Debug: Log the full URL being called
    console.log('API Request:', config.method?.toUpperCase(), fullUrl);
    console.log('  Base URL:', config.baseURL);
    console.log('  URL path:', config.url);
    console.log('  Full URL:', fullUrl);
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

