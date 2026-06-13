import React, { useState, useRef, useCallback } from 'react';

interface IDUploadConsentFlowProps {
  onSubmit: (data: { documentImage: string; documentType: string; country: string }) => void;
  isLoading: boolean;
  primaryColor?: string;
}

export const IDUploadConsentFlow: React.FC<IDUploadConsentFlowProps> = ({
  onSubmit,
  isLoading,
  primaryColor = '#3b82f6',
}) => {
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState('passport');
  const [country, setCountry] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentTypes = [
    { value: 'passport', label: 'Passport' },
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'national_id', label: 'National ID Card' },
    { value: 'other', label: 'Other Government ID' },
  ];

  const handleFileChange = useCallback((file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors({ documentImage: 'Please upload an image file' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors({ documentImage: 'File size must be less than 10MB' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setDocumentImage(e.target?.result as string);
      setErrors({});
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      handleFileChange(file);
    },
    [handleFileChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!documentImage) {
      newErrors.documentImage = 'Please upload an ID document';
    }

    if (!country.trim()) {
      newErrors.country = 'Please enter your country';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && documentImage) {
      onSubmit({ documentImage, documentType, country });
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '4px',
  };

  const errorStyle = {
    fontSize: '0.75rem',
    color: '#dc2626',
    marginTop: '4px',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={labelStyle}>Document Type *</label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          style={inputStyle}
          disabled={isLoading}
        >
          {documentTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Country *</label>
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="United States"
          style={{
            ...inputStyle,
            borderColor: errors.country ? '#dc2626' : '#d1d5db',
          }}
          disabled={isLoading}
        />
        {errors.country && <div style={errorStyle}>{errors.country}</div>}
      </div>

      <div>
        <label style={labelStyle}>Upload ID Document *</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: `2px dashed ${isDragging ? primaryColor : errors.documentImage ? '#dc2626' : '#d1d5db'}`,
            borderRadius: '8px',
            padding: '24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: isDragging ? '#f0f9ff' : documentImage ? '#f0fdf4' : 'white',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            style={{ display: 'none' }}
            disabled={isLoading}
          />

          {documentImage ? (
            <div>
              <div
                style={{
                  width: '100%',
                  maxHeight: '200px',
                  overflow: 'hidden',
                  borderRadius: '6px',
                  marginBottom: '12px',
                }}
              >
                <img
                  src={documentImage}
                  alt="ID Document"
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'contain',
                  }}
                />
              </div>
              <p style={{ fontSize: '0.875rem', color: '#10b981', margin: 0 }}>
                Document uploaded successfully
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDocumentImage(null);
                }}
                style={{
                  marginTop: '8px',
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Remove and upload different file
              </button>
            </div>
          ) : (
            <div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 12px',
                  borderRadius: '50%',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6b7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#374151', margin: '0 0 4px' }}>
                <strong>Click to upload</strong> or drag and drop
              </p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                PNG, JPG, or GIF up to 10MB
              </p>
            </div>
          )}
        </div>
        {errors.documentImage && <div style={errorStyle}>{errors.documentImage}</div>}
      </div>

      <div
        style={{
          padding: '12px',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
          fontSize: '0.75rem',
          color: '#6b7280',
        }}
      >
        <strong>Privacy Notice:</strong> Your ID document is securely processed and stored. We
        only extract age verification data and do not store the full document image longer than
        necessary for verification.
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          padding: '12px',
          backgroundColor: primaryColor,
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {isLoading ? 'Uploading and Verifying...' : 'Verify with ID'}
      </button>
    </form>
  );
};