/**
 * Authentication utilities for frontend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Check if user is authenticated
 * @returns {Promise<{authenticated: boolean, user?: object}>}
 */
export async function checkAuthStatus() {
  try {
    const response = await fetch(`${API_URL}/auth/status`, {
      credentials: 'include' // Important: send cookies
    });
    
    if (!response.ok) {
      return { authenticated: false };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return { authenticated: false };
  }
}

/**
 * Redirect to login page
 */
export function redirectToLogin() {
  window.location.href = `${API_URL}/auth/login`;
}

/**
 * Logout user
 */
export function logout() {
  window.location.href = `${API_URL}/auth/logout`;
}

export { API_URL };
