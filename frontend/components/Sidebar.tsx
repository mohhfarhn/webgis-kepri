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
  textColorSecondary: string;
  goldColor: string;
  goldBorder: string;
  goldBgSoft: string;
}

function KabupatenDropdown({
  value,
  onChange,
  isLight,
  textColorPrimary,
  textColorSecondary,
  goldColor,
  goldBorder,
  goldBgSoft,
}: KabupatenDropdownProps) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [focused, setFocused] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [menuMaxH, setMenuMaxH] = useState(300);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const openMenu = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    // Ukur ruang yang tersedia agar menu tidak terpotong oleh viewport
    const rect = rootRef.current?.getBoundingClientRect();
    const spaceBelow = window.innerHeight - (rect?.bottom ?? 0) - 10;
    const spaceAbove = (rect?.top ?? 0) - 10;
    const menuH = 300;
    let up = false;
    let maxH = spaceBelow;
    if (spaceBelow < menuH) {
      up = spaceAbove > spaceBelow;
      maxH = up ? spaceAbove : spaceBelow;
    }
    setOpenUp(up);
    setMenuMaxH(Math.max(140, Math.min(maxH, menuH)));
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeMenu]);

  const border = focused ? goldColor : goldBorder;
  const options = ['all', ...kabupatenList];
  const label = value === 'all' ? 'Semua Wilayah' : value;

  const pinIcon = (size = 14, active = false) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" fill={active ? 'currentColor' : 'none'} />
    </svg>
  );

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => (open ? closeMenu() : openMenu())}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-haspopup="listbox"
        aria-expanded={open ? "true" : "false"}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: '10px',
          border: `1.5px solid ${border}`,
          background: isLight ? '#FFFFFF' : 'rgba(22, 29, 48, 0.8)',
          fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer',
          color: textColorPrimary, outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
          display: 'flex', alignItems: 'center', gap: '9px',
          boxShadow: focused ? `0 0 0 3px ${goldColor}22` : 'none',
        }}
      >
        <span style={{ color: goldColor, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {pinIcon(15)}
        </span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left', fontWeight: value === 'all' ? 400 : 700 }}>
          {label}
        </span>
        {value !== 'all' && (
          <span style={{
            fontSize: '10px', fontWeight: 700, color: goldColor, flexShrink: 0,
            background: goldBgSoft, border: `1px solid ${goldBorder}`,
            padding: '1px 7px', borderRadius: '100px',
          }}>
            {kabupatenList.length}
          </span>
        )}
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
          style={{
            position: 'absolute', left: 0, right: 0, zIndex: 30,
            top: openUp ? 'auto' : 'calc(100% + 6px)',
            bottom: openUp ? 'calc(100% + 6px)' : 'auto',
            background: isLight ? '#FFFFFF' : '#131927',
            border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderTop: `1px solid ${goldBorder}`,
            borderBottom: openUp ? `1px solid ${goldBorder}` : undefined,
            borderRadius: '12px',
            boxShadow: '0 14px 40px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(212,175,55,0.08)',
            padding: '6px', overflow: 'hidden',
            backdropFilter: isLight ? 'none' : 'blur(14px)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0)' : (openUp ? 'translateY(6px)' : 'translateY(-6px)'),
            pointerEvents: open ? 'auto' : 'none',
          }}
        >
          <div className="premium-scroll" style={{ maxHeight: menuMaxH, overflowY: 'auto', padding: '2px', overflowX: 'hidden' }}>
            {options.map((k, index) => {
              const selected = k === value;
              return (
                <button
                  key={k}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => { onChange(k); closeMenu(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    width: '100%', textAlign: 'left', padding: '8px 10px',
                    border: 'none', background: selected ? goldBgSoft : 'transparent',
                    color: selected ? goldColor : textColorPrimary, fontSize: '13px',
                    borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.15s, color 0.15s',
                    opacity: open ? 1 : 0,
                    animation: open ? `kab-option-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) ${0.02 + index * 0.02}s both` : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) { e.currentTarget.style.background = `${goldColor}18`; e.currentTarget.style.color = goldColor; }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = textColorPrimary; }
                  }}
                >
                  <span style={{ color: selected ? goldColor : textColorSecondary, display: 'flex', flexShrink: 0 }}>
                    {selected ? pinIcon(14, true) : pinIcon(13)}
                  </span>
                  <span style={{ fontWeight: selected ? 700 : 400, flex: 1 }}>
                    {k === 'all' ? 'Semua Wilayah' : k}
                  </span>
                  {selected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
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

  // Filter collapsible — default CLOSED agar daftar menjadi konten utama.
  const [filterOpen, setFilterOpen] = useState(false);
  // Jumlah filter kategori/wilayah yang benar-benar aktif (search TIDAK dihitung).
  const activeFilterCount =
    (Object.keys(categories).length - activeKat.size) +
    (activeKab !== 'all' ? 1 : 0);

  return (
    <>
       {/* Search */}
      <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
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

      {/* Filter Collapsible */}
      <div style={{ padding: '12px 18px 14px', borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
        {dataError && (
          <div style={{
            padding: '9px 11px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#FCA5A5',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            fontSize: '11px',
            lineHeight: 1.4,
            marginBottom: '10px',
          }}>
            ⚠️ {dataError}
          </div>
        )}

        {/* Tombol filter */}
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          aria-expanded={filterOpen}
          aria-controls="site-filter-panel"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', borderRadius: '9px', cursor: 'pointer',
            background: filterOpen ? goldBgSoft : (isLight ? '#F8FAFC' : 'rgba(255,255,255,0.03)'),
            border: `1px solid ${filterOpen ? goldBorder : borderColor}`,
            color: textColorPrimary, fontFamily: 'inherit',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!filterOpen) { e.currentTarget.style.background = goldBgSoft; }
          }}
          onMouseLeave={(e) => {
            if (!filterOpen) { e.currentTarget.style.background = isLight ? '#F8FAFC' : 'rgba(255,255,255,0.03)'; }
          }}
        >
          <span style={{ color: goldColor, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} aria-hidden="true">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700 }}>Filter</span>

          {activeFilterCount > 0 && (
            <span style={{
              marginLeft: 'auto',
              fontSize: '10px', fontWeight: 700,
              background: activeFilterCount > 0 ? goldBgMedium : 'transparent',
              color: goldColor,
              padding: '2px 8px', borderRadius: '100px',
              border: `1px solid ${goldBorder}`,
            }}>
              {activeFilterCount} Aktif
            </span>
          )}

          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{
              marginLeft: activeFilterCount > 0 ? '0px' : 'auto',
              opacity: 0.7, transition: 'transform 0.25s ease', flexShrink: 0,
              transform: filterOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Panel filter */}
        <div
          id="site-filter-panel"
          style={{
            overflow: filterOpen ? 'visible' : 'hidden',
            maxHeight: filterOpen ? 340 : 0,
            opacity: filterOpen ? 1 : 0,
            transition: 'max-height 0.3s ease, opacity 0.25s ease, margin 0.3s ease',
            marginTop: filterOpen ? '12px' : '0px',
          }}
        >
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
            textColorSecondary={textColorSecondary}
            goldColor={goldColor}
            goldBorder={goldBorder}
            goldBgSoft={goldBgSoft}
          />
        </div>
      </div>

      {/* Header daftar */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px',
        padding: '16px 18px 10px', flexShrink: 0,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: textColorPrimary, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {hasActiveFilter ? 'Hasil Filter & Pencarian' : 'Cagar Budaya'}
          </div>
          <div style={{ fontSize: '11px', color: textColorSecondary, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: goldColor }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              {sites.length} Situs Ditemukan
            </span>
            {hasActiveFilter && <span style={{ opacity: 0.7 }}>· dari {allSites.length} total</span>}
          </div>
        </div>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={onResetFilters}
            style={{
              border: `1px solid ${goldBorder}`,
              background: goldBgSoft,
              color: goldColor,
              borderRadius: '7px',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = goldBgMedium;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = goldBgSoft;
            }}
          >
            ↺ Reset
          </button>
        )}
      </div>

      {/* LIST — scrollable */}
      <div 
        className="premium-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2px 14px 18px',
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
                display: 'flex', gap: '15px', padding: '15px',
                borderRadius: '14px', cursor: 'pointer', marginBottom: '10px',
                border: `1.5px solid ${isSelected ? goldColor : (isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.04)')}`,
                background: isSelected 
                  ? (isLight ? 'rgba(184, 147, 36, 0.08)' : 'rgba(22, 29, 48, 0.9)') 
                  : (isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.01)'),
                boxShadow: isSelected 
                  ? `0 4px 15px rgba(0, 0, 0, ${isLight ? 0.05 : 0.3}), inset 0 0 8px ${goldColor}12` 
                  : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: '68px', height: '68px', borderRadius: '10px',
                backgroundColor: imageUrl 
                  ? (isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.05)') 
                  : (isLight ? '#F1F5F9' : `${cat.color}15`),
                backgroundImage: imageUrl ? `url("${imageUrl}")` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px',
                flexShrink: 0,
                border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)'}`,
              }}>{!imageUrl && <CategoryIcon category={site.kat} size={28} color={cat.color} />}</div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{
                  fontSize: '15px', fontWeight: 800, color: textColorPrimary,
                  marginBottom: '4px', lineHeight: 1.3, overflow: 'hidden',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  wordBreak: 'break-word',
                }}>
                  <Highlight text={site.name} query={search} />
                </div>
                <div style={{
                  fontSize: '12px', color: textColorSecondary, marginBottom: '8px',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden', lineHeight: 1.35,
                }}>
                  📍 <Highlight text={`${[site.kecamatan, site.kab].filter(Boolean).join(', ')}`} query={search} />
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: '5px',
                    background: goldBgMedium, 
                    color: goldColor, fontWeight: 700,
                  }}>{cat.label}</span>
                  <span style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: '5px',
                    background: statusBg[site.status],
                    color: statusColor[site.status], fontWeight: 700,
                  }}>{site.status}</span>
                  {site.tahun && (
                    <span style={{
                      fontSize: '10px', padding: '2px 8px', borderRadius: '5px',
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
