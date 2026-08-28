'use client';

// components/Sidebar.tsx

import { useCallback, useEffect, useRef, useState } from 'react';
import { Site, Category, categories, kabupatenList } from '../data/sites';
import { getThemeColors } from '../lib/theme';
import CategoryIcon from './icons/CategoryIcon';

interface SidebarProps {
  sites: Site[];
  allSites: Site[];
  selectedId: string | null;
  onSelectSite: (id: string) => void;
  search: string;
  onSearch: (v: string) => void;
  activeKat: Set<Category>;
  onToggleKat: (k: Category) => void;
  activeKab: string;
  onKabChange: (k: string) => void;
  onResetFilters: () => void;
  dataError?: string | null;
  theme: 'light' | 'dark';
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function Highlight({ text, query }: { text: string; query: string }) {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
  return (
    <>
      {text.split(pattern).map((part, index) => (
        terms.some((term) => part.toLowerCase() === term.toLowerCase()) ? (
          <mark key={`${part}-${index}`} style={{ background: '#D4AF37', color: '#0B0F19', padding: '0 2px', borderRadius: '3px', fontWeight: 600 }}>
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      ))}
    </>
  );
}

interface KabupatenDropdownProps {
  value: string;
  onChange: (v: string) => void;
  isLight: boolean;
  textColorPrimary: string;
  goldColor: string;
  goldBorder: string;
}

function KabupatenDropdown({
  value,
  onChange,
  isLight,
  textColorPrimary,
  goldColor,
  goldBorder,
}: KabupatenDropdownProps) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [focused, setFocused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const openMenu = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setShown(true);
    requestAnimationFrame(() => setOpen(true));
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setShown(false), 220);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, closeMenu]);

  const border = focused
    ? goldColor
    : goldBorder;
  const options = ['all', ...kabupatenList];
  const label = value === 'all' ? 'Semua Wilayah' : value;

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => (open ? closeMenu() : openMenu())}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-haspopup="listbox"
        aria-expanded={open ? "true" : "false"}
        onKeyDown={(e) => {
          if (e.key === 'Escape') closeMenu();
        }}
        style={{
          width: '100%', padding: '8px 12px', borderRadius: '8px',
          border: `1.5px solid ${border}`,
          background: isLight ? '#FFFFFF' : 'rgba(22, 29, 48, 0.8)',
          fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer',
          color: textColorPrimary, outline: 'none', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, opacity: 0.7, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {shown && (
        <div
          role="listbox"
          aria-label="Filter wilayah"
          className={`kab-dropdown-menu ${open ? 'open' : ''}`}
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 30,
            background: isLight ? '#FFFFFF' : '#111625',
            border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '10px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
            padding: '4px', maxHeight: '220px', overflowY: 'auto',
          }}
        >
          {options.map((k, index) => {
            const selected = k === value;
            return (
              <button
                key={k}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => { onChange(k); closeMenu(); }}
                className="kab-dropdown-option"
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px',
                  border: 'none', background: selected ? `${goldColor}1A` : 'transparent',
                  color: textColorPrimary, fontSize: '13px', borderRadius: '6px',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
                  animationDelay: open ? `${0.04 + index * 0.03}s` : '0s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = selected ? `${goldColor}1A` : `${goldColor}22`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = selected ? `${goldColor}1A` : 'transparent'; }}
              >
                {k === 'all' ? 'Semua Wilayah' : k}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  sites, allSites, selectedId, onSelectSite,
  search, onSearch, activeKat, onToggleKat,
  activeKab, onKabChange, onResetFilters, dataError,
  theme,
}: SidebarProps) {
  const isLight = theme === 'light';
  const {
    textColorPrimary,
    textColorSecondary,
    borderColor,
    goldColor,
    goldBorder,
    goldBgSoft,
    goldBgMedium,
  } = getThemeColors(theme);

  const hasActiveSearch = search.trim().length > 0;
  const hasActiveFilter = hasActiveSearch || activeKab !== 'all' || activeKat.size < Object.keys(categories).length;

  return (
    <>
       {/* Search */}
      <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)', fontSize: '14px', opacity: 0.6,
            color: textColorSecondary,
          }} aria-hidden="true">🔍</span>
          <input
            type="text"
            placeholder="Cari cagar budaya, alamat, SK..."
            aria-label="Cari cagar budaya, alamat, atau nomor SK"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && sites.length > 0) {
                onSelectSite(sites[0].id);
              }
            }}
            style={{
              width: '100%', padding: '10px 14px 10px 36px',
              border: `1.5px solid ${goldBorder}`, borderRadius: '10px',
              fontSize: '13px', background: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.04)',
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              color: textColorPrimary, transition: 'all 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = goldColor;
              e.target.style.boxShadow = `0 0 8px ${goldColor}44`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = goldBorder;
              e.target.style.boxShadow = 'none';
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch('')}
              aria-label="Hapus pencarian"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)'}`,
                background: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)',
                color: textColorSecondary,
                cursor: 'pointer',
                fontSize: '12px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Kategori & Kabupaten */}
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
        {dataError && (
          <div style={{
            padding: '9px 11px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#FCA5A5',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            fontSize: '11px',
            lineHeight: 1.4,
            marginBottom: '12px',
          }}>
            ⚠️ {dataError}
          </div>
        )}

        <div style={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: goldColor, marginBottom: '8px',
        }}>Kategori Cagar Budaya</div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {(Object.keys(categories) as Category[]).map((key) => {
            const cat = categories[key];
            const isActive = activeKat.has(key);
            return (
              <button 
                key={key} 
                onClick={() => onToggleKat(key)} 
                aria-pressed={isActive}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '5px 11px', borderRadius: '100px',
                  border: `1.5px solid ${isActive ? cat.color : (isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)')}`,
                  background: isActive ? `${cat.color}25` : (isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.03)'),
                  color: isActive ? (isLight ? '#0F172A' : '#FFFFFF') : textColorSecondary,
                  fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  fontWeight: isActive ? 700 : 400,
                  boxShadow: isActive ? `0 0 10px ${cat.color}22` : 'none',
                }}
              >
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: cat.color, flexShrink: 0,
                  boxShadow: `0 0 6px ${cat.color}`,
                }} />
                {cat.label}
              </button>
            );
          })}
        </div>

        <div style={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: goldColor, marginBottom: '8px',
        }}>Kabupaten / Kota</div>
        
        <KabupatenDropdown
          value={activeKab}
          onChange={onKabChange}
          isLight={isLight}
          textColorPrimary={textColorPrimary}
          goldColor={goldColor}
          goldBorder={goldBorder}
        />
      </div>

      {/* Header daftar */}
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        padding: '14px 18px 8px', flexShrink: 0,
      }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: textColorPrimary, letterSpacing: '-0.01em' }}>
          {hasActiveFilter ? 'Hasil Filter & Pencarian' : 'Daftar Situs Cagar Budaya'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: textColorSecondary }}>{sites.length} dari {allSites.length}</span>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={onResetFilters}
              style={{
                border: `1px solid ${goldBorder}`,
                background: goldBgSoft,
                color: goldColor,
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = goldBgMedium;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = goldBgSoft;
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* LIST — scrollable */}
      <div 
        className="premium-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 12px 16px',
          minHeight: '0',
        }}
      >
        {sites.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 16px', fontSize: '13px', color: textColorSecondary }}>
            Tidak ada situs yang sesuai filter.
          </div>
        )}
        {sites.map((site) => {
          const cat = categories[site.kat];
          const isSelected = site.id === selectedId;
          const imageUrl = site.thumbnail ?? site.gallery?.[0]?.image;
          const statusColor: Record<string, string> = {
            Ditetapkan: isLight ? '#15803D' : '#4ADE80',
            Didaftarkan: isLight ? '#B45309' : '#F59E0B',
            Usulan: isLight ? '#475569' : '#94A3B8',
          };
          const statusBg: Record<string, string> = {
            Ditetapkan: isLight ? 'rgba(22, 163, 74, 0.1)' : 'rgba(74, 222, 128, 0.12)',
            Didaftarkan: isLight ? 'rgba(217, 119, 6, 0.1)' : 'rgba(245, 158, 11, 0.12)',
            Usulan: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(148, 163, 184, 0.12)',
          };

          return (
            <div 
              key={site.id} 
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`Buka detail ${site.name}`}
              onClick={() => onSelectSite(isSelected ? '' : site.id)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSite(isSelected ? '' : site.id);
                }
              }}
              className="card-hover"
              style={{
                display: 'flex', gap: '14px', padding: '14px',
                borderRadius: '14px', cursor: 'pointer', marginBottom: '8px',
                border: `1.5px solid ${isSelected ? goldColor : (isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.04)')}`,
                background: isSelected 
                  ? (isLight ? 'rgba(184, 147, 36, 0.08)' : 'rgba(22, 29, 48, 0.9)') 
                  : (isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.01)'),
                boxShadow: isSelected 
                  ? `0 4px 15px rgba(0, 0, 0, ${isLight ? 0.05 : 0.3}), inset 0 0 8px ${goldColor}12` 
                  : 'none',
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: '64px', height: '64px', borderRadius: '10px',
                backgroundColor: imageUrl 
                  ? (isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.05)') 
                  : (isLight ? '#F1F5F9' : `${cat.color}15`),
                backgroundImage: imageUrl ? `url("${imageUrl}")` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                flexShrink: 0,
                border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)'}`,
              }}>{!imageUrl && <CategoryIcon category={site.kat} size={26} color={cat.color} />}</div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{
                  fontSize: '14px', fontWeight: 700, color: textColorPrimary,
                  marginBottom: '3px', lineHeight: 1.3, whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  <Highlight text={site.name} query={search} />
                </div>
                <div style={{
                  fontSize: '12px', color: textColorSecondary, marginBottom: '7px',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden', lineHeight: 1.35,
                }}>
                  📍 <Highlight text={`${[site.kecamatan, site.kab].filter(Boolean).join(', ')}`} query={search} />
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '10px', padding: '2px 7px', borderRadius: '5px',
                    background: goldBgMedium, 
                    color: goldColor, fontWeight: 700,
                  }}>{cat.label}</span>
                  <span style={{
                    fontSize: '10px', padding: '2px 7px', borderRadius: '5px',
                    background: statusBg[site.status],
                    color: statusColor[site.status], fontWeight: 700,
                  }}>{site.status}</span>
                  {site.tahun && (
                    <span style={{
                      fontSize: '10px', padding: '2px 7px', borderRadius: '5px',
                      background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                      color: isLight ? '#475569' : '#CBD5E1', fontWeight: 700,
                    }}>{site.tahun}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
