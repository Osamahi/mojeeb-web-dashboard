/**
 * Demo Call Request Service
 * Handles API calls for requesting free demo phone calls
 */

import { getBrowserMetadata } from '../utils/countryDetector';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mojeebapi.azurewebsites.net';

export interface DemoCallRequest {
  phone: string; // Full international format: "+966501234567"
  companyName?: string; // Optional
  source: 'organic' | 'corporate';
  timezone: string;
  screenResolution: string;
  platform: string;
  language: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  country: string;
}

export interface DemoCallResponse {
  success: boolean;
  message?: string;
}

/**
 * Submit demo call request to API
 */
export async function submitDemoCallRequest(
  phone: string,
  companyName?: string
): Promise<DemoCallResponse> {
  const metadata = getBrowserMetadata();

  const payload: DemoCallRequest = {
    phone,
    companyName,
    source: 'organic',
    ...metadata,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/lead/landing-page-onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      message: 'Your request has been submitted successfully',
    };
  } catch (error) {
    console.error('Error submitting demo call request:', error);
    return {
      success: false,
      message: 'Failed to submit your request. Please try again.',
    };
  }
}
