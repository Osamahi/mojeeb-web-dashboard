/**
 * Demo Call Request Service
 * Handles API calls for requesting free demo phone calls
 */

import { getBrowserMetadata } from '../utils/countryDetector';
import { ANIMATION_TIMINGS } from '../constants/timings';

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
 * Submit demo call request to API with 10-second timeout
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

  // Create AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ANIMATION_TIMINGS.API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/api/lead/landing-page-onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal, // Add abort signal
    });

    // Clear timeout on successful response
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      message: 'Your request has been submitted successfully',
    };
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeoutId);

    // Handle timeout specifically
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Request timed out');
      return {
        success: false,
        message: 'Request timed out. Please check your connection and try again.',
      };
    }

    console.error('Error submitting demo call request:', error);
    return {
      success: false,
      message: 'Failed to submit your request. Please try again.',
    };
  }
}
