import API from './api';

/**
 * Login user with email, password, and role.
 * Backend validates role matches the registered account.
 */
export const loginUser = async (email, password, role) => {
  const response = await API.post('/auth/login', { email, password, role });
  return response.data;
};

/**
 * Register a new user account.
 */
export const registerUser = async ({ name, email, password, role, phone }) => {
  const response = await API.post('/auth/register', {
    name,
    email,
    password,
    role,
    phone,
  });
  return response.data;
};

/**
 * Fetch the current authenticated user's profile.
 * Token is attached automatically by the API interceptor.
 */
export const getProfile = async () => {
  const response = await API.get('/auth/me');
  return response.data;
};
