import API from './api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Fetch all agreements for the currently authenticated user.
 * Tenant → their agreements as lessee
 * Owner  → their agreements as lessor
 */
export const getMyAgreements = async () => {
  const response = await API.get('/agreements/my');
  return response.data;
};

/**
 * Fetch a single agreement by ID.
 * Only the tenant or owner party can access it.
 * @param {string} id - Agreement MongoDB _id
 */
export const getAgreementById = async (id) => {
  const response = await API.get(`/agreements/${id}`);
  return response.data;
};

/**
 * Tenant accepts a PENDING agreement → becomes ACTIVE.
 * @param {string} id - Agreement _id
 */
export const acceptAgreement = async (id) => {
  const response = await API.put(`/agreements/${id}/accept`);
  return response.data;
};

/**
 * Tenant rejects a PENDING agreement → becomes CANCELLED.
 * @param {string} id - Agreement _id
 */
export const rejectAgreement = async (id) => {
  const response = await API.put(`/agreements/${id}/reject`);
  return response.data;
};

/**
 * Tenant requests early termination of an ACTIVE agreement.
 * @param {string} id - Agreement _id
 * @param {string} [reason] - Optional termination reason
 */
export const requestTermination = async (id, reason = '') => {
  const response = await API.put(`/agreements/${id}/terminate`, { reason });
  return response.data;
};

/**
 * Owner accepts a TERMINATION_REQUESTED agreement → becomes TERMINATED.
 * @param {string} id - Agreement _id
 */
export const acceptTermination = async (id) => {
  const response = await API.put(`/agreements/${id}/terminate/accept`);
  return response.data;
};

/**
 * Owner rejects a termination request → reverts back to ACTIVE.
 * @param {string} id - Agreement _id
 */
export const rejectTermination = async (id) => {
  const response = await API.put(`/agreements/${id}/terminate/reject`);
  return response.data;
};

/**
 * Owner creates a new agreement for a tenant.
 * @param {Object} data - { propertyId, tenantId, leaseStartDate, leaseEndDate, rentAmount, securityDeposit, notes }
 */
export const createAgreement = async (data) => {
  const response = await API.post('/agreements', data);
  return response.data;
};

// ─── NEW: Signature-based workflow ────────────────────────────────────────────

/**
 * Tenant uploads their signature image for a CREATED agreement.
 * @param {string} id - Agreement _id
 * @param {{ uri: string, name: string, type: string }} imageAsset - from expo-image-picker
 */
export const uploadSignature = async (id, imageAsset) => {
  const formData = new FormData();
  formData.append('signature', {
    uri: imageAsset.uri,
    name: imageAsset.name || 'signature.jpg',
    type: imageAsset.type || 'image/jpeg',
  });
  const response = await API.put(`/agreements/${id}/upload-signature`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Owner approves a SIGNED_BY_TENANT agreement → APPROVED_BY_OWNER.
 * @param {string} id - Agreement _id
 */
export const ownerApproveAgreement = async (id) => {
  const response = await API.put(`/agreements/${id}/owner-approve`);
  return response.data;
};

/**
 * Owner rejects a SIGNED_BY_TENANT agreement → REJECTED_BY_OWNER.
 * @param {string} id - Agreement _id
 * @param {string} [reason]
 */
export const ownerRejectAgreement = async (id, reason = '') => {
  const response = await API.put(`/agreements/${id}/owner-reject`, { reason });
  return response.data;
};

/**
 * Fetch HTML from backend and use expo-print to generate & share a PDF.
 * Only works when agreement status is APPROVED_BY_OWNER.
 * @param {string} id - Agreement _id
 */
export const downloadAgreementPDF = async (id) => {
  const response = await API.get(`/agreements/${id}/pdf`);
  const { html } = response.data;

  const { uri } = await Print.printToFileAsync({ html });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save or share your rental agreement',
      UTI: 'com.adobe.pdf',
    });
  }
  return uri;
};

// ─── Status helpers ───────────────────────────────────────────────────────────

/**
 * Returns display-ready badge style for a given status string.
 * @param {string} status
 * @returns {{ bg: string, text: string, label: string, icon: string }}
 */
export const getAgreementStatusStyle = (status) => {
  switch (status) {
    case 'ACTIVE':
      return { bg: '#dcfce7', text: '#166534', label: 'ACTIVE', icon: 'check-circle' };
    case 'PENDING':
      return { bg: '#fef3c7', text: '#92400e', label: 'PENDING', icon: 'hourglass-top' };
    case 'CANCELLED':
      return { bg: '#fee2e2', text: '#991b1b', label: 'CANCELLED', icon: 'cancel' };
    case 'EXPIRED':
      return { bg: '#f3f4f6', text: '#6b7280', label: 'EXPIRED', icon: 'event-busy' };
    case 'TERMINATION_REQUESTED':
      return { bg: '#fff7ed', text: '#c2410c', label: 'TERMINATION REQUESTED', icon: 'pending-actions' };
    case 'TERMINATED':
      return { bg: '#fce7f3', text: '#9d174d', label: 'TERMINATED', icon: 'do-not-disturb' };
    // ── New statuses ──
    case 'CREATED':
      return { bg: '#e0f2fe', text: '#0369a1', label: 'CREATED', icon: 'article' };
    case 'SIGNED_BY_TENANT':
      return { bg: '#fef9c3', text: '#713f12', label: 'SIGNED BY TENANT', icon: 'draw' };
    case 'APPROVED_BY_OWNER':
      return { bg: '#dcfce7', text: '#14532d', label: 'APPROVED BY OWNER', icon: 'verified' };
    case 'REJECTED_BY_OWNER':
      return { bg: '#fee2e2', text: '#7f1d1d', label: 'REJECTED BY OWNER', icon: 'cancel' };
    default:
      return { bg: '#f3f4f6', text: '#6b7280', label: status || 'UNKNOWN', icon: 'help-outline' };
  }
};

/**
 * Format a date string to a human-readable format.
 * @param {string|Date} dateStr
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
