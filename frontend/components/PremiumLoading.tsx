// components/PremiumLoading.tsx

export default function PremiumLoading() {
  return (
    <div style={{
      flex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'var(--background)',
      position: 'absolute', top: 0, left: 0, zIndex: 10,
    }}>
      <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Radar Pulses */}
        <div style={{
          position: 'absolute', width: '100%', height: '100%',
          border: '2px solid rgba(212, 175, 55, 0.4)', borderRadius: '50%',
          animation: 'radarPulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite'
        }} />
        <div style={{
          position: 'absolute', width: '100%', height: '100%',
          border: '2px solid rgba(212, 175, 55, 0.2)', borderRadius: '50%',
          animation: 'radarPulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite 0.6s'
        }} />

        {/* Elegant Map Pin SVG */}
        <div style={{ animation: 'floatPin 2s ease-in-out infinite', zIndex: 2 }}>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 8px 12px rgba(212,175,55,0.4))' }}>
            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"
                  fill="url(#goldGradient)" />
            <defs>
              <linearGradient id="goldGradient" x1="5" y1="2" x2="19" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F5D76E" />
                <stop offset="0.5" stopColor="#D4AF37" />
                <stop offset="1" stopColor="#9A7B2C" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Pin shadow on the ground */}
        <div style={{
          position: 'absolute', bottom: 18, width: 24, height: 6,
          background: 'rgba(0,0,0,0.15)', borderRadius: '50%',
          filter: 'blur(2px)',
          animation: 'shadowScale 2s ease-in-out infinite'
        }} />
      </div>

      <div style={{
        fontSize: '16px', fontWeight: 800, color: 'var(--foreground)',
        letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase',
      }}>
        Memuat Peta
      </div>
      <div style={{
        fontSize: '11px', color: 'var(--legend-accent)', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.2em',
        opacity: 0.8
      }}>
        WebGIS Cagar Budaya
      </div>

      <style>{`
        @keyframes radarPulse {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes floatPin {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shadowScale {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(0.6); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}
