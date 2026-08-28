'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getMe, clearToken } from '../../services/adminApi';

interface AdminUser {
  id: number;
  name: string;
  email: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((res) => setUser(res.user))
      .catch(() => {
        clearToken();
        router.replace('/admin/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    clearToken();
    router.replace('/admin/login');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0B0F19',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#D4AF37', fontSize: '16px', fontWeight: 700,
      }}>
        Memuat...
      </div>
    );
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/situs/baru', label: 'Tambah Situs', icon: '➕' },
  ];

  return (
    <div className="admin-shell" style={{ display: 'flex', height: '100vh', background: '#0B0F19', color: '#E2E8F0' }}>
      {/* Sidebar */}
      <aside className="admin-sidebar" style={{
        background: '#111625', borderRight: '1px solid rgba(212,175,55,0.15)',
        display: 'flex', flexShrink: 0,
      }}>
        <div className="admin-brand" style={{
          padding: '20px 16px', borderBottom: '1px solid rgba(212,175,55,0.15)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', color: '#0B0F19', fontWeight: 900,
          }}>A</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC' }}>Admin Panel</div>
            <div style={{ fontSize: '10px', color: '#94A3B8' }}>WebGIS Kepri</div>
          </div>
        </div>

        <nav className="admin-nav" style={{ padding: '12px 8px', flex: 1, display: 'flex', gap: '4px' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '8px', textDecoration: 'none',
                    fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
                    background: isActive ? 'rgba(212,175,55,0.12)' : 'transparent',
                    color: isActive ? '#D4AF37' : '#94A3B8',
                    border: isActive ? '1px solid rgba(212,175,55,0.25)' : '1px solid transparent',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
          })}

          <Link
            href="/"
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '8px', textDecoration: 'none',
              fontSize: '13px', fontWeight: 600, color: '#94A3B8',
              border: '1px solid transparent', marginTop: '8px',
            }}
          >
            <span style={{ fontSize: '16px' }}>🗺️</span>
            Lihat Peta
          </Link>
        </nav>

        {/* User info + logout */}
        <div className="admin-user" style={{
          padding: '16px', borderTop: '1px solid rgba(212,175,55,0.15)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', color: '#D4AF37', fontWeight: 800,
          }}>
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '10px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            type="button"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#EF4444', fontSize: '16px', padding: '4px',
            }}
            title="Logout"
            aria-label="Logout"
          >
            ⏻
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main id="main-content" className="premium-scroll" style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
        {children}
      </main>
    </div>
  );
}
