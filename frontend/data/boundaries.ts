// data/boundaries.ts
// Batas wilayah kabupaten/kota Kepulauan Riau (koordinat perkiraan untuk ilustrasi)
// Untuk produksi: ganti dengan data shapefile resmi dari BIG/BPS

export interface BoundaryFeature {
  kab: string;
  color: string;
  coords: [number, number][];  // [lat, lng][]
}

export const boundaries: BoundaryFeature[] = [
  {
    kab: 'Tanjungpinang',
    color: '#C1622D',
    coords: [
      [0.86, 104.38],
      [0.86, 104.50],
      [1.00, 104.50],
      [1.00, 104.38],
    ],
  },
  {
    kab: 'Batam',
    color: '#1B4F4A',
    coords: [
      [0.95, 103.85],
      [0.95, 104.25],
      [1.30, 104.25],
      [1.30, 103.85],
    ],
  },
  {
    kab: 'Bintan',
    color: '#2D6A8C',
    coords: [
      [0.80, 104.35],
      [0.80, 104.85],
      [1.30, 104.85],
      [1.30, 104.35],
    ],
  },
  {
    kab: 'Karimun',
    color: '#8C6A2F',
    coords: [
      [0.75, 103.20],
      [0.75, 103.55],
      [1.25, 103.55],
      [1.25, 103.20],
    ],
  },
  {
    kab: 'Lingga',
    color: '#6B5B95',
    coords: [
      [-0.65, 104.30],
      [-0.65, 105.10],
      [0.10, 105.10],
      [0.10, 104.30],
    ],
  },
  {
    kab: 'Natuna',
    color: '#B23A2E',
    coords: [
      [3.20, 107.70],
      [3.20, 108.60],
      [4.20, 108.60],
      [4.20, 107.70],
    ],
  },
  {
    kab: 'Anambas',
    color: '#3D6B26',
    coords: [
      [2.70, 105.80],
      [2.70, 106.60],
      [3.40, 106.60],
      [3.40, 105.80],
    ],
  },
];