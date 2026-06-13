import React, { useState, useCallback } from 'react';
import { AgeGate } from '../AgeGate';
import { VerificationMethod, VerificationResult } from '../types';
import { EmailConsentFlow } from './EmailConsentFlow';
import { CreditCardConsentFlow } from './CreditCardConsentFlow';
import { IDUploadConsentFlow } from './IDUploadConsentFlow';

interface AgeGateConsentModalProps {
  ageGate: AgeGate;
  isOpen: boolean;
  onClose: () => void;
  onVerified: (result: VerificationResult) => void;
  onDenied: (result: VerificationResult) => void;
  config?: {
    title?: string;
    description?: string;
    allowedMethods?: VerificationMethod[];
    minimumAge?: number;
    branding?: {
      logo?: string;
      primaryColor?: string;
      companyName?: string;
    };
  };
}

export const AgeGateConsentModal: React.FC<AgeGateConsentModalProps> = ({
  ageGate,
  isOpen,
  onClose,
  onVerified,
  onDenied,
  config = {},
}) => {
  const [activeMethod, setActiveMethod] = useState<VerificationMethod | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    title = 'Age Verification Required',
    description = 'Please verify your age to continue.',
    allowedMethods = ['email', 'credit_card', 'id_upload'],
    minimumAge = 18,
    branding = {},
  } = config;

  const handleVerify = useCallback(
    async (method: VerificationMethod, data: Record<string, any>) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await ageGate.verify(method, data);
        if (result.success) {
          onVerified(result);
        } else {
          onDenied(result);
        }
      } catch (err: any) {
        setError(err.message || 'Verification failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [ageGate, onVerified, onDenied]
  );

  const handleMethodSelect = (method: VerificationMethod) => {
    setActiveMethod(method);
    setError(null);
  };

  const handleBack = () => {
    setActiveMethod(null);
    setError(null);
  };

  if (!isOpen) return null;

  const primaryColor = branding.primaryColor || '#3b82f6';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '480px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {branding.logo && (
              <img
                src={branding.logo}
                alt={branding.companyName || 'Logo'}
                style={{ height: '32px', width: 'auto' }}
              />
            )}
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                {title}
              </h2>
              {branding.companyName && (
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                  }}
                >
                  {branding.companyName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#6b7280',
              fontSize: '1.5rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#fee2e2',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '0.875rem',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          {!activeMethod ? (
            <div>
              <p
                style={{
                  margin: '0 0 20px',
                  color: '#4b5563',
                  fontSize: '0.875rem',
                }}
              >
                {description}
              </p>
              <p
                style={{
                  margin: '0 0 16px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                }}
              >
                You must be at least {minimumAge} years old. Choose a verification method:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {allowedMethods.includes('email') && (
                  <button
                    onClick={() => handleMethodSelect('email')}
                    style={{
                      padding: '16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      background: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.borderColor = primaryColor;
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.borderColor = '#e5e7eb';
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#111827' }}>Email Verification</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
                      Verify using your email and date of birth
                    </div>
                  </button>
                )}

                {allowedMethods.includes('credit_card') && (
                  <button
                    onClick={() => handleMethodSelect('credit_card')}
                    style={{
                      padding: '16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      background: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.borderColor = primaryColor;
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.borderColor = '#e5e7eb';
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#111827' }}>Credit Card Verification</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
                      Verify using a valid credit card (no charge)
                    </div>
                  </button>
                )}

                {allowedMethods.includes('id_upload') && (
                  <button
                    onClick={() => handleMethodSelect('id_upload')}
                    style={{
                      padding: '16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      background: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.borderColor = primaryColor;
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.borderColor = '#e5e7eb';
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#111827' }}>ID Upload</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
                      Upload a government-issued ID document
                    </div>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={handleBack}
                style={{
                  background: 'none',
                  border: 'none',
                  color: primaryColor,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  marginBottom: '16px',
                  padding: 0,
                }}
              >
                ← Back to methods
              </button>

              {activeMethod === 'email' && (
                <EmailConsentFlow
                  onSubmit={(data) => handleVerify('email', data)}
                  isLoading={isLoading}
                  primaryColor={primaryColor}
                />
              )}
              {activeMethod === 'credit_card' && (
                <CreditCardConsentFlow
                  onSubmit={(data) => handleVerify('credit_card', data)}
                  isLoading={isLoading}
                  primaryColor={primaryColor}
                />
              )}
              {activeMethod === 'id_upload' && (
                <IDUploadConsentFlow
                  onSubmit={(data) => handleVerify('id_upload', data)}
                  isLoading={isLoading}
                  primaryColor={primaryColor}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            fontSize: '0.75rem',
            color: '#9ca3af',
            textAlign: 'center',
          }}
        >
          Your data is securely processed and stored in compliance with GDPR and COPPA.
        </div>
      </div>
    </div>
  );
};
