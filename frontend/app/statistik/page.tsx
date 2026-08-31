'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Site, Category } from '../../data/sites';
import { getCagarBudayaSites } from '../../services/cagarBudaya';
import CategoryIcon from '../../components/icons/CategoryIcon';
import SmartImage from '../../components/SmartImage';
import { getStatusColorText, getStatusColorBg } from '../../lib/siteStatus';
import { getThemeColors } from '../../lib/theme';

/* ── Animated Counter Hook ── */
function useAnimatedCounter(target: number, duration = 1800, delay = 0) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (target <= 0) return;
    let rafId = 0;
    const timeout = setTimeout(() => {
      if (started.current) return;
      started.current = true;
      const startTime = performance.now();
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setCount(Math.round(eased * target));
        if (progress < 1) rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafId);
    };
  }, [target, duration, delay]);

  return count;
}



/* ── Category config ── */
const CATEGORY_CONFIG: Record<Category, { label: string; color: string }> = {
  bangunan: { label: 'Bangunan', color: '#C1622D' },
  situs: { label: 'Situs', color: '#3D6B35' },
  struktur: { label: 'Struktur', color: '#6B5B95' },
  kawasan: { label: 'Kawasan', color: '#1B6E8C' },
  benda: { label: 'Benda', color: '#8C6A2F' },
};

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: string }> = {
  Ditetapkan: { color: '#4ADE80', bgColor: 'rgba(74, 222, 128, 0.12)', icon: '✅' },
  Didaftarkan: { color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.12)', icon: '📋' },
  Usulan: { color: '#64748B', bgColor: 'rgba(148, 163, 184, 0.12)', icon: '📝' },
};

const TINGKAT_CONFIG: Record<string, { color: string; bgColor: string; icon: string }> = {
  NASIONAL: { color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.12)', icon: '🇮🇩' },
  PROVINSI: { color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.12)', icon: '🏛️' },
  KABUPATEN: { color: '#06B6D4', bgColor: 'rgba(6, 182, 212, 0.12)', icon: '🏘️' },
};

export default function StatistikPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)theme=([^;]*)/);
      return (match?.[1] as 'dark' | 'light') || 'light';
    }
    return 'light';
  });

  const loadData = useCallback(() => {
    setError(null);
    setLoading(true);
    getCagarBudayaSites()
      .then(setSites)
      .catch(() => setError('Gagal memuat data dari server. Silakan coba lagi.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await getCagarBudayaSites();
        if (!ignore) setSites(data);
      } catch {
        if (!ignore) setError('Gagal memuat data dari server. Silakan coba lagi.');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  /* ── Computed Stats ── */
  const stats = useMemo(() => {
    const kabupatenSet = new Set(sites.map(s => s.kab));
    const totalPhotos = sites.reduce((acc, s) => acc + (s.gallery?.length ?? 0), 0);

    const categoryDist = Object.keys(CATEGORY_CONFIG).map(cat => ({
      key: cat as Category,
      ...CATEGORY_CONFIG[cat as Category],
      count: sites.filter(s => s.kat === cat).length,
    })).sort((a, b) => b.count - a.count);

    const kabMap: Record<string, number> = {};
    sites.forEach(s => { kabMap[s.kab] = (kabMap[s.kab] || 0) + 1; });
    const kabDist = Object.entries(kabMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    const maxKab = Math.max(...kabDist.map(k => k.count), 1);

    const statusDist = Object.keys(STATUS_CONFIG).map(status => ({
      key: status,
      ...STATUS_CONFIG[status],
      count: sites.filter(s => s.status === status).length,
    }));

    const tingkatDist = Object.keys(TINGKAT_CONFIG).map(tingkat => ({
      key: tingkat,
      ...TINGKAT_CONFIG[tingkat],
      count: sites.filter(s => s.tingkat === tingkat).length,
    }));

    const yearMap: Record<string, number> = {};
    sites.forEach(s => {
      if (s.tahun) {
        yearMap[s.tahun] = (yearMap[s.tahun] || 0) + 1;
      }
    });
    const yearDist = Object.entries(yearMap)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));
    const maxYear = Math.max(...yearDist.map(y => y.count), 1);

    return {
      total: sites.length,
      kabCount: kabupatenSet.size,
      catCount: categoryDist.filter(c => c.count > 0).length,
      totalPhotos,
      categoryDist,
      kabDist,
      maxKab,
      statusDist,
      tingkatDist,
      yearDist,
      maxYear,
    };
  }, [sites]);

  const isDark = theme === 'dark';
  const {
    textColorPrimary: textPrimary,
    textColorSecondary: textSecondary,
    goldColor,
  } = getThemeColors(isDark ? 'dark' : 'light');
  const cardBg = isDark ? 'rgba(17, 22, 37, 0.75)' : 'rgba(255, 255, 255, 0.8)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const pageBg = isDark ? '#0B0F19' : '#F8FAFC';
  const headerBg = isDark ? 'rgba(11, 15, 25, 0.85)' : 'rgba(248, 250, 252, 0.85)';

  const animTotal = useAnimatedCounter(stats.total, 1800, 300);
  const animKab = useAnimatedCounter(stats.kabCount, 1500, 500);
  const animCat = useAnimatedCounter(stats.catCount, 1200, 700);
  const animPhoto = useAnimatedCounter(stats.totalPhotos, 2000, 900);

  if (loading) {
    return (
      <div style={{ minHeight: 'var(--full-height)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: pageBg, color: textSecondary, fontSize: 14 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          Memuat data statistik...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: 'var(--full-height)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: pageBg, color: textSecondary, fontSize: 14, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary, marginBottom: 8 }}>Data tidak dapat dimuat</div>
          <div style={{ lineHeight: 1.6, marginBottom: 20 }}>{error}</div>
          <button type="button" onClick={loadData} style={{
            padding: '10px 22px', borderRadius: 100, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 700, color: goldColor,
            background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.35)',
            transition: 'all 0.2s',
          }}>Muat Ulang</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'var(--full-height)', background: pageBg, overflowY: 'auto', overflowX: 'hidden' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: headerBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${cardBorder}`,
        padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            color: goldColor, textDecoration: 'none', fontSize: 13, fontWeight: 700,
            padding: '6px 14px', borderRadius: 8,
            background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)',
            transition: 'all 0.2s',
          }}>
            ← Kembali ke Peta
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
              📊 Statistik Cagar Budaya
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: goldColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Kepulauan Riau
            </p>
          </div>
        </div>
      </header>

      <main id="main-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 64px' }}>

        {/* Hero Counter Cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16,
          marginBottom: 48,
        }}>
          {[
            { value: animTotal, label: 'Total Situs', icon: '🏛️', accent: goldColor },
            { value: animKab, label: 'Kabupaten/Kota', icon: '🗺️', accent: '#3B82F6' },
            { value: animCat, label: 'Kategori Aktif', icon: '📂', accent: '#8B5CF6' },
            { value: animPhoto, label: 'Foto Galeri', icon: '📸', accent: '#10B981' },
          ].map((card, i) => (
            <div key={i} style={{
              background: cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${cardBorder}`, borderRadius: 16, padding: '24px 20px',
              textAlign: 'center', position: 'relative', overflow: 'hidden',
              animation: `fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s both`,
            }}>
              <div style={{
                position: 'absolute', top: -30, right: -30, width: 80, height: 80,
                borderRadius: '50%', background: card.accent, opacity: 0.08, filter: 'blur(20px)',
              }} />
              <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: card.accent, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {card.value}
              </div>
              <div style={{ fontSize: 13, color: textSecondary, fontWeight: 600, marginTop: 8 }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Two Column: Donut + Status/Tingkat */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24,
          marginBottom: 48,
          animation: 'fadeSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both',
        }}>
          {/* Donut Chart */}
          <div style={{
            background: cardBg, backdropFilter: 'blur(16px)', border: `1px solid ${cardBorder}`,
            borderRadius: 16, padding: 28,
          }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
              📂 Distribusi Kategori
            </h2>
            <DonutChart data={stats.categoryDist} total={stats.total} isDark={isDark} />
          </div>

          {/* Status + Tingkat */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{
              background: cardBg, backdropFilter: 'blur(16px)', border: `1px solid ${cardBorder}`,
              borderRadius: 16, padding: 28, flex: 1,
            }}>
              <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                📋 Status Penetapan
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.statusDist.map((s, i) => {
                  const sColor = isDark ? s.color : getStatusColorText(s.key as Site["status"], false);
                  const sBg = isDark ? s.bgColor : getStatusColorBg(s.key as Site["status"], false);
                  return (
                  <div key={s.key} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    background: sBg, borderRadius: 12, border: `1px solid ${sColor}22`,
                    animation: `fadeSlideRight 0.5s ease ${i * 0.1 + 0.4}s both`,
                  }}>
                    <span style={{ fontSize: 22 }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>{s.key}</div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: sColor }}>{s.count}</div>
                  </div>
                  );
                })}
              </div>
            </div>

            <div style={{
              background: cardBg, backdropFilter: 'blur(16px)', border: `1px solid ${cardBorder}`,
              borderRadius: 16, padding: 28, flex: 1,
            }}>
              <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                🏅 Tingkat Penetapan
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.tingkatDist.map((t, i) => {
                  const tColor = isDark ? t.color : (t.key === 'KABUPATEN' ? '#0891B2' : t.color);
                  return (
                  <div key={t.key} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    background: t.bgColor, borderRadius: 12, border: `1px solid ${tColor}22`,
                    animation: `fadeSlideRight 0.5s ease ${i * 0.1 + 0.6}s both`,
                  }}>
                    <span style={{ fontSize: 22 }}>{t.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>
                        {t.key.charAt(0) + t.key.slice(1).toLowerCase()}
                      </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: tColor }}>{t.count}</div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Kabupaten Bar Chart */}
        <div style={{
          background: cardBg, backdropFilter: 'blur(16px)', border: `1px solid ${cardBorder}`,
          borderRadius: 16, padding: 28, marginBottom: 48,
          animation: 'fadeSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both',
        }}>
          <h2 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
            🗺️ Distribusi per Kabupaten / Kota
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {stats.kabDist.map((kab, i) => {
              const pct = (kab.count / stats.maxKab) * 100;
              const hue = 35 + (i * 25) % 60;
              return (
                <div key={kab.name} style={{
                  animation: `fadeSlideRight 0.5s ease ${i * 0.08 + 0.6}s both`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>{kab.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: goldColor }}>{kab.count} situs</span>
                  </div>
                  <div style={{
                    height: 28, borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    overflow: 'hidden', position: 'relative',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 8,
                      background: `linear-gradient(90deg, hsl(${hue}, 70%, 45%), hsl(${hue}, 80%, 55%))`,
                      width: `${pct}%`,
                      transition: `width 1s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.08 + 0.8}s`,
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10,
                    }}>
                      {pct > 25 && (
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                          {Math.round((kab.count / stats.total) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        {stats.yearDist.length > 0 && (
          <div style={{
            background: cardBg, backdropFilter: 'blur(16px)', border: `1px solid ${cardBorder}`,
            borderRadius: 16, padding: 28, marginBottom: 48,
            animation: 'fadeSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.7s both',
          }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
              📅 Timeline Tahun Penetapan
            </h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180, paddingTop: 10, overflowX: 'auto' }}>
              {stats.yearDist.map((y, i) => {
                const heightPct = (y.count / stats.maxYear) * 100;
                return (
                  <div key={y.year} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 0 48px', minWidth: 48,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: goldColor, marginBottom: 6 }}>{y.count}</span>
                    <div style={{
                      width: '100%', maxWidth: 40, borderRadius: '6px 6px 0 0',
                      background: 'linear-gradient(180deg, #D4AF37, #B89324)',
                      height: `${Math.max(heightPct, 8)}%`,
                      transition: `height 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1 + 0.9}s`,
                      boxShadow: '0 0 12px rgba(212, 175, 55, 0.2)',
                    }} />
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: textSecondary, marginTop: 8,
                      transform: 'rotate(-45deg)', transformOrigin: 'center', whiteSpace: 'nowrap',
                    }}>{y.year}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Sites */}
        <div style={{
          background: cardBg, backdropFilter: 'blur(16px)', border: `1px solid ${cardBorder}`,
          borderRadius: 16, padding: 28,
          animation: 'fadeSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.9s both',
        }}>
          <h2 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
            🌟 Situs dengan Dokumentasi Terlengkap
          </h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16,
          }}>
            {sites
              .filter(s => s.gallery && s.gallery.length > 0)
              .sort((a, b) => (b.gallery?.length ?? 0) - (a.gallery?.length ?? 0))
              .slice(0, 6)
              .map((site, i) => (
                <Link key={site.id} href={`/cagar-budaya/${site.slug}`} style={{
                  textDecoration: 'none', borderRadius: 12, overflow: 'hidden',
                  border: `1px solid ${cardBorder}`,
                  background: isDark ? 'rgba(22, 29, 48, 0.6)' : 'rgba(241, 245, 249, 0.8)',
                  transition: 'all 0.25s ease', display: 'block',
                  animation: `fadeSlideUp 0.5s ease ${i * 0.08 + 1.1}s both`,
                }}>
                  {site.thumbnail && (
                    <div style={{ height: 140, overflow: 'hidden' }}>
                      <SmartImage src={site.thumbnail} alt={site.name}
                        width={640} height={320}
                        sizes="(min-width: 900px) 280px, 100vw"
                        fallbackBackground={isDark ? 'rgba(22, 29, 48, 0.6)' : 'rgba(241, 245, 249, 0.8)'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                      />
                    </div>
                  )}
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: CATEGORY_CONFIG[site.kat]?.color ?? '#888',
                        boxShadow: `0 0 6px ${CATEGORY_CONFIG[site.kat]?.color ?? '#888'}`,
                      }} />
                      <span style={{ fontSize: 10, color: CATEGORY_CONFIG[site.kat]?.color ?? '#888', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {CATEGORY_CONFIG[site.kat]?.label ?? site.kat}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: textPrimary, marginBottom: 4, lineHeight: 1.3 }}>
                      {site.name}
                    </div>
                    <div style={{ fontSize: 11, color: textSecondary }}>
                      📍 {site.kab} · 📸 {site.gallery?.length ?? 0} Foto
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '24px 20px', borderTop: `1px solid ${cardBorder}`,
        color: textSecondary, fontSize: 12,
      }}>
        © {new Date().getFullYear()} WebGIS Cagar Budaya Kepulauan Riau — Data diolah secara otomatis
      </footer>

      {/* Global Animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        html, body {
          height: auto !important;
          overflow: auto !important;
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════
   Donut Chart Component (Pure SVG)
   ══════════════════════════════════════════ */

function DonutChart({ data, total, isDark }: {
  data: { key: Category; label: string; color: string; count: number }[];
  total: number;
  isDark: boolean;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const radius = 90;
  const stroke = 28;
  const circumference = 2 * Math.PI * radius;
  const center = 120;

  const segments = useMemo(() => {
    const build = (d: (typeof data)[number], running: number, index: number) => {
      const pct = d.count / total;
      return {
        ...d,
        pct,
        dashArray: pct * circumference,
        dashOffset: -running * circumference,
        index,
      };
    };
    return data
      .filter((d) => d.count > 0)
      .reduce<{ list: ReturnType<typeof build>[]; running: number }>(
        (acc, d, i) => ({
          list: [...acc.list, build(d, acc.running, i)],
          running: acc.running + d.count / total,
        }),
        { list: [], running: 0 }
      ).list;
  }, [data, total, circumference]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{ position: 'relative', width: 240, height: 240 }}>
        <svg width={240} height={240} viewBox={`0 0 ${center * 2} ${center * 2}`} role="img" aria-label="Diagram lingkaran distribusi kategori cagar budaya">
          <circle cx={center} cy={center} r={radius}
            fill="none" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
            strokeWidth={stroke} />
          {segments.map((seg) => (
            <circle key={seg.key}
              cx={center} cy={center} r={radius}
              fill="none" stroke={seg.color}
              strokeWidth={hoveredIdx === seg.index ? stroke + 6 : stroke}
              strokeDasharray={`${seg.dashArray} ${circumference - seg.dashArray}`}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${center} ${center})`}
              style={{
                transition: 'stroke-width 0.25s ease, opacity 0.25s ease',
                opacity: hoveredIdx !== null && hoveredIdx !== seg.index ? 0.4 : 1,
                cursor: 'pointer',
                filter: hoveredIdx === seg.index ? `drop-shadow(0 0 8px ${seg.color})` : 'none',
              }}
              onMouseEnter={() => setHoveredIdx(seg.index)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: isDark ? '#D4AF37' : '#8A6A15', lineHeight: 1 }}>
            {hoveredIdx !== null ? segments[hoveredIdx]?.count : total}
          </div>
          <div style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, marginTop: 4 }}>
            {hoveredIdx !== null ? segments[hoveredIdx]?.label : 'Total Situs'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', justifyContent: 'center' }}>
        {segments.map((seg) => (
          <button
            key={seg.key}
            type="button"
            onFocus={() => setHoveredIdx(seg.index)}
            onBlur={() => setHoveredIdx(null)}
            onMouseEnter={() => setHoveredIdx(seg.index)}
            onMouseLeave={() => setHoveredIdx(null)}
            aria-pressed={hoveredIdx === seg.index}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px',
              borderRadius: 8, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
              background: hoveredIdx === seg.index ? `${seg.color}22` : 'transparent',
              transition: 'background 0.2s',
            }}
          >
            <span style={{
              width: 10, height: 10, borderRadius: '50%', background: seg.color,
              boxShadow: `0 0 6px ${seg.color}66`, flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#CBD5E1' : '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CategoryIcon category={seg.key} size={13} color={seg.color} /> {seg.label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: seg.color }}>
              {seg.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
