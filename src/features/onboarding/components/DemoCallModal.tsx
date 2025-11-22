/**
 * Demo Call Modal Component
 * Collects phone numbers for free demo call requests
 */

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ModalActions } from '@/components/ui/ModalActions';
import { ChevronDown } from 'lucide-react';
import { submitDemoCallRequest } from '../services/demoCallService';
import { detectCountryFromTimezone } from '../utils/countryDetector';
import {
  formatPhoneNumber,
  formatPhoneForDisplay,
  validatePhoneNumber,
  getFullPhoneNumber,
  getDigitsOnly,
  type Country,
} from '../utils/phoneFormatter';

interface DemoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (phone: string) => void;
  initialPhone?: string;
}

export const DemoCallModal = ({ isOpen, onClose, onSuccess, initialPhone }: DemoCallModalProps) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState('');

  // Load countries data on mount
  useEffect(() => {
    fetch('/countries-full.json')
      .then((res) => res.json())
      .then((data: { countries: Country[] }) => {
        const countriesList = data.countries;
        setCountries(countriesList);

        // Detect and set default country
        const detectedCountryCode = detectCountryFromTimezone();
        const defaultCountry = countriesList.find((c) => c.code === detectedCountryCode) || countriesList[0];
        setSelectedCountry(defaultCountry);
      })
      .catch((error) => {
        console.error('Error loading countries:', error);
      });
  }, []);

  // Re-populate form when modal opens with initialPhone
  useEffect(() => {
    if (isOpen && initialPhone && countries.length > 0) {
      // Find matching country by dial code
      const matchedCountry = countries.find((c) =>
        initialPhone.startsWith(c.dialCode)
      );

      if (matchedCountry) {
        setSelectedCountry(matchedCountry);

        // Extract phone number without dial code
        const phoneWithoutDialCode = initialPhone.substring(matchedCountry.dialCode.length);
        // Format according to country format
        const formatted = formatPhoneNumber(phoneWithoutDialCode, matchedCountry.format);
        setPhoneNumber(formatted);
      }
    }
  }, [isOpen, initialPhone, countries]);

  // Validate phone number
  useEffect(() => {
    const valid = validatePhoneNumber(phoneNumber);
    setIsValid(valid);

    // Show error only after user has typed at least 3 digits
    const digits = getDigitsOnly(phoneNumber);
    if (digits.length >= 3 && !valid) {
      setHasError(true);
    } else {
      setHasError(false);
    }
  }, [phoneNumber]);

  // Format phone number as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!selectedCountry) return;

    const formatted = formatPhoneNumber(value, selectedCountry.format);
    setPhoneNumber(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid || !selectedCountry || isSubmitting) return;

    setIsSubmitting(true);

    const fullPhone = getFullPhoneNumber(selectedCountry.dialCode, phoneNumber);

    const result = await submitDemoCallRequest(fullPhone);

    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      setSubmittedPhone(fullPhone);
      onSuccess?.(fullPhone);
    } else {
      alert(result.message || 'Failed to submit request. Please try again.');
      setHasError(true);
    }
  };

  const handleClose = () => {
    // Reset form state
    setPhoneNumber('');
    setIsSuccess(false);
    setSubmittedPhone('');
    setHasError(false);
    onClose();
  };

  const handleEditNumber = () => {
    // Go back to form view - form will still have the submitted phone number
    setIsSuccess(false);
  };

  if (!selectedCountry) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      title={isSuccess ? undefined : 'Request Free Demo Call'}
      description={isSuccess ? undefined : 'Our team will call you within 24 hours'}
    >
      {isSuccess ? (
        // Success State
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            Request Submitted!
          </h3>
          <p className="text-sm text-neutral-600 mb-6">
            We'll call you at {formatPhoneForDisplay(submittedPhone)}
          </p>

          <ModalActions
            primary={{
              label: 'Done',
              onClick: handleClose,
            }}
            secondary={{
              label: 'Edit number',
              onClick: handleEditNumber,
              variant: 'secondary',
            }}
            layout="vertical"
          />
        </div>
      ) : (
        // Form State
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Country Selector + Phone Input */}
          <div className="relative">
            <div className="flex gap-2">
              {/* Country Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="flex items-center gap-2 px-3 py-3 border border-neutral-300 rounded-xl hover:border-neutral-400 transition-colors bg-white"
                >
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="text-sm font-medium text-neutral-700">
                    {selectedCountry.dialCode}
                  </span>
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                </button>

                {/* Country Dropdown List */}
                {showCountryDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-64 max-h-64 overflow-y-auto bg-white border border-neutral-200 rounded-xl shadow-lg z-10">
                    {countries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(country);
                          setShowCountryDropdown(false);
                          setPhoneNumber('');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-neutral-50 transition-colors"
                      >
                        <span className="text-lg">{country.flag}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-neutral-900 truncate">
                            {country.name}
                          </div>
                          <div className="text-xs text-neutral-600">
                            {country.dialCode}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone Input */}
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder={selectedCountry.format.replace(/X/g, '0')}
                autoFocus
                className={`flex-1 px-4 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  isValid
                    ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                    : hasError
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-neutral-300 focus:ring-black focus:border-black'
                }`}
              />
            </div>

            {/* Validation Message */}
            {hasError && (
              <p className="mt-2 text-sm text-red-600">
                Please enter a valid phone number
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`w-full px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
              !isValid || isSubmitting
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-neutral-800'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Request Call'}
          </button>
        </form>
      )}
    </Modal>
  );
};
