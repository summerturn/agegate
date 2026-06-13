import React, { useState } from 'react';

interface CreditCardConsentFlowProps {
  onSubmit: (data: { cardNumber: string; expiryDate: string; cvv: string; cardholderName: string }) => void;
  isLoading: boolean;
  primaryColor?: string;
}

export const CreditCardConsentFlow: React.FC<CreditCardConsentFlowProps> = ({
  onSubmit,
  isLoading,
  primaryColor = '#3b82f6',
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/(\d{0,4})/g);
    return groups ? groups.filter(Boolean).join(' ').substring(0, 19) : '';
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (!cleanedCardNumber || cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }

    if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      newErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
    } else {
      const [month, year] = expiryDate.split('/');
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
      if (expiry < new Date()) {
        newErrors.expiryDate = 'Card has expired';
      }
    }

    if (!cvv || cvv.length < 3 || cvv.length > 4) {
      newErrors.cvv = 'Please enter a valid CVV';
    }

    if (!cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiryDate,
        cvv,
        cardholderName,
      });
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
        <label style={labelStyle}>Cardholder Name *</label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="John Doe"
          style={{
            ...inputStyle,
            borderColor: errors.cardholderName ? '#dc2626' : '#d1d5db',
          }}
          disabled={isLoading}
        />
        {errors.cardholderName && <div style={errorStyle}>{errors.cardholderName}</div>}
      </div>

      <div>
        <label style={labelStyle}>Card Number *</label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          style={{
            ...inputStyle,
            borderColor: errors.cardNumber ? '#dc2626' : '#d1d5db',
          }}
          disabled={isLoading}
        />
        {errors.cardNumber && <div style={errorStyle}>{errors.cardNumber}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Expiry Date *</label>
          <input
            type="text"
            value={expiryDate}
            onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
            placeholder="MM/YY"
            maxLength={5}
            style={{
              ...inputStyle,
              borderColor: errors.expiryDate ? '#dc2626' : '#d1d5db',
            }}
            disabled={isLoading}
          />
          {errors.expiryDate && <div style={errorStyle}>{errors.expiryDate}</div>}
        </div>
        <div>
          <label style={labelStyle}>CVV *</label>
          <input
            type="text"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
            placeholder="123"
            maxLength={4}
            style={{
              ...inputStyle,
              borderColor: errors.cvv ? '#dc2626' : '#d1d5db',
            }}
            disabled={isLoading}
          />
          {errors.cvv && <div style={errorStyle}>{errors.cvv}</div>}
        </div>
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
        <strong>Privacy Notice:</strong> Your card will not be charged. We only use your card
        details to verify your age. All data is encrypted and securely processed.
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
        {isLoading ? 'Verifying...' : 'Verify with Card'}
      </button>
    </form>
  );
};