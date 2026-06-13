import React, { useState } from 'react';

interface EmailConsentFlowProps {
  onSubmit: (data: { email: string; dateOfBirth: string; firstName?: string; lastName?: string }) => void;
  isLoading: boolean;
  primaryColor?: string;
}

export const EmailConsentFlow: React.FC<EmailConsentFlowProps> = ({
  onSubmit,
  isLoading,
  primaryColor = '#3b82f6',
}) => {
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(dateOfBirth);
      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 0 || age > 150) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ email, dateOfBirth, firstName, lastName });
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
        <label style={labelStyle}>Email Address *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{
            ...inputStyle,
            borderColor: errors.email ? '#dc2626' : '#d1d5db',
          }}
          disabled={isLoading}
        />
        {errors.email && <div style={errorStyle}>{errors.email}</div>}
      </div>

      <div>
        <label style={labelStyle}>Date of Birth *</label>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          style={{
            ...inputStyle,
            borderColor: errors.dateOfBirth ? '#dc2626' : '#d1d5db',
          }}
          disabled={isLoading}
        />
        {errors.dateOfBirth && <div style={errorStyle}>{errors.dateOfBirth}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
            style={inputStyle}
            disabled={isLoading}
          />
        </div>
        <div>
          <label style={labelStyle}>Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            style={inputStyle}
            disabled={isLoading}
          />
        </div>
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
        {isLoading ? 'Verifying...' : 'Verify Age'}
      </button>
    </form>
  );
};