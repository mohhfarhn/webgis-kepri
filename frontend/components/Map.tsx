'use client';

// components/Map.tsx — versi SIG dengan radius & batas wilayah

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
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
}

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
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
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

  // Ref untuk melacak selectedId terbaru di dalam callback event Leaflet
  const selectedIdRef = useRef(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

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

    const site = sites.find((s) => s.id === selectedId);
    if (!site) return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Cegah performMove dijalankan dua kali untuk seleksi yang sama
    // (zoomToShowLayer kadang memanggil callback lebih dari sekali).
    let performedRef = false;

    // Tampilkan label permanen berisi judul cagar budaya di samping marker.
    const showSiteLabel = (m: L.Marker, id: string) => {
      const site = sites.find((s) => s.id === id);
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
        if (id === selectedId) {
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

  }, [selectedId, sites, detailPanelWidth, flyNonce]);

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
          onUserLocFound(loc);
          drawRadius(loc);
          map.flyTo([loc.lat, loc.lng], 10, { duration: 0.8 });
        },
        () => {
          // Fallback: Tanjungpinang
          const loc = { lat: 0.92, lng: 104.45 };
          onUserLocFound(loc);
          drawRadius(loc);
          map.flyTo([loc.lat, loc.lng], 10, { duration: 0.8 });
        }
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
