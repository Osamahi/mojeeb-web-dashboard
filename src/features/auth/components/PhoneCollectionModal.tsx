/**
 * Phone Collection Modal Component
 * Collects user phone number for profile completion
 * Reuses phone formatting logic from onboarding DemoCallModal
 */

import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ModalActions } from '@/components/ui/ModalActions';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { profileService } from '../services/profileService';
import { detectCountryFromTimezone } from '@/features/onboarding/utils/countryDetector';
import { logger } from '@/lib/logger';
import { CheckCircleIcon } from '@/shared/components/icons';
import { sessionHelper } from '@/lib/sessionHelper';
import {
  formatPhoneNumber,
  formatPhoneForDisplay,
  validatePhoneNumber,
  getFullPhoneNumber,
  getDigitsOnly,
  type Country,
} from '@/features/onboarding/utils/phoneFormatter';

interface PhoneCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (phone: string) => void;
  onSkip?: () => void;
}

export const PhoneCollectionModal = ({ isOpen, onClose, onSuccess, onSkip }: PhoneCollectionModalProps) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        logger.error('Error loading countries data', error instanceof Error ? error : new Error(String(error)));
      });
  }, []);

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

  // Click-outside detection for country dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };

    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCountryDropdown]);

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

    try {
      const fullPhone = getFullPhoneNumber(selectedCountry.dialCode, phoneNumber);

      // Update user profile with phone
      await profileService.updatePhone(fullPhone);

      setIsSuccess(true);
      setSubmittedPhone(fullPhone);

      // Clear all phone tracking (modal + banner)
      sessionHelper.clearPhoneTracking();

      toast.success('Phone number added successfully');
      onSuccess?.(fullPhone);
    } catch (error) {
      logger.error('Failed to update phone number', error instanceof Error ? error : new Error(String(error)));
      toast.error('Failed to save phone number. Please try again.');
      setHasError(true);
    } finally {
      setIsSubmitting(false);
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

  const handleSkip = () => {
    // Modal tracking already handled by DashboardLayout
    onSkip?.();
    handleClose();
  };

  const handleEditNumber = () => {
    // Go back to form view
    setIsSuccess(false);
  };

  if (!selectedCountry) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      title={isSuccess ? undefined : 'Add Your Phone Number'}
    >
      {isSuccess ? (
        // Success State
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>

          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            Phone Number Added!
          </h3>
          <p className="text-sm text-neutral-600 mb-6">
            We'll send important updates to {formatPhoneForDisplay(submittedPhone)}
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
          <div className="relative w-full">
            <div className="flex gap-2 w-full">
              {/* Country Dropdown */}
              <div className="relative flex-shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="flex items-center gap-2 px-3 py-3 border border-neutral-300 rounded-xl hover:border-neutral-400 transition-colors bg-white whitespace-nowrap"
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
                className={`flex-1 min-w-0 px-4 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
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

          {/* Action Buttons */}
          <ModalActions
            primary={{
              label: isSubmitting ? 'Saving...' : 'Save',
              onClick: handleSubmit,
              disabled: !isValid || isSubmitting,
            }}
            secondary={{
              label: 'Skip',
              onClick: handleSkip,
              variant: 'secondary',
            }}
            layout="vertical"
          />
        </form>
      )}
    </Modal>
  );
};
