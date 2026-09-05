'use client';

// app/page.tsx
import { Suspense, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Sidebar from './Sidebar';
import SigPanel from './SigPanel';
import SiteDetailPanel from './SiteDetailPanel';
import PremiumLoading from './PremiumLoading';
import MapLegend from './map/MapLegend';
import { Category, Site, categories } from '../data/sites';
import { boundaries } from '../data/boundaries';
import { getCagarBudayaSites } from '../services/cagarBudaya';
import { haversineDistance } from '../lib/geo';
import { getThemeColors } from '../lib/theme';

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: PremiumLoading,
});

const ALL_CATEGORIES = new Set<Category>(['bangunan', 'situs', 'struktur', 'kawasan', 'benda']);

interface SitesResult {
  sites: Site[];
  source: 'api';
  error: string | null;
}

function HomeLoading() {
  return (
    <div style={{ width: '100vw', height: 'var(--full-height)', position: 'relative' }}>
      <PremiumLoading />
    </div>
  );
}

function HomeContent({ initialTheme }: { initialTheme: 'light' | 'dark' | 'satellite' | null }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const siteSlugParam = searchParams.get('site');
  const lastRefreshTimeRef = useRef(0);
  const dismissedSlugRef = useRef<string | null>(null);
  const prevSlugParamRef = useRef<string | null>(siteSlugParam);
  const appliedDeepLinkRef = useRef<string | null>(null);
  // Kunci JSON situs terakhir yang diterapkan — dipakai untuk deteksi perubahan data
  const appliedSitesKeyRef = useRef<string | null>(null);
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [dataSource, setDataSource] = useState<'api' | 'loading'>('loading');
  const [dataError, setDataError] = useState<string | null>(null);
  const [deepLinkNotice, setDeepLinkNotice] = useState<string | null>(null);
  const [flyNonce, setFlyNonce] = useState(0);

  // Theme state — diinisialisasi dari tema yang dikirim server (dibaca dari
  // cookie oleh app/page.tsx) agar SSR dan client selalu sinkron (tanpa
  // hydration mismatch) dan tema tidak kembali ke light saat navigasi.
  const [theme, setTheme] = useState<'light' | 'dark' | 'satellite'>(initialTheme ?? 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.cookie = `theme=${theme}; path=/; max-age=31536000`;
  }, [theme]);

  const isLight = theme === 'light';
  const {
    textColorPrimary,
    textColorSecondary,
    borderColor,
    goldColor,
    goldBorder,
    goldBgSoft,
    headerBg,
    headerBorder,
    sidebarBg,
    tabSwitcherBg,
  } = getThemeColors(isLight ? 'light' : 'dark');

  // Filter state
  const [search, setSearch] = useState('');
  const [activeKat, setActiveKat] = useState<Set<Category>>(
    new Set(ALL_CATEGORIES)
  );
  const [activeKab, setActiveKab] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Situs terakhir yang dipilih — menjaga panel tetap render saat animasi menutup
  const [detailSite, setDetailSite] = useState<Site | null>(null);
  // Panel detail baru terbuka setelah popup peta muncul (sinkron dengan animasi peta),
  // bukan langsung saat situs diklik — agar tidak terasa terlalu cepat.
  const [panelReady, setPanelReady] = useState(false);
  // Melacak apakah panel sedang terbuka, untuk membedakan buka pertama vs ganti situs.
  const prevSelectedIdRef = useRef<string | null>(selectedId);

  // SIG state
  const [radiusMode, setRadiusMode] = useState(false);
  const [radiusKm, setRadiusKm] = useState(20);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocating, setUserLocating] = useState(false);
  const [boundaryMode, setBoundaryMode] = useState(false);

  // Rute (uji lokal): tujuan saat tombol "Rute" ditekan; null = tidak ada rute
  const [routeTarget, setRouteTarget] = useState<{ lat: number; lng: number; name: string } | null>(null);
  // Error geolocation ROUTING + error permintaan rute (OSRM). code 0 = OSRM/
  // server rute gagal, code 1 = izin ditolak, 2/3 = lokasi tak tersedia/timeout.
  // `detail` (opsional) = baris penjelasan tambahan untuk UI.
  const [routeError, setRouteError] = useState<{
    code: number;
    message: string;
    retryable: boolean;
    detail?: string;
  } | null>(null);
  // Ringkasan rute (jarak total meter & durasi detik) dari Map — untuk kartu
  // ringkasan bawah pada mode navigasi mobile. null = belum dihitung.
  const [routeSummary, setRouteSummary] = useState<{ distance: number; duration: number } | null>(null);

  // Callback yang diteruskan ke Map: terima ringkasan rute dari event OSRM
  const handleRouteSummary = useCallback((summary: { distance: number; duration: number } | null) => {
    setRouteSummary(summary);
  }, []);

  // Reset ringkasan saat rute dimulai ulang / dibatalkan
  useEffect(() => {
    setRouteSummary(null);
  }, [routeTarget]);

  // Format jarak total rute (meter → "2.4 km" / "850 m")
  const formatRouteDist = (m: number) =>
    m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  // Format durasi total rute (detik → "±3 mnt" / "45 dtk")
  const formatRouteDur = (s: number) =>
    s >= 60 ? `±${Math.max(1, Math.round(s / 60))} mnt` : `${Math.max(1, Math.round(s))} dtk`;

  // Sidebar tab state
  const [activeSidebarTab, setActiveSidebarTab] = useState<'situs' | 'sig'>('situs');

  // Mobile detection & bottom sheet
  const [isMobile, setIsMobile] = useState(false);
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  // ── Single gesture system (native pointer listeners) ──────────────────────
  // Gesture tutup sheet: pointerdown/move/up dipasang di aside (effek di bawah,
  // ter-ikat ke elemen yang benar-benar ter-mount lewat sheetEl/ref-callback).
  //
  // DOWN gesture → sheet translateY (dismiss gesture).
  //
  // Hanya strip atas ([data-sheet-grab], handle) yang memulai gesture tutup —
  // langsung aktif tanpa deadzone. Area konten dibiarkan touch-action: pan-y
  // agar daftar situs tetap bisa di-scroll native (bukan gesture tutup).
  const sheetDragStartRef = useRef<number | null>(null);
  const sheetDragYRef = useRef(0);
  const sheetDragStartTimeRef = useRef<number>(0);
  const sheetDragActiveRef = useRef(false);
  const sheetDirectionRef = useRef<'up' | 'down' | null>(null);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const sheetAsideRef = useRef<HTMLElement | null>(null);
  // Identitas elemen aside bottom-sheet — dipakai sebagai dependensi efek gesture
  // agar pointer listeners selalu terpasang ke elemen yang benar-benar ter-mount.
  const [sheetEl, setSheetEl] = useState<HTMLElement | null>(null);
  const mobileSheetOpenRef = useRef(mobileSheetOpen);
  mobileSheetOpenRef.current = mobileSheetOpen;

  const sheetSuppressClickRef = useRef(false);
  // Ingat apakah bottom sheet terbuka SAAT seleksi situs dimulai. Dipakai oleh
  // handleCloseDetail untuk memutuskan apakah sheet dikembalikan: hanya bila
  // berasal dari alur menu (sheet terbuka sebelum seleksi). Alur marker (sheet
  // tertutup) → sheet tetap tertutup saat detail ditutup.
  const sheetOpenAtSelectRef = useRef(false);
  // Target rute terakhir yang dipanggil user — dipakai tombol "Coba Lagi" saat
  // permintaan rute (OSRM) gagal & routeTarget dibersihkan, agar retry memakai
  // mekanisme routing yang sudah ada (routeTarget → Map membangun kontrol baru).
  const retryRouteRef = useRef<{ lat: number; lng: number; name: string } | null>(null);
  const GESTURE_THRESHOLD = 10;

  // Ref-callback: simpan node aside & pantau identitasnya. Jika aside di-remount
  // (mis. saat guard isMobile && !routeTarget berubah), sheetEl berubah sehingga
  // efek gesture di bawah berjalan ulang dan listener dipasang ke node yang baru.
  const sheetRefCallback = useCallback((node: HTMLElement | null) => {
    sheetAsideRef.current = node;
    setSheetEl(node);
  }, []);

  useEffect(() => {
    const aside = sheetAsideRef.current;
    if (!aside || !isMobile) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!mobileSheetOpenRef.current) return;
      const target = e.target as HTMLElement;
      // Hanya strip grab atas (handle) yang memulai gesture tutup. Area konten
      // dibiarkan untuk scroll native (touch-action: pan-y), sehingga scroll daftar
      // situs tidak terganggu dan tidak ada penutupan tidak sengaja dari konten.
      const forceActive = !!target.closest('[data-sheet-grab]');
      if (!forceActive) return;
      try { target.setPointerCapture(e.pointerId); } catch { /* capture opsional */ }
      sheetDragStartRef.current = e.clientY;
      sheetDragYRef.current = 0;
      sheetDragStartTimeRef.current = Date.now();
      sheetDragActiveRef.current = true;
      sheetDirectionRef.current = 'down';
      setIsSheetDragging(true);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (sheetDragStartRef.current == null || !mobileSheetOpenRef.current) return;
      const deltaY = e.clientY - sheetDragStartRef.current;

      if (sheetDirectionRef.current === null) {
        if (Math.abs(deltaY) < GESTURE_THRESHOLD) return;
        sheetDirectionRef.current = deltaY > 0 ? 'down' : 'up';
        if (sheetDirectionRef.current === 'up') {
          sheetDragStartRef.current = null;
          return;
        }
        sheetDragActiveRef.current = true;
        setIsSheetDragging(true);
        sheetDragYRef.current = Math.max(0, deltaY);
        setSheetDragY(Math.max(0, deltaY));
        return;
      }

      if (sheetDirectionRef.current === 'up') return;

      sheetDragYRef.current = Math.max(0, deltaY);
      setSheetDragY(Math.max(0, deltaY));
    };

    const onPointerUp = () => {
      if (sheetDragStartRef.current == null) return;
      const dragY = sheetDragYRef.current;
      const dragDuration = Date.now() - sheetDragStartTimeRef.current;
      const velocity = dragDuration > 0 ? dragY / dragDuration : 0;
      const shouldClose = dragY > 70 || (velocity > 0.4 && dragY > 30) || dragY > window.innerHeight * 0.25;
      const wasDrag = dragY > 8;
      sheetDragStartRef.current = null;
      sheetDragActiveRef.current = false;
      sheetDirectionRef.current = null;
      setIsSheetDragging(false);
      setSheetDragY(0);
      if (shouldClose) setMobileSheetOpen(false);
      if (wasDrag) {
        sheetSuppressClickRef.current = true;
        window.setTimeout(() => { sheetSuppressClickRef.current = false; }, 300);
      }
    };

    aside.addEventListener('pointerdown', onPointerDown, { passive: true });
    aside.addEventListener('pointermove', onPointerMove, { passive: true });
    aside.addEventListener('pointerup', onPointerUp, { passive: true });
    aside.addEventListener('pointercancel', onPointerUp, { passive: true });

    return () => {
      aside.removeEventListener('pointerdown', onPointerDown);
      aside.removeEventListener('pointermove', onPointerMove);
      aside.removeEventListener('pointerup', onPointerUp);
      aside.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isMobile, sheetEl]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Sidebar desktop: lipat/buka — default CLOSED/collapse di setiap load (tanpa persistensi)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  // Ada filter situs aktif (pencarian/kategori/kabupaten) — dipakai untuk menandai tombol toggle
  const hasActiveSitesFilter =
    search.trim().length > 0 ||
    activeKab !== 'all' ||
    activeKat.size < Object.keys(categories).length;

  // Width of the right detail panel (in px) – keep in sync with .detail-panel CSS
  const DETAIL_PANEL_WIDTH = 450;

  const loadSites = useCallback(async (): Promise<SitesResult> => {
    try {
      const sites = await getCagarBudayaSites();
      return { sites, source: 'api', error: null };
    } catch {
      return {
        sites: [],
        source: 'api',
        error: 'Data cagar budaya tidak dapat dimuat. Periksa koneksi kemudian coba lagi.',
      };
    }
  }, []);

  // Tombol "Coba Lagi" (API cagar budaya gagal): ulangi permintaan data dengan
  // mekanisme fetch yang SUDAH ADA (loadSites) & terapkan hasilnya persis seperti
  // load awal/refresh. Jika berhasil, dataError → null dan peta terisi.
  const retryLoadData = useCallback(async () => {
    const result = await loadSites();
    appliedSitesKeyRef.current = JSON.stringify(result.sites);
    setAllSites(result.sites);
    setDataSource(result.source);
    setDataError(result.error);
  }, [loadSites, setAllSites, setDataSource, setDataError]);

  // Terapkan daftar situs hanya jika benar-benar berubah. Mencegah refresh saat tab
  // kembali fokus me-rebuild semua marker & me-re-fly (popup "load ulang") padahal
  // data tidak berubah.
  const setAllSitesIfChanged = useCallback((sites: Site[]) => {
    const key = JSON.stringify(sites);
    if (appliedSitesKeyRef.current === key) return;
    appliedSitesKeyRef.current = key;
    setAllSites(sites);
  }, []);

  // Fetch on mount
  useEffect(() => {
    let cancelled = false;
    const initialLoad = async () => {
      const result = await loadSites();
      if (cancelled) return;
      appliedSitesKeyRef.current = JSON.stringify(result.sites);
      setAllSites(result.sites);
      setDataSource(result.source);
      setDataError(result.error);
    };
    initialLoad();
    return () => {
      cancelled = true;
    };
  }, [loadSites]);

  // Auto refresh saat tab kembali fokus/terlihat. refresh() murah: hasilnya dibandingkan
  // via JSON (setAllSitesIfChanged) sehingga jika data tidak berubah tidak ada rebuild
  // marker / re-fly. Tidak memakai "skip event pertama" karena event fokus/visibility
  // tidak selalu terpicu saat load — yang justru membuat refresh pertama terlewati
  // (peta tidak ikut update setelah data diubah dari panel admin).
  useEffect(() => {
    const refresh = async () => {
      // Debounce: abaikan event beruntun (mis. fokus + visibilitychange saat kembali),
      // serta event bawaan yang mungkin terpicu di awal load.
      const now = Date.now();
      if (now - lastRefreshTimeRef.current < 2000) return;
      lastRefreshTimeRef.current = now;
      const result = await loadSites();
      setAllSitesIfChanged(result.sites);
      setDataSource(result.source);
      setDataError(result.error);
    };

    const handleFocus = () => {
      refresh();
    };

    // Tandai waktu mount agar event fokus/visibility bawaan saat load diabaikan,
    // tapi refresh pertama saat benar-benar kembali ke tab tetap berjalan.
    lastRefreshTimeRef.current = Date.now();
    window.addEventListener('focus', handleFocus);

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      refresh();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Kembali dari bfcache (tombol back browser) — efek React tidak dijalankan ulang,
    // jadi perlu refresh manual agar peta tidak menampilkan data lama.
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) refresh();
    };
    window.addEventListener('pageshow', handlePageShow);

    // Tab lain (panel admin) selesai melakukan CRUD → notifyDataChanged() menulis
    // localStorage → event `storage` terpicu di tab ini → peta memuat ulang.
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'webgis_data_version') refresh();
    };
    window.addEventListener('storage', handleStorage);

    // Jaring pengaman: poll berkala (hanya saat tab aktif) agar peta selalu sinkron
    // dengan backend, apa pun skenario navigasi pengguna. refresh() murah — hasilnya
    // dibandingkan via JSON sehingga tidak ada rebuild marker kalau data tidak berubah.
    const pollId = window.setInterval(() => {
      if (!document.hidden) refresh();
    }, 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('storage', handleStorage);
      window.clearInterval(pollId);
    };
  }, [loadSites, setAllSitesIfChanged]);

  // Reset penolakan deep link saat navigasi ke slug baru
  useEffect(() => {
    if (siteSlugParam !== prevSlugParamRef.current) {
      if (siteSlugParam) {
        dismissedSlugRef.current = null;
      }
      prevSlugParamRef.current = siteSlugParam;
    }
  }, [siteSlugParam]);

  // Deep link: /?site=slug — auto-select, reset filter, fly-to marker
  useEffect(() => {
    if (dataSource === 'loading') return;

    // Defer agar setState tidak sinkron di dalam body effect (lint-clean).
    // Di jalankan setelah render saat ini — ref yang dibaca semuanya stabil.
    queueMicrotask(() => {
      // Navigasi kita sendiri (klik marker/list) — seleksi & URL sudah ditangani
      // di handleSelectSite. Lewati agar efek tidak me-reset filter / me-rebuild
      // marker di tengah perpindahan (penyebab flicker).
      if (appliedDeepLinkRef.current) {
        appliedDeepLinkRef.current = null;
        return;
      }

      if (!siteSlugParam) {
        dismissedSlugRef.current = null;
        setDeepLinkNotice(null);
        return;
      }

      if (dismissedSlugRef.current === siteSlugParam) return;

      const site = allSites.find((s) => s.slug === siteSlugParam);
      if (!site) {
        setDeepLinkNotice(`Situs "${siteSlugParam}" tidak ditemukan di peta.`);
        return;
      }

      setDeepLinkNotice(null);

      if (selectedId !== site.id) {
        setSearch('');
        setActiveKab('all');
        setActiveKat(new Set(ALL_CATEGORIES));
        setActiveSidebarTab('situs');
        setSelectedId(site.id);
        prevSelectedIdRef.current = site.id;
        // Buka baru via deep link → panel menunggu onArrive dari Map
        setPanelReady(false);
        setDetailSite(site);
        setFlyNonce((n) => n + 1);
        if (isMobile) {
          setMobileSheetOpen(false);
        }
      }
    });
  }, [siteSlugParam, allSites, dataSource, isMobile, selectedId]);

  const filteredSites = useMemo(() => {
    let list = allSites.filter((s) => {
      const queryTerms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const searchableText = [
        s.name, s.kab, s.kecamatan, s.alamat, s.desc,
        s.status, s.tingkat, s.tahun, s.nomorSK, s.sumber,
        categories[s.kat].label,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchSearch = queryTerms.length === 0 || queryTerms.every((t) => searchableText.includes(t));
      const matchKat = activeKat.has(s.kat);
      const matchKab = activeKab === 'all' || s.kab === activeKab;
      return matchSearch && matchKat && matchKab;
    });
    if (radiusMode && userLoc) {
      const origin = { lat: userLoc.lat, lng: userLoc.lng };
      list = list.filter((s) => haversineDistance(origin, { lat: s.lat, lng: s.lng }) <= radiusKm);
      list.sort(
        (a, b) =>
          haversineDistance(origin, { lat: a.lat, lng: a.lng }) -
          haversineDistance(origin, { lat: b.lat, lng: b.lng })
      );
    }
    return list;
  }, [allSites, search, activeKat, activeKab, radiusMode, radiusKm, userLoc]);

  const kabStats = useMemo(() =>
    boundaries.map((b) => ({
      kab: b.kab, color: b.color,
      count: allSites.filter((s) => s.kab === b.kab).length,
    })),
    [allSites]
  );

  const handleToggleKat = useCallback((key: Category) => {
    setActiveKat((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setActiveKab('all');
    setActiveKat(new Set(ALL_CATEGORIES));
  }, [setSearch, setActiveKab, setActiveKat]);

  const handleSelectSite = useCallback((id: string) => {
    // Klik situs yang sama lagi (marker/daftar) → toggle tutup panel & popup
    if (!id || id === selectedId) {
      setSelectedId(null);
      prevSelectedIdRef.current = null;
      if (siteSlugParam) {
        dismissedSlugRef.current = siteSlugParam;
        router.replace('/', { scroll: false });
      }
      return;
    }

    const wasOpen = prevSelectedIdRef.current != null;
    setSelectedId(id);
    prevSelectedIdRef.current = id;
    // Buka baru (sebelumnya tertutup) → panel menunggu popup peta muncul
    // (onArrive). Saat ganti situs sambil terbuka, panel tetap terbuka.
    if (!wasOpen) setPanelReady(false);
    const site = allSites.find((s) => s.id === id);
    if (site) setDetailSite(site);
    // Mobile: pilih situs dari daftar → tutup sheet menu situs, panel detail yang
    // muncul cukup mengambil alih layar (keduanya tidak boleh timpang tindih).
    // Catat keadaan sheet SEBELUM seleksi agar handleCloseDetail tahu apakah
    // sheet harus dikembalikan (alur menu) atau tetap tertutup (alur marker).
    if (isMobile) {
      sheetOpenAtSelectRef.current = mobileSheetOpen;
      setMobileSheetOpen(false);
    }
    if (site?.slug) {
      // Tandai slug sudah diterapkan agar efek deep-link tidak terpicu ulang
      // (yang akan me-reset filter & me-rebuild semua marker → peta berkedip).
      // Selalu di-set (walau slug sama dengan URL) agar navigasi lama yang
      // masih pending dari klik cepat sebelumnya ikut dibatalkan.
      appliedDeepLinkRef.current = site.slug;
      router.replace(`/?site=${encodeURIComponent(site.slug)}`, { scroll: false });
    }
  }, [allSites, router, siteSlugParam, selectedId, isMobile, setMobileSheetOpen, mobileSheetOpen]);

  const handleCloseDetail = useCallback(() => {
    setSelectedId(null);
    setDetailSite(null);
    prevSelectedIdRef.current = null;
    // Mobile: detail ditutup → kembalikan bottom sheet menu hanya bila sheet
    // sudah terbuka saat seleksi dimulai (alur menu). Bila situs dipilih dari
    // marker (sheet tertutup), sheet tetap tertutup.
    if (isMobileRef.current && sheetOpenAtSelectRef.current) setMobileSheetOpen(true);
    if (siteSlugParam) {
      dismissedSlugRef.current = siteSlugParam;
      router.replace('/', { scroll: false });
    }
  }, [router, siteSlugParam, setMobileSheetOpen]);

  // Helper: set route target & clear error (shared logic)
  const setRouteTargetAndClearError = useCallback((site: Site) => {
    setRouteError(null);
    // Ingat target untuk tombol "Coba Lagi" (lihat handleRouteErrorUI).
    retryRouteRef.current = { lat: site.lat, lng: site.lng, name: site.name };
    setRouteTarget({ lat: site.lat, lng: site.lng, name: site.name });
  }, [setRouteTarget, setRouteError]);

  // Entry point: Rute dari Site Detail Panel
  // - setRouteTarget
  // - mobile: tutup Site Detail (handleCloseDetail) DAN mobileSheetOpen
  // - Routing panel tetap muncul, FAB hidden
  const handleToggleRoute = useCallback((site: Site | null) => {
    if (!site) return;
    const isSame =
      routeTarget != null &&
      routeTarget.lat === site.lat &&
      routeTarget.lng === site.lng;
    // Klik "Rute" lagi pada situs yang sama → batalkan rute. Panel detail tetap
    // terbuka agar pengguna kembali ke konteks situs.
    if (isSame) {
      setRouteTarget(null);
      setRouteError(null);
      return;
    }
    setRouteTargetAndClearError(site);
    if (isMobileRef.current) {
      handleCloseDetail();
    }
    setMobileSheetOpen(false);
  }, [routeTarget, setRouteTargetAndClearError, handleCloseDetail, setMobileSheetOpen]);

  const handleRouteLocationError = useCallback(
    (error: { code: number; message: string; retryable: boolean; detail?: string }) => {
      setRouteError(error);
      // Bersihkan routeTarget agar UI routing kontraksi ulang ke state normal:
      // - code 1 (izin lokasi ditolak): rute tidak bisa dibangun tanpa GPS.
      // - code 0 (OSRM/server rute gagal): hindari kartu rute "Menghitung rute…"
      //   yang nyangkut selamanya — UI error (& tombol Coba Lagi) yang mengambil
      //   alih, dan retry akan membangun kontrol rute baru via retryRouteRef.
      //   GPS/radius/lokasi pengguna TIDAK terpengaruh.
      if (error.code === 1 || error.code === 0) {
        setRouteTarget(null);
      }
    },
    [setRouteTarget, setRouteError]
  );

  const handleToggleRadius = useCallback(() => {
    // Tampilkan "Mendeteksi lokasi..." hanya bila belum punya lokasi. Jika lokasi
    // sudah tersimpan, Map langsung menggambar radius tanpa callback onUserLocFound,
    // sehingga userLocating tidak boleh di-set true (mencegah label nyangkut).
    if (!radiusMode) setUserLocating(!userLoc);
    setRadiusMode((v) => !v);
    if (radiusMode) setUserLoc(null);
  }, [radiusMode, userLoc]);

  const handleUserLocFound = useCallback((loc: { lat: number; lng: number }) => {
    setUserLoc(loc);
    setUserLocating(false);
  }, []);

  // Dipanggil Map saat animasi peta selesai → panel detail muncul serentak dengan popup
  const handleArrive = useCallback(() => setPanelReady(true), []);

  const selectedSite = useMemo(
    () => allSites.find((site) => site.id === selectedId) ?? null,
    [allSites, selectedId]
  );

  // Saat situs tertutup, pertahankan data situs terakhir agar animasi keluar tetap render
  const activeDetailSite = selectedSite ?? detailSite;

  // Tombol toggle sidebar (collapse/open) di sisi kiri map, tengah vertikal.
  // Satu komponen dipakai bergantian: chevron ke kiri saat terbuka, ke kanan saat tertutup.
  const sidebarToggle = () => {
    if (isMobile) return null;
    const collapsed = sidebarCollapsed;
    return (
      <button
        type="button"
        onClick={() => setSidebarCollapsed((v) => !v)}
        aria-label={collapsed ? 'Buka panel daftar cagar budaya' : 'Lipat panel'}
        title={collapsed ? 'Buka panel daftar' : 'Lipat panel'}
        style={{
          position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', zIndex: 1000,
          width: '36px', height: '36px', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${goldBorder}`,
          background: isLight ? '#FFFFFF' : '#111827',
          color: goldColor, cursor: 'pointer',
          boxShadow: isLight ? '0 4px 18px rgba(0,0,0,0.18)' : '0 4px 18px rgba(0,0,0,0.6)',
          transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = goldBgSoft;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${goldColor}22`;
          e.currentTarget.style.transition = 'background 0.2s, box-shadow 0.2s';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isLight ? '#FFFFFF' : '#111827';
          e.currentTarget.style.boxShadow = isLight ? '0 4px 18px rgba(0,0,0,0.18)' : '0 4px 18px rgba(0,0,0,0.6)';
          e.currentTarget.style.transition = 'background 0.2s, box-shadow 0.2s, transform 0.2s';
        }}
      >
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ display: 'block' }}
        >
          <path d={collapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'} />
        </svg>
        {hasActiveSitesFilter && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute', top: '7px', right: '7px',
              width: '7px', height: '7px', borderRadius: '50%',
              background: goldColor,
              boxShadow: `0 0 0 2px ${isLight ? '#FFFFFF' : '#111827'}, 0 0 6px ${goldColor}aa`,
            }}
          />
        )}
      </button>
    );
  };

  // Sidebar content (shared between desktop & mobile)
  const sidebarContent = (
    <>
      {/* Handle bar - hanya mobile, untuk click/toggle & accessibility.
      data-sheet-grab = area gesture tutup sheet (touch-action:none di sini saja).
      Padding besar = hit-area tak terlihat yang luas; batang visual tetap kecil. */}
      {isMobile && (
        <div
          data-sheet-grab="true"
          data-sheet-handle="true"
          role="button"
          tabIndex={0}
          aria-label={mobileSheetOpen ? 'Tutup menu situs' : 'Buka menu situs'}
          onClick={() => {
            if (sheetSuppressClickRef.current) {
              sheetSuppressClickRef.current = false;
              return;
            }
            setMobileSheetOpen((v) => !v);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setMobileSheetOpen((v) => !v);
            }
          }}
          style={{
            display: 'flex', justifyContent: 'center', padding: '18px 0 16px',
            cursor: 'pointer', flexShrink: 0, touchAction: 'none',
          }}
        >
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(212,175,55,0.4)' }} />
        </div>
      )}

      {/* Tab Switcher */}
      <div style={{
        display: 'flex',
        background: tabSwitcherBg,
        borderBottom: `1px solid ${borderColor}`,
        padding: '10px 14px', gap: '8px', flexShrink: 0,
      }}>
        {(['situs', 'sig'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSidebarTab(tab)}
            aria-pressed={activeSidebarTab === tab}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: '9px', cursor: 'pointer',
              fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px', fontFamily: 'inherit', transition: 'all 0.2s',
              background: activeSidebarTab === tab ? goldBgSoft : 'transparent',
              color: activeSidebarTab === tab ? goldColor : textColorSecondary,
              border: activeSidebarTab === tab ? `1px solid ${goldBorder}` : '1px solid transparent',
            }}
          >
            {tab === 'situs' ? 'Daftar' : 'Analisis SIG'}
          </button>
        ))}
      </div>

      {activeSidebarTab === 'situs' ? (
        <Sidebar
          sites={filteredSites} allSites={allSites} selectedId={selectedId}
          onSelectSite={handleSelectSite} search={search} onSearch={setSearch}
          activeKat={activeKat} onToggleKat={handleToggleKat}
          activeKab={activeKab} onKabChange={setActiveKab}
          onResetFilters={handleResetFilters} dataError={dataError ?? deepLinkNotice}
          theme={theme === 'light' ? 'light' : 'dark'}
        />
      ) : (
        <SigPanel
          radiusMode={radiusMode} radiusKm={radiusKm} userLocating={userLocating}
          onToggleRadius={handleToggleRadius} onRadiusChange={setRadiusKm}
          nearestCount={radiusMode ? filteredSites.length : 0}
          boundaryMode={boundaryMode} onToggleBoundary={() => setBoundaryMode((v) => !v)}
          kabStats={kabStats} activeKab={activeKab} onKabChange={setActiveKab}
          theme={theme === 'light' ? 'light' : 'dark'}
        />
      )}
    </>
  );

  return (
    <main id="main-content" style={{ display: 'flex', flexDirection: 'column', height: 'var(--full-height)', overflow: 'hidden', background: headerBg }}>

      {/* Header */}
      <header style={{
        height: isMobile && routeTarget ? '52px' : '60px', background: headerBg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile && routeTarget ? '0 8px 0 4px' : '0 20px', borderBottom: `1.5px solid ${headerBorder}`,
        boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.05)' : '0 4px 20px rgba(0,0,0,0.4)', zIndex: 1000,
        transition: 'background-color 0.2s, border-color 0.2s',
      }}>
        {isMobile && routeTarget ? (
          /* ── Mode Navigasi (mobile): header ringkas ── */
          <>
            <button
              type="button"
              onClick={() => setRouteTarget(null)}
              aria-label="Akhiri rute dan kembali"
              title="Akhiri rute"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: textColorPrimary, padding: '8px', borderRadius: '10px',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flex: 1, minWidth: 0, paddingRight: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '13px', color: goldColor, letterSpacing: '-0.01em', flexShrink: 0 }}>
                Navigasi
              </span>
              <span style={{
                fontWeight: 700, fontSize: '13px', color: textColorPrimary,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
              }}>
                {routeTarget.name}
              </span>
            </div>
          </>
        ) : (
          /* ── Header browsing biasa ── */
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                border: `1.5px solid ${goldColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                boxShadow: `0 0 8px ${goldColor}44`,
              }} aria-hidden="true">{'🏛'}</div>
              <div>
                <h1 style={{ fontWeight: 800, fontSize: '14px', color: textColorPrimary, letterSpacing: '-0.01em', margin: 0 }}>
                  Peta Cagar Budaya
                </h1>
                <div className="header-subtitle" style={{ color: goldColor }}>WebGIS Kepulauan Riau</div>
              </div>
            </div>

            <div className="header-status-bar" style={{ gap: '8px' }}>
              <Link href="/statistik" style={{
                fontSize: '11px', color: goldColor, textDecoration: 'none', fontWeight: 700,
                padding: '4px 12px', borderRadius: '100px',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}>
                📊 Statistik
              </Link>
              {radiusMode && (
                <div style={{
                  fontSize: '11px', color: isLight ? '#9A771C' : '#E5C158', background: goldBgSoft,
                  padding: '4px 12px', borderRadius: '100px',
                  border: `1px solid ${goldBorder}`, fontWeight: 700,
                }}>
                  Radius {radiusKm} km
                </div>
              )}
              {boundaryMode && (
                <div style={{
                  fontSize: '11px', color: '#60A5FA', background: 'rgba(96,165,250,0.12)',
                  padding: '4px 12px', borderRadius: '100px',
                  border: '1px solid rgba(96,165,250,0.25)', fontWeight: 700,
                }}>
                  Batas Wilayah
                </div>
              )}
              <div style={{
                fontSize: '11px', color: textColorPrimary,
                border: `1px solid ${borderColor}`,
                background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                padding: '4px 12px', borderRadius: '100px', fontWeight: 700,
              }}>
                {allSites.length} Situs
              </div>
            </div>
          </>
        )}
      </header>

      {/* Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* DESKTOP: sidebar kiri — panel daftar yang bisa dibuka/ditutup (0 ↔ 360px) */}
        {!isMobile && (
          <aside style={{
            width: sidebarCollapsed ? '0px' : '360px', flexShrink: 0,
            background: sidebarBg, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            borderRight: sidebarCollapsed ? 'none' : `1px solid ${borderColor}`,
            transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s, border-color 0.2s',
          }}>
            {!sidebarCollapsed && (
              /* Konten sidebar */
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
                minWidth: '100%',
              }}>
                {sidebarContent}
              </div>
            )}
          </aside>
        )}

        {/* Peta - fullscreen di mobile, flex:1 di desktop */}
        <div className="map-viewport">
          <Map
            sites={filteredSites} selectedId={selectedId} onSelectSite={handleSelectSite}
            radiusMode={radiusMode} radiusKm={radiusKm} userLoc={userLoc}
            onUserLocFound={handleUserLocFound} boundaryMode={boundaryMode}
            theme={theme} onThemeChange={setTheme}
            detailPanelWidth={DETAIL_PANEL_WIDTH}
            flyNonce={flyNonce}
            sidebarCollapsed={sidebarCollapsed}
            onArrive={handleArrive}
            routeTarget={routeTarget}
            onRouteLocationError={handleRouteLocationError}
            onRouteSummary={handleRouteSummary}
          />

          {sidebarToggle()}

          {/* Badge rute aktif — rute tetap tampil walau panel detail ditutup;
              tombol untuk menghapusnya dari peta.
              MOBILE: diganti kartu ringkasan bawah (mode navigasi). */}
          {routeTarget && isMobile && (
            <div
              style={{
                position: 'absolute',
                left: '12px',
                right: '12px',
                bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                zIndex: 1100,
                background: isLight
                  ? 'rgba(255, 255, 255, 0.97)'
                  : 'rgba(24, 26, 32, 0.97)',
                border: `1px solid ${goldBorder}`,
                borderRadius: '16px',
                padding: '10px 12px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                color: textColorPrimary,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }} aria-hidden="true">🏁</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 800, fontSize: '13px', lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {routeTarget.name}
                  </div>
                  <div style={{ color: textColorSecondary, fontSize: '11.5px', fontWeight: 600, marginTop: '2px' }}>
                    {routeSummary
                      ? `${formatRouteDist(routeSummary.distance)} · ${formatRouteDur(routeSummary.duration)}`
                      : 'Menghitung rute…'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRouteTarget(null)}
                  title="Akhiri rute"
                  aria-label="Akhiri rute"
                  style={{
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
                    border: 'none', borderRadius: '999px',
                    color: '#0B0F19', padding: '9px 16px',
                    fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(212, 175, 55, 0.4)',
                  }}
                >
                  Akhiri Rute
                </button>
              </div>
            </div>
          )}
          {/* DESKTOP: badge rute ramping (tanpa kartu bawah) */}
          {routeTarget && !isMobile && (
            <button
              type="button"
              onClick={() => setRouteTarget(null)}
              title="Hapus rute"
              style={{
                position: 'absolute',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1100,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                borderRadius: '999px',
                border: `1px solid ${goldBorder}`,
                background: isLight
                  ? 'rgba(255, 255, 255, 0.95)'
                  : 'rgba(24, 26, 32, 0.95)',
                color: goldColor,
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                maxWidth: 'calc(100vw - 32px)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span>🧭</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{routeTarget.name}</span>
              <span style={{ color: isLight ? '#64748B' : '#94A3B8', fontWeight: 700, flexShrink: 0 }}>✕</span>
            </button>
          )}

          {/* Routing geolocation error */}
          {routeError && (
            <div
              style={{
                position: 'absolute',
                bottom: isMobile ? '130px' : '90px',
                left: isMobile ? '12px' : '50%',
                right: isMobile ? '12px' : 'auto',
                transform: isMobile ? 'none' : 'translateX(-50%)',
                zIndex: 1100,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxWidth: 'calc(100vw - 24px)',
                pointerEvents: 'auto',
              }}
            >
              <div
                style={{
                  background: isLight ? '#FEF2F2' : 'rgba(127, 29, 29, 0.9)',
                  border: `1px solid ${isLight ? '#FECACA' : '#EF4444'}`,
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: isLight ? '#991B1B' : '#FEE2E2',
                  fontSize: '13px',
                  fontWeight: 500,
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '16px', lineHeight: 1.2 }}>⚠️</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span>{routeError.message}</span>
                    {routeError.detail && (
                      <span style={{ fontSize: '12px', opacity: 0.85 }}>{routeError.detail}</span>
                    )}
                  </div>
                </div>
              </div>
              {routeError.retryable && (
                <button
                  type="button"
                  onClick={() => {
                    setRouteError(null);
                    // Coba Lagi memakai mekanisme routing yang SUDAH ADA:
                    // set routeTarget ke target rute terakhir → Map membangun
                    // kontrol rute baru (effect [routeTarget]) dan mengulang
                    // permintaan ke server rute. Bekerja juga saat panel detail
                    // sudah tertutup (detailSite null) di alur mobile.
                    const retry = retryRouteRef.current;
                    if (retry) setRouteTarget({ lat: retry.lat, lng: retry.lng, name: retry.name });
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
                    border: 'none',
                    borderRadius: '999px',
                    color: '#0B0F19',
                    padding: '10px 20px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)',
                    alignSelf: 'center',
                  }}
                >
                  🔄 Coba Lagi
                </button>
              )}
            </div>
          )}

          {/* Error data cagar budaya — API gagal (backend mati / network / HTTP /
              fetch). Tampil di area peta agar tidak ada map kosong tanpa penjelasan.
              Berbeda dari kondisi data memang kosong (dataError null) yang tetap
              memakai empty state daftar. Retry memakai mekanisme fetch SUDAH ADA
              (loadSites via retryLoadData). */}
          {dataSource === 'api' && dataError && (
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1001,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                alignItems: 'center',
                width: 'min(400px, calc(100vw - 32px))',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  background: isLight ? '#FFFFFF' : 'rgba(30, 41, 59, 0.95)',
                  border: `1px solid ${isLight ? '#FECACA' : '#EF4444'}`,
                  borderRadius: '14px',
                  padding: '16px 18px',
                  color: textColorPrimary,
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.35)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  display: 'flex', flexDirection: 'column', gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>⚠️</span>
                  <span style={{ fontWeight: 800, fontSize: '14px' }}>Gagal memuat data</span>
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8, lineHeight: 1.45 }}>{dataError}</div>
              </div>
              <button
                type="button"
                onClick={() => { void retryLoadData(); }}
                style={{
                  background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
                  border: 'none', borderRadius: '999px', color: '#0B0F19',
                  padding: '10px 20px', fontSize: '12px', fontWeight: 800,
                  cursor: 'pointer', boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)',
                  fontFamily: 'inherit',
                }}
              >
                🔄 Coba Lagi
              </button>
            </div>
          )}

          {isMobile && (
            <div
              onClick={handleCloseDetail}
              aria-hidden="true"
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: !!selectedSite ? 'blur(6px)' : 'blur(0px)',
                WebkitBackdropFilter: !!selectedSite ? 'blur(6px)' : 'blur(0px)',
                opacity: !!selectedSite ? 1 : 0,
                pointerEvents: !!selectedSite ? 'auto' : 'none',
                zIndex: 1150,
                transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), backdrop-filter 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          )}

          {/* Panel detail cagar budaya */}
          <SiteDetailPanel
            site={activeDetailSite}
            isOpen={!!selectedSite && panelReady}
            onClose={handleCloseDetail}
            theme={theme === 'light' ? 'light' : 'dark'}
            isMobile={isMobile}
            onRoute={detailSite ? () => handleToggleRoute(detailSite) : undefined}
          />

          {/* MOBILE: FAB button — hidden when routing is active */}
          {isMobile && !routeTarget && (
            <button
              onClick={() => setMobileSheetOpen((v) => !v)}
              type="button"
              aria-label={mobileSheetOpen ? 'Tutup menu situs' : 'Buka menu situs'}
              title={mobileSheetOpen ? 'Tutup menu situs' : 'Buka menu situs'}
              style={{
                position: 'absolute', bottom: '100px', right: '12px', zIndex: 1100,
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
                border: 'none', boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.15)' : '0 4px 20px rgba(212,175,55,0.5)',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#0B0F19',
              }}
            >
              {mobileSheetOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} aria-hidden="true">
                  <line x1="4" y1="6" x2="20" y2="6"></line>
                  <line x1="4" y1="12" x2="20" y2="12"></line>
                  <line x1="4" y1="18" x2="20" y2="18"></line>
                </svg>
              )}
            </button>
          )}

          {/* MOBILE: Backdrop */}
          {isMobile && mobileSheetOpen && (
            <div
              onClick={() => setMobileSheetOpen(false)}
              aria-hidden="true"
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 880 }}
            />
          )}

          {/* Legenda */}
          <MapLegend />

          {/* Overlay loading: tetap tampil sampai data siap, agar peta tidak
              terlihat kosong tanpa marker saat data API belum termuat. */}
          {dataSource === 'loading' && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 1200 }}>
              <PremiumLoading />
            </div>
          )}
        </div>

        {/* MOBILE: Bottom Sheet — unmount total saat routing aktif */}
        {isMobile && !routeTarget && (
          <aside
            ref={sheetRefCallback}
            data-sheet-open={mobileSheetOpen ? 'true' : undefined}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              width: '100%', height: 'var(--sheet-height)',
              background: sidebarBg,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              borderTop: `1.5px solid ${headerBorder}`,
              borderRadius: '20px 20px 0 0',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              boxShadow: isLight ? '0 -8px 40px rgba(0,0,0,0.08)' : '0 -8px 40px rgba(0,0,0,0.6)',
              zIndex: 900,
              willChange: 'transform',
              transform: mobileSheetOpen
                ? isSheetDragging
                  ? `translateY(${sheetDragY}px)`
                  : 'translateY(0)'
                : 'translateY(100%)',
              transition: isSheetDragging
                ? 'none'
                : 'transform 0.35s cubic-bezier(0.32,0.72,0,1), background-color 0.2s',
              // pan-y: biarkan daftar situs di dalam sheet tetap bisa di-scroll
              // native; only the handle strip has touch-action: none.
              touchAction: 'pan-y',
            }}
          >
            {sidebarContent}
          </aside>
        )}
      </div>
    </main>
  );
}

export default function HomeClient({ initialTheme }: { initialTheme: 'light' | 'dark' | 'satellite' | null }) {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent initialTheme={initialTheme} />
    </Suspense>
  );
}
