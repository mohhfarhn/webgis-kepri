'use client';

// components/Map.tsx — versi SIG dengan radius & batas wilayah

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import osrmTextInstructions from 'osrm-text-instructions';
import { ROUTING_URL } from '../lib/routing';

// Instruksi rute Bahasa Indonesia. Plugin leaflet-routing-machine punya kamus
// internal sendiri yang TIDAK mengenal 'id' (akan lempar "No localization"),
// karena itu language plugin dibiarkan 'en' dan kompilasi teks diganti dengan
// osrm-text-instructions yang memang punya set lengkap bahasa Indonesia.
const osrmId = osrmTextInstructions('v5');
import { Site, categories } from '../data/sites';
import { boundaries } from '../data/boundaries';
import BasemapSwitcher from './map/BasemapSwitcher';
import {
  buildSitePopupHtml,
  getClusterBorderColor,
  getMarkerBorderColor,
  MapTheme,
} from '../lib/sitePopup';

interface MapProps {
  sites: Site[];
  selectedId: string | null;
  onSelectSite: (id: string) => void;
  // SIG
  radiusMode: boolean;
  radiusKm: number;
  userLoc: { lat: number; lng: number } | null;
  onUserLocFound: (loc: { lat: number; lng: number }) => void;
  boundaryMode: boolean;
  // Theme
  theme: MapTheme;
  onThemeChange: (theme: MapTheme) => void;
  // Detail panel width (untuk offset posisi popup)
  detailPanelWidth?: number;
  // Dipakai untuk memaksa ulang fly-to saat deep link (?site=slug) diselesaikan
  flyNonce?: number;
  // Sidebar desktop dilipat — map perlu invalidateSize saat lebar area peta berubah
  sidebarCollapsed?: boolean;
  // Dipanggil setelah animasi fly-to selesai agar panel detail muncul serentak dengan popup
  onArrive?: () => void;
  // Rute (uji lokal): tujuan saat tombol "Rute" ditekan; null untuk menghapus rute
  routeTarget?: { lat: number; lng: number; name: string } | null;
  // Callback ketika geolocation untuk routing gagal
  onRouteLocationError?: (error: { code: number; message: string; retryable: boolean }) => void;
}

// Step mentah OSRM v5 yang diteruskan plugin ke stepToText (belum diproses
// menjadi instruction). Hanya properti yang dipakai osrm-text-instructions.
interface RawStep {
  maneuver: { type: string; modifier?: string; bearing_after?: number; exit?: number };
  name?: string;
  ref?: string;
  destinations?: string;
  exits?: string;
  mode?: string;
  rotary_name?: string;
  driving_side?: string;
  intersections?: Array<{ lanes?: Array<{ valid: boolean }> }>;
}

// Kontrol rute plugin meneruskan seluruh opsi ke plan & router bawaannya
// (control.js: `new Plan(wps, options)` + `new OSRMv1(options)`), tetapi
// @types-nya tidak menampung semua properti itu. Gabung agar tetap ter-tipe.
type RouteControlOptions = L.Routing.RoutingControlOptions &
  Pick<L.Routing.PlanOptions, 'createMarker' | 'draggableWaypoints' | 'language'> &
  Pick<L.Routing.OSRMOptions, 'language' | 'serviceUrl' | 'stepToText' | 'timeout'>;

function getPopupTarget(map: L.Map, latLng: L.LatLng, zoom: number, detailPanelWidth = 0) {
  const size = map.getSize();
  const isMobile = size.x <= 768;

  // Pilih titik container (pixel dari kiri-atas peta) tempat marker harus muncul
  // setelah peta dipusatkan ulang, sehingga marker tidak pernah tertutup panel.
  let desired: L.Point;
  if (isMobile) {
    // Mobile: Bottom Sheet setinggi 75vh di bawah → letakkan marker di tengah
    // area kosong 25vh teratas.
    desired = L.point(size.x / 2, size.y * 0.14);
  } else {
    // Desktop: Detail panel di kanan selebar detailPanelWidth → area bebas di kiri.
    const freeWidthPx = Math.max(size.x - detailPanelWidth, 50);
    desired = L.point(freeWidthPx / 2, size.y * 0.66);
  }

  // Hitung center baru: saat peta dipusatkan ke `center`, Leaflet menempatkan
  // `center` di tengah container (size/2). Agar marker (latLng) berada di `desired`,
  // center harus di-offset sebesar (desired - size/2) dari marker dalam proyeksi.
  const centerPoint = L.point(
    map.project(latLng, zoom).x - (desired.x - size.x / 2),
    map.project(latLng, zoom).y - (desired.y - size.y / 2)
  );
  return map.unproject(centerPoint, zoom);
}

function isMapSizeReady(map: L.Map) {
  const size = map.getSize();
  return size.x >= 100 && size.y >= 100;
}

export default function Map({
  sites, selectedId, onSelectSite,
  radiusMode, radiusKm, userLoc, onUserLocFound,
  boundaryMode,
  theme, onThemeChange,
  detailPanelWidth = 0,
  flyNonce = 0,
  sidebarCollapsed = false,
  onArrive,
  routeTarget = null,
  onRouteLocationError,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const routeControlRef = useRef<L.Routing.Control | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const boundaryLayersRef = useRef<L.Polygon[]>([]);
  const boundaryLabelsRef = useRef<L.Marker[]>([]);
  const lightTileRef = useRef<L.TileLayer | null>(null);
  const satelliteTileRef = useRef<L.TileLayer | null>(null);

   // Ref untuk menghindari stale closure pada handler pilihan situs saat peta diklik
  const onSelectSiteRef = useRef(onSelectSite);
  useEffect(() => {
    onSelectSiteRef.current = onSelectSite;
  }, [onSelectSite]);

  // Ref untuk onArrive — dipanggil dari callback Leaflet (bukan dari React state)
  const onArriveRef = useRef(onArrive);
  useEffect(() => {
    onArriveRef.current = onArrive;
  }, [onArrive]);

  // Ref untuk onUserLocFound — dipakai callback geolokasi rute (efek dependensi
  // hanya routeTarget agar posisi terbaru tidak memicu rebuild kontrol rute)
  const onUserLocFoundRef = useRef(onUserLocFound);
  useEffect(() => {
    onUserLocFoundRef.current = onUserLocFound;
  }, [onUserLocFound]);

  // Ref untuk onRouteLocationError — dipanggil saat geolocation routing gagal
  const onRouteLocationErrorRef = useRef(onRouteLocationError);
  useEffect(() => {
    onRouteLocationErrorRef.current = onRouteLocationError;
  }, [onRouteLocationError]);

  // Ref userLoc terbaru untuk seed awal rute tanpa mendaftarkan userLoc sebagai
  // dependensi efek (menghindari loop rebuild saat posisi live terus berubah)
  const latestUserLocRef = useRef(userLoc);
  useEffect(() => {
    latestUserLocRef.current = userLoc;
  }, [userLoc]);

  // Ref detailPanelWidth terbaru: dibaca saat fit panduan rute. Sengaja tidak
  // didaftarkan sebagai dependensi efek rute agar buka/tutup panel tidak
  // me-rebuild kontrol rute (menghapus rute yang sedang berjalan).
  const detailPanelWidthRef = useRef(detailPanelWidth);
  useEffect(() => {
    detailPanelWidthRef.current = detailPanelWidth;
  }, [detailPanelWidth]);

  // Ref untuk melacak selectedId terbaru di dalam callback event Leaflet
  const selectedIdRef = useRef(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // Ref situs terbaru. `sites` TIDAK didaftarkan sebagai dependensi efek fly-to:
  // identitas array berubah saat userLoc/GPS disegarkan (filter radius/sort),
  // dan re-fly itu menimpa pandangan rute di desktop. Baca ref ini agar efek
  // tetap memakai daftar terkini tanpa dipicu oleh refresh incidental.
  const sitesRef = useRef(sites);
  useEffect(() => {
    sitesRef.current = sites;
  }, [sites]);

  // ── Helper label & highlight marker terpilih ──
  // Dipanggil dari efek fly-to (setelah animasi) dan dari efek re-render daftar
  // situs (setelah cluster dibangun ulang). Semua akses via ref, jadi aman
  // dipanggil tanpa mendaftar ulang dependensi state.
  const showSiteLabel = (m: L.Marker, id: string) => {
    const map = mapRef.current;
    if (!map || map.getSize().x <= 768) return;
    const site = sitesRef.current.find((s) => s.id === id);
    if (!site || m.getTooltip()?.isOpen()) return;
    const name = `<span class="site-label-name${site.name.trim().split(/\s+/).length > 5 ? ' site-label-2lines' : ''}">${site.name.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`;
    m.bindTooltip(name, {
      permanent: true,
      direction: 'left',
      offset: [-30, -8],
      className: 'site-label-tooltip',
    }).openTooltip();
  };
  // Hapus label judul dari marker yang tidak lagi dipilih.
  const hideSiteLabel = (m: L.Marker) => {
    if (m.getTooltip()) m.unbindTooltip();
  };

  // Tambahkan class highlight pada marker yang dipilih, hapus dari yang lain,
  // angkat marker terpilih (agar tidak tertutup marker/cluster lain), dan
  // tampilkan label judul cagar budaya di samping marker terpilih (ala Google Maps).
  const applySelectedMarkerClass = () => {
    Object.entries(markersRef.current).forEach(([id, m]) => {
      const el = m.getElement();
      if (!el) return;
      if (id === selectedIdRef.current) {
        el.classList.add('site-marker-selected');
        m.setZIndexOffset(1000);
        showSiteLabel(m, id);
      } else {
        el.classList.remove('site-marker-selected');
        m.setZIndexOffset(0);
        hideSiteLabel(m);
      }
    });
  };

  // ── Init peta sekali ──
  useEffect(() => {
    if (mapRef.current) return;
    // closePopupOnClick: false — kita kontrol sendiri kapan popup ditutup
    // agar popup tidak tertutup saat Bottom Sheet panel ditutup
    const map = L.map('map', { zoomControl: false, closePopupOnClick: false }).setView([1.2, 106.0], 7);
    mapRef.current = map;
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Pastikan ukuran peta terhitung dengan benar setelah inisialisasi layout
    const initResizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    // Deteksi klik pada latar belakang peta untuk menutup pilihan aktif (sinkronisasi state)
    map.on('click', () => {
      // Tutup popup secara eksplisit karena closePopupOnClick dimatikan
      map.closePopup();
      onSelectSiteRef.current('');
    });

    // CATATAN: popupclose handler SENGAJA dihapus.
    // Semua lifecycle popup dan state dikelola secara eksplisit:
    // - Klik area kosong peta → map.on('click') di atas
    // - Tutup panel → handleCloseDetail di page.tsx
    // - Klik marker lain → marker.on('click') → fly-to useEffect

    const lightTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abc',
      maxZoom: 19
    });

    const satelliteTile = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      }
    );

    lightTileRef.current = lightTile;
    satelliteTileRef.current = satelliteTile;

    if (theme === 'satellite') {
      satelliteTile.addTo(map);
    } else {
      lightTile.addTo(map);
    }

    return () => {
      clearTimeout(initResizeTimer);
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      lightTileRef.current = null;
      satelliteTileRef.current = null;
    };
  // theme hanya digunakan untuk initial tile — perubahan theme ditangani oleh useEffect terpisah
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update tile layer saat tema peta berubah ──
  useEffect(() => {
    const map = mapRef.current;
    const lightTile = lightTileRef.current;
    const satTile = satelliteTileRef.current;
    if (!map || !lightTile || !satTile) return;

    if (theme === 'satellite') {
      if (map.hasLayer(lightTile)) map.removeLayer(lightTile);
      if (!map.hasLayer(satTile)) map.addLayer(satTile);
    } else {
      if (map.hasLayer(satTile)) map.removeLayer(satTile);
      if (!map.hasLayer(lightTile)) map.addLayer(lightTile);
    }

    // Paksa recalculate size agar peta termuat sempurna
    const timer = setTimeout(() => {
      // Pastikan objek map dan container DOM-nya masih ada sebelum memanggil invalidateSize
      if (mapRef.current && (mapRef.current as unknown as { _container: HTMLDivElement })._container) {
        map.invalidateSize();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [theme]);

  // ── Sidebar desktop dilipat → lebar area peta berubah → hitung ulang ukuran ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Tunggu transisi lebar sidebar (0.35s) selesai sebelum mengukur ulang
    const timer = setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 380);

    return () => clearTimeout(timer);
  }, [sidebarCollapsed]);

  // ── Render marker cagar budaya ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markerClusterGroupRef.current) {
      map.removeLayer(markerClusterGroupRef.current);
    }

    const clusterGroup = L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50,
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        const size = count >= 100 ? 54 : count >= 50 ? 48 : count >= 10 ? 42 : 38;
        const font = count >= 100 ? 16 : count >= 50 ? 15 : count >= 10 ? 13 : 12;
        const borderColor = getClusterBorderColor(theme);
        cluster.bindTooltip(
          `<div class="cluster-tooltip">
            <b>${count} situs cagar budaya</b>
            <span class="cluster-tooltip-hint">Klik untuk memperbesar area</span>
          </div>`,
          { direction: 'top', offset: L.point(0, -size / 2), opacity: 1 }
        );
        return L.divIcon({
          html: `<div class="cluster-marker" style="width:${size}px;height:${size}px;">
            <span class="b" style="border-color:${borderColor};"></span>
            <span class="b" style="border-color:${borderColor};"></span>
            <span class="b" style="border-color:${borderColor};"></span>
            <span class="count" style="border-color:${borderColor};font-size:${font}px;">${count}</span>
          </div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(size, size),
          iconAnchor: L.point(size / 2, size / 2),
        });
      }
    });
    markerClusterGroupRef.current = clusterGroup;

    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    sites.forEach((site) => {
      const cat = categories[site.kat];

      const icon = L.divIcon({
        className: 'site-marker-wrap',
        html: `<div class="site-marker" style="--marker-color:${cat.color};--marker-border:${getMarkerBorderColor(theme)};">
          <span class="site-marker-core">${cat.icon}</span>
        </div>`,
        iconSize: [32, 32], iconAnchor: [16, 28], popupAnchor: [0, -26],
      });

      const marker = L.marker([site.lat, site.lng], { icon })
        .bindPopup(buildSitePopupHtml(site), {
          maxWidth: 250,
          autoPan: false,
          closeButton: false,
          autoClose: false,
        });

      // Hapus handler bawaan Leaflet yang membuka popup saat klik (_openPopup)
      // agar tidak bentrok dengan useEffect yang mengontrol pembukaan popup via React state
      const markerAny = marker as L.Marker & { _openPopup?: (e: L.LeafletEvent) => void };
      if (markerAny._openPopup) {
        marker.off('click', markerAny._openPopup, marker);
      }

      // Hover behavior: popup muncul saat di-hover dan tertutup saat mouse keluar
      let closeTimeout: ReturnType<typeof setTimeout>;

      // Animasi masuk popup — restart tiap kali popup dibuka (hover atau klik)
      const animatePopup = () => {
        const popupEl = marker.getPopup()?.getElement();
        if (popupEl) {
          const animTargets = popupEl.querySelectorAll<HTMLElement>(
            '.leaflet-popup-content-wrapper, .leaflet-popup-tip'
          );
          animTargets.forEach((el) => el.classList.remove('map-popup-anim'));
          void popupEl.offsetWidth;
          animTargets.forEach((el) => el.classList.add('map-popup-anim'));
        }
      };

      marker.on('mouseover', (e) => {
        const el = marker.getElement();
        const related = (e.originalEvent as MouseEvent).relatedTarget as Node | null;
        if (el && related && el.contains(related)) {
          return; // Masih di dalam marker (misal berpindah antar child span/div)
        }

        clearTimeout(closeTimeout);
        // Popup hanya sebagai tooltip hover sementara: tampil saat kursor berada
        // di marker, hilang saat keluar. Klik marker hanya membuka panel detail.
        if (!marker.isPopupOpen()) {
          marker.openPopup();
        }
      });

      marker.on('mouseout', (e) => {
        const el = marker.getElement();
        const related = (e.originalEvent as MouseEvent).relatedTarget as Node | null;
        if (el && related && el.contains(related)) {
          return; // Masih di dalam marker
        }

        closeTimeout = setTimeout(() => {
          if (markersRef.current[site.id]) {
            marker.closePopup();
          }
        }, 250);
      });

      marker.on('popupopen', (e) => {
        animatePopup();
        // Saat marker terpilih (sedang ada label judul permanen), sembunyikan
        // label selama popup hover terbuka agar keduanya tidak bertumpuk.
        if (site.id === selectedIdRef.current && marker.getTooltip()) {
          marker.closeTooltip();
        }
        const container = e.popup.getElement();
        if (container) {
          L.DomEvent.on(container, 'mouseover', (ev) => {
            const related = (ev as MouseEvent).relatedTarget as Node | null;
            if (related && container.contains(related)) {
              return; // Masih di dalam popup
            }
            clearTimeout(closeTimeout);
          });
          L.DomEvent.on(container, 'mouseout', (ev) => {
            const related = (ev as MouseEvent).relatedTarget as Node | null;
            if (related && container.contains(related)) {
              return; // Masih di dalam popup
            }
            closeTimeout = setTimeout(() => {
              if (markersRef.current[site.id]) {
                marker.closePopup();
              }
            }, 250);
          });
        }
      });

      marker.on('popupclose', () => {
        // Saat popup hover ditutup, tampilkan kembali label judul jika marker
        // ini masih terpilih.
        if (site.id === selectedIdRef.current && marker.getTooltip()) {
          marker.openTooltip();
        }
      });

      // Handler klik kustom — gunakan ref agar tidak stale & tidak memicu re-render markers.
      // Klik marker yang sedang dipilih lagi → toggle: tutup panel detail & popup.
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (selectedIdRef.current === site.id) {
          onSelectSiteRef.current('');
          return;
        }
        onSelectSiteRef.current(site.id);
      });
      markersRef.current[site.id] = marker;
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

  }, [sites, theme]);

  // ── Fly ke situs dipilih & Kelola Popup ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;

    const site = sitesRef.current.find((s) => s.id === selectedId);
    if (!site) return;

    // Mobile: Bottom Sheet & panel detail menutupi peta di area bawah. Popup dan
    // label permanen tidak mungkin tampil di atasnya (pane Leaflet terjebak dalam
    // stacking context .leaflet-map-pane yang bertransform), jadi di mobile keduanya
    // disembunyikan saat panel tiba — informasi judul & detail sudah ada di sheet.
    const mobile = map.getSize().x <= 768;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Cegah performMove dijalankan dua kali untuk seleksi yang sama
    // (zoomToShowLayer kadang memanggil callback lebih dari sekali).
    let performedRef = false;

    const flyToSite = (retriesLeft: number) => {
      if (cancelled) return;

      map.invalidateSize();

      if (!isMapSizeReady(map)) {
        if (retriesLeft > 0) {
          timers.push(setTimeout(() => flyToSite(retriesLeft - 1), 200));
        }
        return;
      }

      // Pertahankan popup marker yang dipilih tetap terbuka (pinned) — popup
      // marker lain ditutup. Sebelumnya "tutup semua" membuat popup yang muncul
      // saat hover langsung hilang/berkedip ketika marker diklik.
      const marker = markersRef.current[selectedId];

      map.eachLayer((layer: L.Layer) => {
        if (layer instanceof L.Marker && layer !== marker && layer.isPopupOpen()) {
          layer.closePopup();
        }
      });

      const latLng = L.latLng(site.lat, site.lng);

      const performMove = () => {
        if (cancelled) return;
        if (performedRef) return;
        performedRef = true;

        const currentZoom = map.getZoom();
        // Selalu pastikan zoom cukup dalam agar semua cluster terbuka dan marker
        // tampil terpisah, sehingga label judul tidak menimpa marker lain.
        const nextZoom = Math.max(currentZoom, 18);
        const target = getPopupTarget(map, latLng, nextZoom, detailPanelWidth);

        // Satu gerakan halus saja (flyTo menangani zoom + pan sekaligus).
        // Tidak memakai zoomToShowLayer yang menyebabkan peta bergerak 2x
        // (cluster zoom/pan dulu, lalu flyTo/panTo lagi di sini).
        if (currentZoom < 18) {
          map.flyTo(target, nextZoom, { duration: 1.0, easeLinearity: 0.25 });
        } else {
          map.panTo(target, { animate: true, duration: 0.6 });
        }

        // Setelah animasi selesai, terapkan highlight/label (elemen marker sudah
        // terpisah dari cluster di zoom ini) lalu buka panel detail.
        const applyAfter = () => {
          if (cancelled) return;
          applySelectedMarkerClass();
          // Mobile: tutup popup tersisa agar tidak terpotong/tampak "di balik"
          // sheet & panel detail yang dislide ke atas bersamaan panel tiba.
          if (mobile) {
            map.eachLayer((layer: L.Layer) => {
              if (layer instanceof L.Marker && layer.isPopupOpen()) {
                layer.closePopup();
              }
            });
          }
          onArriveRef.current?.();
        };
        timers.push(setTimeout(applyAfter, currentZoom < 18 ? 1050 : 650));
      };

      // Buka cluster jika marker masih terlipat TANPA memicu gerakan ganda:
      // zoomToShowLayer membubarkan cluster tetapi gerakan peta final ditangani
      // oleh performMove. Untuk menghindari 2x geser kita biarkan flyTo di zoom 17
      // menangani segalanya; cluster pasti terbuka karena zoom cukup dalam.
      performMove();
    };

    map.whenReady(() => {
      timers.push(setTimeout(() => flyToSite(20), 350));
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      // Hapus class selected dari semua marker saat effect cleanup
      Object.values(markersRef.current).forEach((m) => {
        m.getElement()?.classList.remove('site-marker-selected');
      });
    };

    // `sites` sengaja tidak masuk dependensi fly-to (re-fly menimpa pandangan
    // rute saat userLoc/GPS menyegarkan daftar). Baca catatan pada sitesRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, detailPanelWidth, flyNonce]);

  // ── Re-apply state pilihan saat daftar situs/tema berubah (tanpa fly-to) ──
  // Marker cluster dibangun ulang oleh efek marker saat `sites`/`theme` berubah;
  // efek ini mengembalikan highlight & label pada marker terpilih TANPA menggeser
  // peta. Fly-to hanya boleh terjadi karena aksi pemilihan pengguna (atau
  // deep-link), bukan karena refresh incidental (mis. userLoc/GPS saat rute aktif)
  // yang selain itu membuat peta loncat kembali ke situs tujuan di desktop.
  useEffect(() => {
    if (!selectedIdRef.current) return;
    applySelectedMarkerClass();
    // applySelectedMarkerClass hanya memakai ref (markersRef, selectedIdRef,
    // sitesRef, mapRef) yang objeknya stabil — aman tanpa masuk dependensi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites, theme]);

  // Saat tidak ada situs yang dipilih (panel ditutup / deselect / klik area
  // kosong), bersihkan semua label judul & highlight marker, dan tutup semua
  // popup agar tidak ada yang menggantung.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectedId) return;
    Object.values(markersRef.current).forEach((m) => {
      m.getElement()?.classList.remove('site-marker-selected');
      m.setZIndexOffset(0);
      if (m.getTooltip()) m.unbindTooltip();
    });
    map.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.Marker && layer.isPopupOpen()) {
        layer.closePopup();
      }
    });
  }, [selectedId]);

  // ── Custom CSS for routing instructions ──
  useEffect(() => {
    const styleId = 'rt-custom-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Routing container */
      .rt-container {
        font-family: inherit;
        font-size: 13px;
        line-height: 1.5;
        color: #1E293B;
        background: #FFFFFF;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      }

      /* Header - sticky */
      .rt-header {
        position: sticky;
        top: 0;
        z-index: 10;
        background: linear-gradient(135deg, #D4AF37, #B8960C);
        color: #0B0F19;
        padding: 12px 14px;
        border-bottom: 1px solid rgba(11,15,25,0.1);
      }

      .rt-title {
        margin: 0 0 6px;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: -0.01em;
      }

      .rt-summary {
        font-size: 12px;
        font-weight: 600;
        opacity: 0.9;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      /* Instructions list - scrollable */
      .rt-instructions {
        max-height: 320px;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 8px 12px;
        -webkit-overflow-scrolling: touch;
      }

      /* Each instruction */
      .rt-instruction {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        background: #F8FAFC;
        margin-bottom: 8px;
        transition: background 0.15s;
      }

      .rt-instruction:last-child {
        margin-bottom: 0;
      }

      .rt-instruction:hover {
        background: #F1F5F9;
      }

      /* Final destination instruction */
      .rt-instruction-final {
        background: #ECFDF5;
        border: 1px solid #A7F3D0;
      }

      .rt-instruction-final:hover {
        background: #D1FAE5;
      }

      /* Step number */
      .rt-step {
        flex: 0 0 24px;
        width: 24px;
        height: 24px;
        min-width: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #D4AF37;
        color: #0B0F19;
        font-size: 11px;
        font-weight: 800;
        border-radius: 50%;
        margin-top: 2px;
      }

      .rt-instruction-final .rt-step {
        background: #10B981;
        color: #FFFFFF;
      }

      /* Instruction text */
      .rt-text {
        flex: 1 1 auto;
        min-width: 0;
        word-break: break-word;
        overflow-wrap: anywhere;
        line-height: 1.5;
        padding-right: 8px;
      }

      /* Distance */
      .rt-dist {
        flex: 0 0 auto;
        min-width: 56px;
        text-align: right;
        font-size: 11px;
        font-weight: 700;
        color: #64748B;
        white-space: nowrap;
        padding-top: 2px;
        margin-left: auto;
      }

      .rt-instruction-final .rt-dist {
        color: #059669;
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .rt-container {
          background: #111827;
          color: #F1F5F9;
        }
        .rt-instruction {
          background: #1F2937;
        }
        .rt-instruction:hover {
          background: #374151;
        }
        .rt-instruction-final {
          background: #064E3B;
          border-color: #065F46;
        }
        .rt-instruction-final:hover {
          background: #047857;
        }
        .rt-text {
          color: #E5E7EB;
        }
        .rt-dist {
          color: #9CA3AF;
        }
        .rt-instruction-final .rt-dist {
          color: #34D399;
        }
      }

      /* Scrollbar styling */
      .rt-instructions::-webkit-scrollbar {
        width: 6px;
      }
      .rt-instructions::-webkit-scrollbar-track {
        background: transparent;
      }
      .rt-instructions::-webkit-scrollbar-thumb {
        background: #CBD5E1;
        border-radius: 3px;
      }
      .rt-instructions::-webkit-scrollbar-thumb:hover {
        background: #94A3B8;
      }
      @media (prefers-color-scheme: dark) {
        .rt-instructions::-webkit-scrollbar-thumb {
          background: #4B5563;
        }
        .rt-instructions::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  // ── Rute (uji lokal): gambar rute OSRM dari titik asal ke situs terpilih ──
  // Asal dilacak live via watchPosition — saat pengguna berjalan, posisi asal &
  // rute ikut diperbarui (throttle: geser hanya bila berpindah >35m / min 4 detik).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeControlRef.current) {
      map.removeControl(routeControlRef.current);
      routeControlRef.current = null;
    }
    userMarkerRef.current?.remove();
    userMarkerRef.current = null;

    const Routing = L.Routing;
    if (!routeTarget || !Routing) return;

    // Marker wajah baru: titik asal emas berdenyut (tujuan memakai marker situs
    // yang sudah ada — tidak perlu pin/tooltip duplikat)
    const originIcon = L.divIcon({
      className: 'route-marker-styles',
      html: '<div class="route-origin-wrap"><span class="route-origin-heading"></span><span class="route-origin-pulse"></span><span class="route-origin-core"></span></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    let disposed = false;
    let built = false;
    let watchId: number | null = null;
    let lastSpliceAt = 0;
    let lastSpliceLoc: { lat: number; lng: number } | null = null;
    // Ketelitian (meter) fiks GPS terbaik yang sudah dipakai untuk titik asal.
    // `accuracy` dari Geolocation API makin kecil = fiks makin presisi. Dipakai
    // agar asal rute segera dikoreksi (splice) saat GPS menyempurnakan fiksnya.
    let bestAccuracy: number | null = null;
    let originMarker: L.Marker | null = null;
    // Heading (° dari utara) dari geolocation; null bila perangkat tak menyediakan.
    let latestHeading: number | null = null;
    // Fiks GPS terakhir — untuk menghitung arah gerak saat heading tidak tersedia.
    let lastFixLoc: { lat: number; lng: number } | null = null;
    // Fit sudut pandang HANYA sekali saat rute pertama terbentuk — agar peta
    // segera menampilkan posisi asal & rute, tanpa loncat-loncat saat GPS bergerak.
    let fitBoundsOnce = false;
    // Timer pengaman: pastikan kamera tetap bergeser ke posisi GPS & tujuan walau
    // server OSRM lambat/gantung (respons bisa tidak datang sama sekali). Dipicu
    // lewat fitBoundsOnce, jadi hanya berjalan sekali dan tidak mengganggu fit
    // yang sudah dilakukan lewat event routeselected.
    let fitTimer: ReturnType<typeof setTimeout> | null = null;

    const shortTitle =
      routeTarget.name.length > 20 ? routeTarget.name.slice(0, 20) + '…' : routeTarget.name;
    const formatDist = (m: number) =>
      m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
    const formatDur = (s: number) =>
      s >= 60 ? `±${Math.max(1, Math.round(s / 60))} mnt` : `${Math.max(1, Math.round(s))} dtk`;
    // Hindari nama situs <script> / HTML tidak sengaja terbaca sebagai markup
    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const originTooltipHtml = (head: string, meta: string, sub: string) =>
      `<div style="display:flex;flex-direction:column;gap:3px;min-width:150px;max-width:250px">
        <div style="display:flex;align-items:center;gap:6px;font-weight:800;color:#F7E08A;font-size:11.5px;letter-spacing:.3px;white-space:nowrap">📍 ${head}</div>
        <div style="font-weight:800;color:#ffffff;font-size:13px;white-space:nowrap">${meta}</div>
        <div style="font-size:10.5px;color:#A7B3C4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${sub}</div>
      </div>`;

    // Putar panah arah mengikuti heading. Arah default (0°) menunjuk utara;
    // heading geolocation = derajat searah jarum jam dari utara sejati.
    const setHeading = (deg: number | null) => {
      const el = originMarker
        ?.getElement()
        ?.querySelector<HTMLElement>('.route-origin-heading');
      if (!el) return;
      if (deg == null) {
        el.classList.remove('route-origin-heading-visible');
        return;
      }
      el.classList.add('route-origin-heading-visible');
      el.style.transform = `rotate(${deg}deg)`;
    };

    const buildControl = (origin: L.LatLng) => {
      if (built || disposed) return;
      built = true;

      // Arahkan kamera sekali saja saat rute terbentuk (atau gagal): pastikan
      // titik ASAL jelas masuk frame — bingkai diperluas ke sisi tujuan sehingga
      // asal tampil tegas di sisi kiri peta dan rute "mengalir" ke kanan menuju
      // tujuan. Desktop diberi padding selebar panel detail agar tujuan tidak
      // tersembunyi di balik panel kanan. Tidak dipanggil ulang saat GPS bergerak.
      const positionRouteView = (route?: L.Routing.IRoute) => {
        if (fitBoundsOnce) return;
        fitBoundsOnce = true;
        const dest = L.latLng(routeTarget.lat, routeTarget.lng);
        const routeCoords = route?.coordinates;
        const coords = routeCoords && routeCoords.length > 1 ? routeCoords : [origin, dest];
        const bounds = L.latLngBounds(coords);
        bounds.extend(origin);
        bounds.extend(dest);
        // Perluas ke arah luar melewati tujuan → frame bergeser agar asal di kiri.
        const projZoom = 11;
        const oPt = map.project(origin, projZoom);
        const dPt = map.project(dest, projZoom);
        const beyondDest = dPt.subtract(oPt).multiplyBy(0.45);
        if (beyondDest.x !== 0 || beyondDest.y !== 0) {
          bounds.extend(map.unproject(dPt.add(beyondDest), projZoom));
        }
        const padded = bounds.pad(0.12);
        const size = map.getSize();
        const fitOpts: L.FitBoundsOptions & L.ZoomPanOptions = { maxZoom: 15, duration: 0.9 };
        if (size.x > 768 && detailPanelWidthRef.current > 0) {
          fitOpts.paddingTopLeft = [10, size.y * 0.2];
          fitOpts.paddingBottomRight = [
            Math.min(detailPanelWidthRef.current, size.x * 0.45),
            size.y * 0.2,
          ];
        } else {
          fitOpts.paddingTopLeft = [12, 12];
          fitOpts.paddingBottomRight = [12, 12];
        }
        map.flyToBounds(padded, fitOpts);
      };

      // Custom formatter: returns plain text for formatInstruction (leaflet-routing-machine
      // inserts via textContent). Custom HTML structure is built in populateInstructions()
      // after the control is added to the map.
      const createRouteFormatter = () => {
        class CustomFormatter extends Routing.Formatter {
          formatInstruction(instruction: L.Routing.IInstruction) {
            // Return plain text for accessibility; leaflet-routing-machine uses textContent
            return super.formatInstruction(instruction);
          }

          formatSummary(route: L.Routing.IRoute) {
            const summary = route.summary;
            if (!summary) return '';
            const dist = super.formatDistance(summary.totalDistance);
            const time = super.formatTime(summary.totalTime);
            return `
              <div class="rt-header">
                <h2 class="rt-title">🧭 Petunjuk Rute</h2>
                <div class="rt-summary">${dist} · ${time}</div>
              </div>
              <div class="rt-instructions"></div>
            `;
          }

          getContainer(route: L.Routing.IRoute) {
            const container = document.createElement('div');
            container.className = 'leaflet-routing-container rt-container';
            container.innerHTML = this.formatSummary(route);
            return container;
          }
        }
        return new CustomFormatter({
          language: 'en',
          unitNames: {
            meters: 'm',
            kilometers: 'km',
            yards: 'yd',
            miles: 'mi',
            hours: 'jam',
            minutes: 'mnt',
            seconds: 'dtk',
          },
          distanceTemplate: '{value} {unit}',
        });
      };

      const routeFormatter = createRouteFormatter();

      // Populate instruction list with custom HTML structure after control renders
      const populateInstructions = (control: L.Routing.Control, route: L.Routing.IRoute) => {
        const container = control.getContainer();
        if (!container) return;

        const instructionsEl = container.querySelector('.rt-instructions');
        if (!instructionsEl) return;

        // Clear placeholder
        instructionsEl.innerHTML = '';

        const routeInstructions = route.instructions || [];

        routeInstructions.forEach((instruction: L.Routing.IInstruction, i: number) => {
          const text = routeFormatter.formatInstruction(instruction);
          const distance = routeFormatter.formatDistance(instruction.distance);
          const stepNum = i + 1;
          const isFinal = text.includes('tiba') || text.includes('Tiba') || text.includes('sampai');

          const el = document.createElement('div');
          el.className = `rt-instruction ${isFinal ? 'rt-instruction-final' : ''}`;
          el.dataset.step = String(stepNum);
          el.innerHTML = `
            <span class="rt-step">${stepNum}</span>
            <span class="rt-text">${text}</span>
            <span class="rt-dist">${distance}</span>
          `;
          instructionsEl.appendChild(el);
        });
      };

      const controlOptions: RouteControlOptions = {
        waypoints: [origin, L.latLng(routeTarget.lat, routeTarget.lng)],
        routeWhileDragging: true,
        showAlternatives: false,
        fitSelectedRoutes: false,
        show: true,
        collapsible: true,
        draggableWaypoints: false,
        formatter: routeFormatter,
        summaryTemplate: '',
        createMarker: (i: number, wp: L.Routing.Waypoint) => {
          if (i !== 0) {
            // Tujuan memakai marker situs yang sudah ada. Plugin mensyaratkan
            // marker waypoint TIDAK pernah null (_markers[i] dipakai saat
            // klik-tarik garis rute), jadi tampilkan marker tak terlihat 1x1.
            return L.marker(wp.latLng, {
              icon: L.divIcon({ className: 'route-marker-styles', html: '', iconSize: [1, 1] }),
              keyboard: false,
            });
          }
          const m = L.marker(wp.latLng, { icon: originIcon, keyboard: false, zIndexOffset: 1000 })
            .bindTooltip(originTooltipHtml('Posisi Anda', 'menghitung rute…', `ke ${escapeHtml(shortTitle)}`), {
              permanent: true, direction: 'top', className: 'route-tooltip',
            });
          originMarker = m;
          return m;
        },
        // Terjemahan instruksi ke Bahasa Indonesia via osrm-text-instructions.
        // Plugin meneruskan seluruh opsi kontrol ke router OSRMv1 bawaan
        // (control.js: `router || new OSRMv1(options)`), jadi stepToText di sini
        // benar-benar dipakai untuk meramu teks langkah arah.
        language: 'en',
        serviceUrl: ROUTING_URL,
        // Batasi waktu tunggu respons OSRM dari default 30 detik menjadi 8 detik
        // agar kamera cepat beralih ke posisi GPS bila server lambat/gantung.
        timeout: 8000,
        stepToText: (step: RawStep, opts?: { legIndex?: number; legCount?: number }) =>
          osrmId.compile('id', step, { legIndex: opts?.legIndex, legCount: opts?.legCount }),
        lineOptions: {
          styles: [{ color: '#D4AF37', weight: 5, opacity: 0.9 }],
          extendToWaypoints: true,
          missingRouteTolerance: 10,
        },
      };
      const control = Routing.control(controlOptions).addTo(map);

      // Build custom instruction DOM after control renders (leaflet-routing-machine
      // inserts formatInstruction as textContent, so we rebuild with proper HTML).
      // Initial route may not be ready yet; rely on 'routeselected' event primarily.
      const initialRoute = (control as { _route?: L.Routing.IRoute })._route;
      if (initialRoute) populateInstructions(control, initialRoute);

      // Also repopulate when route updates (e.g., GPS splice)
      control.on('routeselected', (e) => {
        const route = e?.route;
        if (route) populateInstructions(control, route);
      });

      // Perbarui tooltip titik asal dengan jarak & durasi rute hasil OSRM.
      // Event `routeselected` terpicu ulang saat rute diperbarui (posisi pindah),
      // jadi waktu jalan jaraknya ikut menyesuaikan.
      control.on('routeselected', (e) => {
        const route = e?.route;
        const dist = route?.summary?.totalDistance;
        const dur = route?.summary?.totalTime;
        if (dist != null && originMarker) {
          originMarker.setTooltipContent(
            originTooltipHtml(
              'Posisi Anda',
              `${formatDist(dist)} · ${formatDur(dur)}`,
              `ke ${escapeHtml(shortTitle)}`
            )
          );
        }
        positionRouteView(route);
      });

      // Walaupun OSRM gagal merespons, kamera tetap diarahkan ke asal & tujuan
      // (garis rute tak ada, tapi posisi terlihat sesuai permintaan pengguna).
      control.on('routingerror', () => {
        positionRouteView();
      });

      routeControlRef.current = control;

      // Kamera TIDAK boleh menunggu respons OSRM: jika petunjuk rute belum
      // terpilih dalam 2,5 detik, geser pandangan ke posisi GPS & tujuan sekarang
      // juga (fitBoundsOnce membuat ini efektif hanya sekali). Bila rute datang
      // lebih cepat, fit lewat `routeselected` yang memakai geometri rute asli.
      fitTimer = setTimeout(() => {
        if (!disposed) positionRouteView();
      }, 2500);
    };

    // Jarak permukaan (meter) antara dua koordinat — untuk throttling
    const distM = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
      const R = 6371e3;
      const rad = (d: number) => (d * Math.PI) / 180;
      const dLat = rad(b.lat - a.lat);
      const dLng = rad(b.lng - a.lng);
      const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(s));
    };

    // Bearing (derajat dari utara, searah jarum jam) antara dua koordinat —
    // fallback arah panah saat sensornya tidak mengirim heading.
    const bearingDeg = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
      const rad = (d: number) => (d * Math.PI) / 180;
      const y = Math.sin(rad(to.lng - from.lng)) * Math.cos(rad(to.lat));
      const x =
        Math.cos(rad(from.lat)) * Math.sin(rad(to.lat)) -
        Math.sin(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.cos(rad(to.lng - from.lng));
      return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    };

    // Suntik lokasi ke parent hanya saat posisi berubah (supaya radius SIG sinkron
    // tapi tidak memicu re-render berlebihan).
    const maybeNotifyParent = (loc: { lat: number; lng: number }) => {
      const moved = lastSpliceLoc ? distM(loc, lastSpliceLoc) > 35 : true;
      const now = Date.now();
      if (moved && now - lastSpliceAt >= 4000) {
        lastSpliceAt = now;
        lastSpliceLoc = loc;
        onUserLocFoundRef.current(loc);
      }
    };

    // Seed posisi awal: SELALU minta fresh GPS (enableHighAccuracy, maximumAge: 0).
    // Jika PERMISSION_DENIED: batalkan routing, kirim error ke UI (tidak pakai fallback).
    // Jika POSITION_UNAVAILABLE / TIMEOUT: kirim error ke UI (tidak pakai fallback),
    // UI menentukan apakah retry.
    // latestUserLocRef.current TIDAK dipakai sebagai fallback routing; hanya untuk Radius Mode.
    const seedOrigin = async () => {
      if (typeof navigator !== 'undefined' && navigator.geolocation?.getCurrentPosition) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          console.log('[Geolocation] Routing seed:', {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: new Date(pos.timestamp).toISOString(),
          });
          latestHeading = pos.coords.heading ?? null;
          lastFixLoc = loc;
          bestAccuracy = pos.coords.accuracy;
          maybeNotifyParent(loc);
          buildControl(L.latLng(loc.lat, loc.lng));
          setHeading(latestHeading);
          return;
        } catch (err) {
          const geolocationErr = err as GeolocationPositionError;
          console.warn('[Geolocation] Routing seed error:', {
            code: geolocationErr.code,
            message: geolocationErr.message,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          });
          // Kirim error ke UI — JANGAN pakai fallback cached/default untuk routing
          const errorInfo = {
            code: geolocationErr.code,
            message:
              geolocationErr.code === 1
                ? 'Izin lokasi diperlukan untuk menggunakan fitur Rute.'
                : geolocationErr.code === 2
                ? 'Lokasi tidak tersedia. Pastikan layanan lokasi perangkat aktif.'
                : geolocationErr.code === 3
                ? 'Gagal mendapatkan lokasi. Silakan coba lagi.'
                : 'Terjadi kesalahan geolocation.',
            retryable: geolocationErr.code === 2 || geolocationErr.code === 3,
          };
          onRouteLocationErrorRef.current?.(errorInfo);
          return; // Batalkan routing, JANGAN buildControl dengan fallback
        }
      }
      // Tidak ada geolocation API — kirim error dan batalkan
      onRouteLocationErrorRef.current?.({
        code: 0,
        message: 'Geolocation tidak didukung browser ini.',
        retryable: false,
      });
    };

    seedOrigin();

    // Pelacakan live — update waypoint 0 saat pengguna berpindah
    if (typeof navigator !== 'undefined' && navigator.geolocation?.watchPosition) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (disposed) return;
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          console.log('[Geolocation] Routing watch:', {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: new Date(pos.timestamp).toISOString(),
          });
          // Prioritas arah: sensor heading (kompas) → kalau tidak ada, arah gerak
          // dari bearing antar dua fiks (min ~4 m agar tidak bergetar oleh noise).
          const deviceHeading = pos.coords.heading;
          if (deviceHeading != null) {
            latestHeading = deviceHeading;
          } else if (lastFixLoc && distM(loc, lastFixLoc) > 4) {
            latestHeading = bearingDeg(lastFixLoc, loc);
          }
          lastFixLoc = loc;
          maybeNotifyParent(loc);
          if (!built) {
            // Jika seedOrigin gagal (mis. permission denied), built tetap false.
            // Jangan buat routing dari watchPosition jika fresh GPS gagal.
            // Hanya lanjut jika ada fresh fix (permission granted) tapi seedOrigin
            // belum sempat jalan (race condition) — ini edge case, tapi aman.
            console.log('[Geolocation] Routing watch: first fix, building control');
            bestAccuracy = pos.coords.accuracy;
            buildControl(L.latLng(loc.lat, loc.lng));
            setHeading(latestHeading);
            return;
          }
          const now = Date.now();
          // Geser asal rute bila posisi berpindah cukup jauh ATAU fiks yang lebih
          // akurat tersedia (accuracy makin kecil) — dengan jeda minimal 4 dtk.
          // Fiks pertama sering kasar (IP/Wi-Fi); tanpa `betterFix`, asal rute
          // bisa tertahan di posisi salah padahal GPS sudah mengunci lebih tepat.
          const moved = lastSpliceLoc ? distM(loc, lastSpliceLoc) > 35 : true;
          const betterFix = bestAccuracy == null || pos.coords.accuracy < bestAccuracy - 5;
          if (betterFix) bestAccuracy = pos.coords.accuracy;
          if (now - lastSpliceAt >= 4000 && (moved || betterFix)) {
            lastSpliceAt = now;
            lastSpliceLoc = loc;
            routeControlRef.current?.spliceWaypoints(0, 1, Routing.waypoint(L.latLng(loc.lat, loc.lng)));
          }
          // Arah hadap ikut diperbarui walau posisi belum bergeser (berputar di
          // tempat) — dan dipanggil ulang setelah splice karena plugin bisa
          // membuat ulang elemen marker waypoint.
          setHeading(latestHeading);
        },
        (err) => {
          const geolocationErr = err as GeolocationPositionError;
          console.warn('[Geolocation] Routing watch error:', {
            code: geolocationErr.code,
            message: geolocationErr.message,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          });
          // Jika permission denied saat watch, kirim error ke UI
          // (routing sudah tidak dibangun karena built=false)
          if (geolocationErr.code === 1) {
            onRouteLocationErrorRef.current?.({
              code: 1,
              message: 'Izin lokasi diperlukan untuk menggunakan fitur Rute.',
              retryable: false,
            });
          }
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }

    return () => {
      disposed = true;
      if (fitTimer != null) clearTimeout(fitTimer);
      if (watchId != null) navigator.geolocation?.clearWatch(watchId);
    };
  }, [routeTarget]);

  // ── Geolokasi + lingkaran radius ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!radiusMode) {
      userMarkerRef.current?.remove(); userMarkerRef.current = null;
      userCircleRef.current?.remove(); userCircleRef.current = null;
      return;
    }

    const drawRadius = (loc: { lat: number; lng: number }) => {
      userMarkerRef.current?.remove();
      userCircleRef.current?.remove();
      userMarkerRef.current = L.circleMarker([loc.lat, loc.lng], {
        radius: 8, color: '#fff', weight: 2.5,
        fillColor: '#D4AF37', fillOpacity: 1,
      }).addTo(map).bindTooltip('Lokasi Anda', { permanent: false });
      userCircleRef.current = L.circle([loc.lat, loc.lng], {
        radius: radiusKm * 1000,
        color: '#D4AF37', weight: 1.5,
        fillOpacity: 0.05, dashArray: '5,5',
      }).addTo(map);
    };

    if (userLoc) {
      drawRadius(userLoc);
    } else {
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          console.log('[Geolocation] Radius mode:', {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: new Date(pos.timestamp).toISOString(),
          });
          onUserLocFound(loc);
          drawRadius(loc);
          map.flyTo([loc.lat, loc.lng], 10, { duration: 0.8 });
        },
        (err) => {
          const geolocationErr = err as GeolocationPositionError;
          console.warn('[Geolocation] Radius mode error:', {
            code: geolocationErr.code,
            message: geolocationErr.message,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          });
          // Fallback: Tanjungpinang
          const loc = { lat: 0.92, lng: 104.45 };
          onUserLocFound(loc);
          drawRadius(loc);
          map.flyTo([loc.lat, loc.lng], 10, { duration: 0.8 });
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }
  }, [radiusMode, radiusKm, userLoc, onUserLocFound]);

  // ── Update radius lingkaran saat slider berubah ──
  useEffect(() => {
    userCircleRef.current?.setRadius(radiusKm * 1000);
  }, [radiusKm]);

  // ── Batas wilayah ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Hapus layer lama
    boundaryLayersRef.current.forEach((l) => l.remove());
    boundaryLabelsRef.current.forEach((l) => l.remove());
    boundaryLayersRef.current = [];
    boundaryLabelsRef.current = [];

    if (!boundaryMode) return;

    boundaries.forEach((b) => {
      const count = sites.filter((s) => s.kab === b.kab).length;

      const poly = L.polygon(b.coords as L.LatLngTuple[], {
        color: b.color, weight: 2,
        fillOpacity: 0.07, dashArray: '6,4',
      }).addTo(map);
      poly.bindTooltip(`<b>${b.kab}</b>: ${count} situs`, { sticky: true });
      boundaryLayersRef.current.push(poly);

      const center = poly.getBounds().getCenter();
      const label = L.marker(center, {
        icon: L.divIcon({
          className: '',
          html: `<div style="font-family:sans-serif;font-size:11px;font-weight:800;color:${b.color};text-shadow:0 0 6px #0B0F19,0 0 6px #0B0F19;white-space:nowrap;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${b.kab} (${count})</div>`,
          iconSize: [0, 0],
        }),
      }).addTo(map);
      boundaryLabelsRef.current.push(label);
    });
  }, [boundaryMode, sites]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <div id="map" style={{ height: '100%', width: '100%' }} />

      {/* Floating Basemap Switcher Control */}
      <BasemapSwitcher theme={theme} onThemeChange={onThemeChange} />
    </div>
  );
}
