import { Site, categories } from "../data/sites";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const statusColorText: Record<string, string> = {
  Ditetapkan: "var(--status-ditetapkan-text)",
  Didaftarkan: "var(--status-didaftarkan-text)",
  Usulan: "var(--status-usulan-text)",
};

const statusColorBg: Record<string, string> = {
  Ditetapkan: "rgba(74, 222, 128, 0.15)",
  Didaftarkan: "rgba(245, 158, 11, 0.15)",
  Usulan: "rgba(148, 163, 184, 0.15)",
};

export type MapTheme = "light" | "dark" | "satellite";

export function buildSitePopupHtml(site: Site): string {
  const cat = categories[site.kat];
  const galleryCount = site.gallery?.length ?? 0;
  const locationText = [site.kecamatan, site.kab].filter(Boolean).join(", ");
  const detailUrl = site.slug ? `/cagar-budaya/${encodeURIComponent(site.slug)}` : undefined;

  // Kumpulkan semua gambar (thumbnail + galeri) tanpa duplikat untuk slider.
  const images: string[] = [];
  const pushImage = (src?: string | null) => {
    if (src && !images.includes(src)) images.push(src);
  };
  pushImage(site.thumbnail);
  (site.gallery ?? []).forEach((g) => pushImage(g.image));

  const badges = [
    `<span style="font-size:8.5px;padding:2px 5px;border-radius:4px;background:${statusColorBg[site.status]};color:${statusColorText[site.status]};font-weight:700;white-space:nowrap;">${site.status}</span>`,
    site.tahun
      ? `<span style="font-size:8.5px;padding:2px 5px;border-radius:4px;background:rgba(128,128,128,0.15);color:var(--popup-text);font-weight:700;white-space:nowrap;">📅 ${escapeHtml(site.tahun)}</span>`
      : "",
    galleryCount > 1
      ? `<span style="font-size:8.5px;padding:2px 5px;border-radius:4px;background:rgba(212,175,55,0.15);color:var(--legend-accent);font-weight:700;white-space:nowrap;">📸 ${galleryCount}</span>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const slideJs = (delta: number) =>
    `var t=this.parentElement.querySelector('.popup-slide-track'),n=t.children.length,i=(parseInt(t.dataset.i||'0',10)+${delta}+n)%n;t.dataset.i=i;t.style.transform='translateX(-'+(i*100)+'%)';var c=this.parentElement.querySelector('.popup-slide-count');if(c)c.textContent=(i+1)+'/'+n;`;

  const arrowStyle =
    "position:absolute;top:50%;transform:translateY(-50%);width:22px;height:22px;border-radius:50%;border:none;background:rgba(0,0,0,0.45);color:#fff;font-size:13px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;";

  const imageBlock =
    images.length === 0
      ? ""
      : images.length === 1
        ? `<div style="width:100%;height:150px;display:flex;">
             <img src="${escapeHtml(images[0])}" alt="${escapeHtml(site.name)}" style="display:block;width:100%;height:100%;object-fit:cover;" />
           </div>`
        : `<div style="position:relative;width:100%;height:150px;overflow:hidden;">
             <div class="popup-slide-track" style="display:flex;height:100%;transition:transform 0.3s cubic-bezier(0.16,1,0.3,1);">
               ${images.map((src) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(site.name)}" style="display:block;width:100%;height:100%;object-fit:cover;flex-shrink:0;" />`).join("")}
             </div>
             <button type="button" onclick="${slideJs(-1)}" style="${arrowStyle}left:6px;">‹</button>
             <button type="button" onclick="${slideJs(1)}" style="${arrowStyle}right:6px;">›</button>
             <div class="popup-slide-count" style="position:absolute;right:6px;bottom:6px;background:rgba(0,0,0,0.55);color:#fff;font-size:9px;font-weight:800;padding:2px 6px;border-radius:100px;">1/${images.length}</div>
           </div>`;

  return `
    <div style="width:238px;overflow:hidden;">
      ${imageBlock}
      <div style="padding:8px 10px;box-sizing:border-box;">
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
          <span style="width:6px;height:6px;border-radius:50%;background:${cat.color};box-shadow:0 0 5px ${cat.color};flex-shrink:0;"></span>
          <span style="font-size:8.5px;color:${cat.color};font-weight:800;text-transform:uppercase;letter-spacing:0.08em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${cat.label}</span>
        </div>
        <div style="font-size:13px;font-weight:800;color:var(--popup-text);line-height:1.3;margin-bottom:3px;letter-spacing:-0.01em;overflow-wrap:anywhere;">${escapeHtml(site.name)}</div>
        <div style="font-size:10.5px;color:var(--popup-text);opacity:0.7;line-height:1.4;margin-bottom:6px;overflow-wrap:anywhere;">
          📍 ${escapeHtml(locationText || `${site.kab}, Kepulauan Riau`)}
        </div>
        <div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:${detailUrl ? "7px" : "0"};">
          ${badges}
        </div>
        ${detailUrl ? `<a href="${detailUrl}" style="display:block;text-align:center;padding:6px 8px;border-radius:6px;background:linear-gradient(135deg, #D4AF37, #B89324);color:#0B0F19;text-decoration:none;font-size:10.5px;font-weight:800;box-shadow:0 3px 10px rgba(212,175,55,0.2);">Lihat Detail →</a>` : ""}
      </div>
    </div>`;
}

export function getMarkerBorderColor(theme: MapTheme): string {
  return theme !== "light" ? "#E5C158" : "#fff";
}

export function getClusterBorderColor(theme: MapTheme): string {
  return theme !== "light" ? "#111625" : "#fff";
}
