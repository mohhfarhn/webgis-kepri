'use client';

// components/SigPanel.tsx
// Panel kontrol fitur SIG: pencarian radius dan overlay batas wilayah dengan grafik statistik interaktif

import { useState } from 'react';
import { getThemeColors } from '../lib/theme';

interface SigPanelProps {
  // Radius
  radiusMode: boolean;
  radiusKm: number;
  userLocating: boolean;
  onToggleRadius: () => void;
  onRadiusChange: (km: number) => void;
  nearestCount: number;

  // Batas wilayah
  boundaryMode: boolean;
  onToggleBoundary: () => void;

  // Statistik wilayah
  kabStats: { kab: string; count: number; color: string }[];
  
  // Interaktivitas filter wilayah
  activeKab?: string;
  onKabChange: (k: string) => void;
  
  // Theme
  theme: 'light' | 'dark';
}

export default function SigPanel({
  radiusMode, radiusKm, userLocating, onToggleRadius, onRadiusChange, nearestCount,
  boundaryMode, onToggleBoundary,
  kabStats,
  activeKab = 'all',
  onKabChange,
  theme,
}: SigPanelProps) {
  const [showStats, setShowStats] = useState(true); // Default tampilkan statistik agar interaktif

  const isLight = theme === 'light';
  const {
    textColorPrimary,
    textColorSecondary,
    borderColor,
    goldColor,
    goldBorder,
    goldBorderStrong,
    goldBgSoft,
    goldBgMedium,
  } = getThemeColors(theme);

  const handleBarClick = (kabName: string) => {
    if (activeKab === kabName) {
      onKabChange('all'); // Reset jika diklik lagi
    } else {
      onKabChange(kabName);
    }
  };

  const maxCount = kabStats.reduce((max, k) => Math.max(max, k.count), 0);

  return (
    <div 
      className="premium-scroll"
      style={{
        padding: '14px 18px',
        background: isLight ? '#F8FAFC' : '#111625',
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '0',
      }}
    >
      {/* Label SIG */}
      <div style={{
        fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: goldColor, marginBottom: '10px',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span>🛰️</span> Analisis Spasial & SIG
      </div>

      {/* Tombol Radius */}
      <button
        onClick={onToggleRadius}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
          padding: '10px 12px', borderRadius: '10px', marginBottom: '8px',
          border: `1.5px solid ${radiusMode ? goldColor : borderColor}`,
          background: radiusMode ? goldBgMedium : (isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.02)'),
          color: radiusMode ? textColorPrimary : (isLight ? '#475569' : '#CBD5E1'),
          fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', textAlign: 'left',
          transition: 'all 0.25s',
          boxShadow: radiusMode ? `0 0 10px ${goldColor}22` : 'none',
        }}
        onMouseEnter={(e) => {
          if (!radiusMode) {
            e.currentTarget.style.borderColor = goldBorderStrong;
            e.currentTarget.style.background = isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!radiusMode) {
            e.currentTarget.style.borderColor = borderColor;
            e.currentTarget.style.background = isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.02)';
          }
        }}
      >
        <span style={{ fontSize: '16px' }} aria-hidden="true">📍</span>
        <span style={{ flex: 1 }}>
          {userLocating ? 'Mendeteksi lokasi...' : radiusMode ? 'Radius aktif — klik untuk nonaktif' : 'Cari situs terdekat dari lokasi saya'}
        </span>
        {radiusMode && (
          <span style={{
            fontSize: '9px', padding: '2px 8px', borderRadius: '20px',
            background: goldColor, color: '#0B0F19', fontWeight: 700,
          }}>
            {nearestCount} situs
          </span>
        )}
      </button>

      {/* Slider Radius */}
      {radiusMode && (
        <div style={{
          padding: '12px', background: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.03)',
          border: `1px solid ${borderColor}`,
          borderRadius: '10px', marginBottom: '8px',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '8px',
          }}>
            <span style={{ fontSize: '11px', color: textColorSecondary }}>Jangkauan radius</span>
            <span style={{
              fontSize: '12px', fontWeight: 800, color: goldColor,
              background: goldBgSoft, padding: '2px 8px', borderRadius: '6px',
              border: `1px solid ${goldBorder}`,
            }}>
              {radiusKm} km
            </span>
          </div>
          <input
            type="range"
            min={1} max={100} value={radiusKm}
            aria-label="Jangkauan radius pencarian dalam kilometer"
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: '9px', color: textColorSecondary, marginTop: '4px',
          }}>
            <span>1 km</span>
            <span>50 km</span>
            <span>100 km</span>
          </div>
          {nearestCount === 0 && (
            <div style={{
              marginTop: '10px', padding: '8px', borderRadius: '6px',
              background: isLight ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.1)',
              color: isLight ? '#DC2626' : '#FCA5A5',
              border: `1px solid ${isLight ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)'}`,
              fontSize: '11px', textAlign: 'center',
            }}>
              Tidak ada situs dalam radius {radiusKm} km
            </div>
          )}
        </div>
      )}

      {/* Tombol Batas Wilayah */}
      <button
        onClick={onToggleBoundary}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
          padding: '10px 12px', borderRadius: '10px', marginBottom: '8px',
          border: `1.5px solid ${boundaryMode ? goldColor : borderColor}`,
          background: boundaryMode ? goldBgMedium : (isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.02)'),
          color: boundaryMode ? textColorPrimary : (isLight ? '#475569' : '#CBD5E1'),
          fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', textAlign: 'left',
          transition: 'all 0.25s',
          boxShadow: boundaryMode ? `0 0 10px ${goldColor}22` : 'none',
        }}
        onMouseEnter={(e) => {
          if (!boundaryMode) {
            e.currentTarget.style.borderColor = goldBorderStrong;
            e.currentTarget.style.background = isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!boundaryMode) {
            e.currentTarget.style.borderColor = borderColor;
            e.currentTarget.style.background = isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.02)';
          }
        }}
      >
        <span style={{ fontSize: '16px' }} aria-hidden="true">🗺️</span>
        <span style={{ flex: 1 }}>
          {boundaryMode ? 'Batas wilayah aktif — klik untuk nonaktif' : 'Tampilkan batas wilayah & statistik'}
        </span>
      </button>

      {/* Statistik per Wilayah (Bisa di-toggle atau selalu aktif jika batas wilayah aktif) */}
      {boundaryMode && kabStats.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <button
            onClick={() => setShowStats((v) => !v)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: '8px',
              border: `1px solid ${borderColor}`, 
              background: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.03)',
              fontSize: '11px', fontWeight: 700, color: isLight ? '#475569' : '#CBD5E1',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.03)';
            }}
          >
            <span>📊 Statistik Wilayah (Klik untuk Filter)</span>
            <span>{showStats ? '▲' : '▼'}</span>
          </button>

          {showStats && (
            <div style={{
              marginTop: '6px', padding: '12px',
              background: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.01)', borderRadius: '10px',
              border: `1px solid ${borderColor}`,
            }}>
              {kabStats
                .sort((a, b) => b.count - a.count)
                .map((k) => {
                  const isFiltered = activeKab === k.kab;
                  return (
                    <div 
                      key={k.kab} 
                      role="button"
                      tabIndex={0}
                      aria-pressed={isFiltered}
                      aria-label={isFiltered ? `Reset filter ${k.kab}` : `Filter wilayah ${k.kab}`}
                      onClick={() => handleBarClick(k.kab)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleBarClick(k.kab);
                        }
                      }}
                      style={{
                        display: 'flex', alignItems: 'center',
                        gap: '8px', marginBottom: '8px',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: '6px',
                        background: isFiltered ? goldBgSoft : 'transparent',
                        border: `1px solid ${isFiltered ? goldBorder : 'transparent'}`,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isFiltered) e.currentTarget.style.background = isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.04)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isFiltered) e.currentTarget.style.background = 'transparent';
                      }}
                      title={isFiltered ? `Klik untuk mereset filter ${k.kab}` : `Klik untuk memfilter wilayah ${k.kab}`}
                    >
                      {/* Warna dot */}
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: k.color, flexShrink: 0,
                        boxShadow: `0 0 5px ${k.color}`,
                      }} />
                      
                      {/* Label wilayah */}
                      <span style={{ 
                        flex: 1, 
                        fontSize: '11px', 
                        color: isFiltered ? textColorPrimary : (isLight ? '#475569' : '#CBD5E1'),
                        fontWeight: isFiltered ? 700 : 400 
                      }}>
                        {k.kab}
                      </span>
                      
                      {/* Bar chart */}
                      <div style={{
                        width: '80px', height: '8px', borderRadius: '4px',
                        background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)', overflow: 'hidden',
                        border: `1px solid ${borderColor}`,
                      }}>
                        <div style={{
                          width: `${(k.count / maxCount) * 100}%`,
                          height: '100%', background: k.color, borderRadius: '4px',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>

                      {/* Angka jumlah */}
                      <span style={{
                        fontSize: '11px', fontWeight: 800, color: isFiltered ? goldColor : k.color,
                        minWidth: '20px', textAlign: 'right',
                      }}>
                        {k.count}
                      </span>
                    </div>
                  );
                })}

              <div style={{
                borderTop: `1px solid ${borderColor}`, paddingTop: '8px', marginTop: '8px',
                display: 'flex', justifyContent: 'space-between',
                fontSize: '11px', fontWeight: 700, color: goldColor,
              }}>
                <span>Total Cagar Budaya</span>
                <span>{kabStats.reduce((s, k) => s + k.count, 0)} Situs</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}