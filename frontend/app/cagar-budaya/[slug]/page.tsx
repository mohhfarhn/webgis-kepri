import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { categories } from '../../../data/sites';
import { getStatusColorBg, getStatusColorText, TINGKAT_LABEL } from '../../../lib/siteStatus';
import { getThemeColors, ThemeMode } from '../../../lib/theme';
import { getCagarBudayaSiteBySlug } from '../../../services/cagarBudaya';
import SmartImage from '../../../components/SmartImage';
import DetailGallery from '../../../components/DetailGallery';
import ShareButton from '../../../components/ShareButton';

interface DetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function InfoItem({ label, icon, value, isLight }: { label: string; icon: string; value?: string; isLight: boolean }) {
  if (!value) return null;

  return (
    <div style={{ 
      padding: '12px 14px', 
      background: isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.02)',
      borderRadius: '8px',
      marginBottom: '8px',
      border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)'}`
    }}>
      <div style={{ color: isLight ? '#8A6A15' : '#D4AF37', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>{icon}</span> {label}
      </div>
      <div style={{ marginTop: '4px', color: isLight ? '#1E293B' : '#E2E8F0', fontSize: '13.5px', fontWeight: 500, lineHeight: 1.5, wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: DetailPageProps) {
  const { slug } = await params;
  const site = await getCagarBudayaSiteBySlug(slug);

  if (!site) {
    return {
      title: 'Cagar Budaya Tidak Ditemukan',
    };
  }

  return {
    title: `${site.name} - WebGIS Cagar Budaya Kepri`,
    description: site.desc,
  };
}

export default async function CagarBudayaDetailPage({ params }: DetailPageProps) {
  const { slug } = await params;
  const site = await getCagarBudayaSiteBySlug(slug);

  if (!site) notFound();

  const cookieStore = await cookies();
  const theme = (cookieStore.get('theme')?.value || 'light') as ThemeMode;
  const {
    isLight,
    textColorPrimary,
    textColorSecondary,
    goldColor,
    borderColor,
  } = getThemeColors(theme);

  const cat = categories[site.kat];
  const heroImage = site.thumbnail ?? site.gallery?.[0]?.image;
  const gallery = site.gallery?.filter((item) => item.image) ?? [];

  return (
    <main 
      id="main-content"
      className="premium-scroll"
      style={{
        height: '100vh',
        overflowY: 'auto',
        background: isLight ? '#F8FAFC' : '#0B0F19',
        color: textColorPrimary,
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Header */}
      <div 
        className="detail-page-header"
        style={{
          background: isLight ? '#F8FAFC' : '#0B0F19',
          color: textColorPrimary,
          padding: '18px clamp(16px, 4vw, 48px)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          alignItems: 'center',
          borderBottom: `1px solid ${isLight ? 'rgba(184, 147, 36, 0.2)' : 'rgba(212, 175, 55, 0.3)'}`,
          boxShadow: isLight ? '0 4px 20px rgba(0, 0, 0, 0.05)' : '0 4px 20px rgba(0, 0, 0, 0.4)',
        }}
      >
        <Link 
          href="/" 
          className="btn-secondary-hover"
          style={{ 
            color: goldColor, 
            textDecoration: 'none', 
            fontSize: '13px', 
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          ← Kembali ke Peta
        </Link>
        <div 
          className="detail-page-header-subtitle"
          style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: textColorSecondary, fontWeight: 800 }}
        >
          Peta Cagar Budaya Kepulauan Riau
        </div>
      </div>

      {/* Hero Image */}
      {heroImage && (
        <div 
          className="detail-page-hero"
          style={{ width: '100%', height: 'min(42vh, 360px)', overflow: 'hidden', position: 'relative' }}
        >
          <SmartImage
            src={heroImage}
            alt={site.name}
            fill
            sizes="100vw"
            loading="eager"
            fallbackBackground={isLight ? '#E2E8F0' : '#111625'}
            style={{ objectFit: 'cover', background: isLight ? '#E2E8F0' : '#111625' }}
          />
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '80px',
            background: `linear-gradient(to top, ${isLight ? '#F8FAFC' : '#0B0F19'}, transparent)`,
          }} />
        </div>
      )}

      {/* Content Container */}
      <div 
        className="detail-grid"
        style={{
          maxWidth: '1080px',
          margin: '0 auto',
          padding: '28px clamp(16px, 4vw, 36px) 48px',
        }}
      >
        <article>
          {/* Category Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color, boxShadow: `0 0 8px ${cat.color}` }} />
            <span style={{ color: cat.color, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {cat.label}
            </span>
          </div>
          
          <h1 
            className="detail-page-title"
            style={{ margin: '0 0 16px', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em', color: textColorPrimary }}
          >
            {site.name}
          </h1>

          {/* Badges */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px', background: getStatusColorBg(site.status, isLight), color: getStatusColorText(site.status, isLight), fontWeight: 800, border: `1px solid ${getStatusColorText(site.status, isLight)}25` }}>
              🛡️ {site.status}
            </span>
            {site.tingkat && (
              <span style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px', background: isLight ? 'rgba(184, 147, 36, 0.08)' : 'rgba(212, 175, 55, 0.12)', color: goldColor, fontWeight: 800, border: `1px solid ${isLight ? 'rgba(184, 147, 36, 0.2)' : 'rgba(212, 175, 55, 0.25)'}` }}>
                ⭐ {TINGKAT_LABEL[site.tingkat]}
              </span>
            )}
            {site.tahun && (
              <span style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px', background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)', color: textColorPrimary, fontWeight: 800, border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)'}` }}>
                📅 {site.tahun}
              </span>
            )}
          </div>

          {/* Description */}
          <p 
            className="detail-page-desc"
            style={{ margin: 0, fontSize: '15px', lineHeight: 1.8, color: isLight ? '#475569' : '#CBD5E1', textAlign: 'justify' }}
          >
            {site.desc}
          </p>

          {/* Gallery Section */}
          {gallery.length > 0 && (
            <section style={{ marginTop: '36px', borderTop: `1px solid ${borderColor}`, paddingTop: '28px' }}>
              <h2
                className="detail-page-gallery-title"
                style={{ margin: '0 0 18px', fontSize: '20px', fontWeight: 800, color: textColorPrimary, letterSpacing: '-0.01em' }}
              >
                📸 Galeri Foto
              </h2>
              <DetailGallery
                items={gallery.map((item, index) => ({
                  src: item.image as string,
                  alt: item.caption ?? `${site.name} ${index + 1}`,
                  caption: item.caption,
                }))}
                borderColor={borderColor}
                textColorSecondary={textColorSecondary}
              />
            </section>
          )}
        </article>

        {/* Sidebar Info Panel */}
        <aside 
          className="detail-page-aside"
          style={{ 
            alignSelf: 'start', 
            background: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(17, 22, 37, 0.85)', 
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '20px', 
            borderRadius: '16px',
            border: `1px solid ${isLight ? 'rgba(184, 147, 36, 0.15)' : 'rgba(212, 175, 55, 0.25)'}`,
            boxShadow: isLight ? '0 8px 32px rgba(0, 0, 0, 0.08)' : '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: '11px', fontWeight: 800, color: goldColor, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Rangkuman Informasi
          </h3>
          <InfoItem label="Kabupaten/Kota" icon="🏙️" value={site.kab} isLight={isLight} />
          <InfoItem label="Kecamatan" icon="🏘️" value={site.kecamatan} isLight={isLight} />
          <InfoItem label="Alamat" icon="📍" value={site.alamat} isLight={isLight} />
          <InfoItem label="Koordinat" icon="🌐" value={`${site.lat.toFixed(6)}, ${site.lng.toFixed(6)}`} isLight={isLight} />
          <InfoItem label="Nomor SK" icon="📜" value={site.nomorSK} isLight={isLight} />
          <InfoItem label="Sumber Data" icon="🗂️" value={site.sumber} isLight={isLight} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            {site.googleMaps && (
              <a
                href={site.googleMaps}
                target="_blank"
                rel="noreferrer"
                className="btn-primary-hover detail-page-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #1B4F4A, #123632)',
                  color: '#fff',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  border: '1px solid rgba(27, 79, 74, 0.3)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                }}
              >
                🗺️ Buka Google Maps
              </a>
            )}
            {site.slug && (
              <Link
                href={`/?site=${site.slug}`}
                className="btn-secondary-hover detail-page-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${isLight ? 'rgba(184, 147, 36, 0.3)' : 'rgba(212, 175, 55, 0.4)'}`,
                  background: isLight ? 'rgba(184, 147, 36, 0.05)' : 'rgba(212, 175, 55, 0.05)',
                  color: goldColor,
                  fontSize: '12.5px',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                🗺️ Lihat di Peta WebGIS
              </Link>
            )}
          </div>

          {/* Bagikan halaman situs ini */}
          <ShareButton
            title={`${site.name} - WebGIS Cagar Budaya Kepri`}
            text={`Lihat situs cagar budaya ${site.name} di WebGIS Kepri`}
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: `1px solid ${isLight ? 'rgba(184, 147, 36, 0.3)' : 'rgba(212, 175, 55, 0.4)'}`,
              background: isLight ? 'rgba(184, 147, 36, 0.05)' : 'rgba(212, 175, 55, 0.05)',
              color: goldColor,
              fontSize: '12.5px',
            }}
          />
        </aside>
      </div>
    </main>
  );
}
