'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    router.replace(token ? '/admin/dashboard' : '/admin/login');
  }, [router]);

  return (
    <div style={{
      minHeight: 'var(--full-height)', background: '#0B0F19',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#D4AF37', fontSize: '16px', fontWeight: 700,
    }}>
      Mengalihkan...
    </div>
  );
}
