import React, { useState } from 'react';
import { api, authStorage } from '../api';
import { Phone, KeyRound, ArrowRight, ShieldCheck, RefreshCw, UserCheck } from 'lucide-react';

export default function AuthView({ onAuthSuccess }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoOtpHint, setDemoOtpHint] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!phone.trim()) {
      setError('Please enter a valid mobile number.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setInfoMessage('');
      const res = await api.sendOtp(phone.trim());
      setStep('otp');
      setInfoMessage('Verification code sent to your WhatsApp number via Minimoth.');
      if (res.demoOtpHint) {
        setDemoOtpHint(res.demoOtpHint);
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit OTP code received on WhatsApp.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.verifyOtp(phone.trim(), otp.trim(), name.trim());
      authStorage.setAuth(res.token, res.user);
      onAuthSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '440px', margin: '2rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            borderRadius: '12px',
            display: 'inline-grid',
            placeItems: 'center',
            color: '#fff',
            marginBottom: '0.75rem'
          }}
        >
          {step === 'phone' ? <ShieldCheck size={26} /> : <KeyRound size={26} />}
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          {step === 'phone' ? 'Sign In / Register' : 'Verify WhatsApp OTP'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {step === 'phone'
            ? 'Enter your WhatsApp mobile number to receive your OTP.'
            : `Enter the 6-digit verification code sent to your WhatsApp (${phone})`}
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {infoMessage && (
        <div className="alert alert-info">
          <span>💬 {infoMessage}</span>
        </div>
      )}

      {demoOtpHint && (
        <div
          className="alert alert-info"
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            borderColor: 'rgba(245, 158, 11, 0.3)',
            color: '#fde68a',
            fontSize: '0.8rem'
          }}
        >
          <span>
            💡 <strong>Demo Mode:</strong> OTP is <code>{demoOtpHint}</code>
          </span>
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handleSendOtp}>
          <div className="form-group">
            <label className="form-label" htmlFor="phone-input">WhatsApp Mobile Number</label>
            <input
              id="phone-input"
              className="input-field"
              type="tel"
              placeholder="e.g. 9619089615 or +919619089615"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name-input">Your Name (Optional)</label>
            <input
              id="name-input"
              className="input-field"
              type="text"
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Sending OTP to WhatsApp...' : 'Send WhatsApp OTP'}
            <ArrowRight size={16} />
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <div className="form-group">
            <label className="form-label" htmlFor="otp-input">6-Digit Code</label>
            <input
              id="otp-input"
              className="input-field"
              type="text"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              style={{ letterSpacing: '0.25em', textAlign: 'center', fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}
              disabled={loading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
            <UserCheck size={16} />
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '0.8rem' }}
              onClick={() => {
                setStep('phone');
                setOtp('');
                setError('');
                setDemoOtpHint('');
              }}
            >
              Change Phone
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '0.8rem' }}
              onClick={handleSendOtp}
              disabled={loading}
            >
              <RefreshCw size={12} /> Resend OTP
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
