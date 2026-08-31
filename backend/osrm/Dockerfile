# OSRM router khusus Kepulauan Riau — data jalan OpenStreetMap (Geofabrik).
# Builder: unduh ekstrak Sumatra (~270 MB, sudah mencakup seluruh pulau Kepri)
# → potong ke wilayah Kepulauan Riau (bbox) dengan osmium → bangun indeks MLD.
# Runtime: daemon osrm-routed di port 5001.
#
# Build awal butuh ~2-4 GB RAM; data OSM berlisensi ODbL — wajib atribusi
# "© OpenStreetMap contributors". Rute hanya valid di dalam bbox ini.

FROM ghcr.io/project-osrm/osrm-backend:latest AS builder

RUN apt-get update \
    && apt-get install -y --no-install-recommends osmium-tool \
    && rm -rf /var/lib/apt/lists/*

# Bbox Kepulauan Riau: lon 102.8–109.9, lat −1.6–4.8
#   (barat: Karimun, timur: Natuna, utara: Natuna utara, selatan: Lingga).
# Ekstrak Sumatra dipilih karena jauh lebih ringan daripada seluruh Indonesia
# dan tetap mencakup semua pulau Kepri.
ADD https://download.geofabrik.de/asia/indonesia/sumatra-latest.osm.pbf /data/sumatra.osm.pbf

WORKDIR /data
RUN osmium extract -b 102.8,-1.6,109.9,4.8 sumatra.osm.pbf -o kepri.osm.pbf \
    && rm -f sumatra.osm.pbf \
    && osrm-extract -p /opt/car.lua kepri.osm.pbf \
    && osrm-partition kepri.osrm \
    && osrm-customize kepri.osrm \
    && rm -f kepri.osm.pbf

FROM ghcr.io/project-osrm/osrm-backend:latest

WORKDIR /data
COPY --from=builder /data/ /data/

EXPOSE 5001
CMD ["osrm-routed", "--algorithm", "mld", "--port", "5001", "kepri"]