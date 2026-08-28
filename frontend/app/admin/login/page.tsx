'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '../../../services/adminApi';
import { getErrorMessage } from '../../../lib/errors';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAdmin(email, password);
      router.replace('/admin/dashboard');
    } catch (err) {
      setError(getErrorMessage(err) || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0B0F19',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        width: '100%', maxWidth: '400px',
        background: '#111625', borderRadius: '16px',
        border: '1px solid rgba(212,175,55,0.2)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '32px 32px 24px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(212,175,55,0.1)',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', margin: '0 auto 16px', color: '#0B0F19',
            boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
          }}>
            {'🏛'}
          </div>
          <h1 style={{
            fontSize: '20px', fontWeight: 800, color: '#F8FAFC',
            margin: '0 0 4px', letterSpacing: '-0.02em',
          }}>
            Admin Dashboard
          </h1>
          <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
            WebGIS Cagar Budaya Kepulauan Riau
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 32px 32px' }}>
          {error && (
            <div role="alert" style={{
              padding: '10px 14px', borderRadius: '8px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#EF4444', fontSize: '12px', fontWeight: 600,
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="login-email" style={{
              display: 'block', fontSize: '11px', fontWeight: 700,
              color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@webgis.id"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#F8FAFC', fontSize: '13px', outline: 'none',
                transition: 'border-color 0.2s', boxSizing: 'border-box',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="login-password" style={{
              display: 'block', fontSize: '11px', fontWeight: 700,
              color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Masukkan password"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#F8FAFC', fontSize: '13px', outline: 'none',
                transition: 'border-color 0.2s', boxSizing: 'border-box',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: '8px',
              background: loading ? '#64748B' : 'linear-gradient(135deg, #D4AF37, #B8960C)',
              border: 'none', color: '#0B0F19', fontSize: '13px', fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(212,175,55,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
