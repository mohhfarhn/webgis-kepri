import { Category, StatusCagar, TingkatCagar } from "@prisma/client";

export const cagarBudayaData = [
  //Masjid Penyengat
  {
    nama: "Masjid Raya Sultan Riau",
    slug: "masjid-raya-sultan-riau",
    deskripsi: "Masjid Raya Sultan Riau di Pulau Penyengat, Kepulauan Riau, adalah situs cagar budaya bersejarah yang terkenal karena menggunakan putih telur sebagai perekat bangunannya.",
    kabupaten: "Tanjungpinang",
    kecamatan: "Bukit Bestari",
    alamat: "Pulau Penyengat",
    latitude: 0.9293992,
    longitude: 104.4178951,

    kategori: Category.BANGUNAN,
    status: StatusCagar.DITETAPKAN,
    tingkat: TingkatCagar.NASIONAL,

    tahun: 2010,

    thumbnail: "/uploads/masjid-raya.jpg",

    nomorSK: "KM.43/PW.007/MKP/2010",

    sumber: "Disbud Kota",

    googleMaps: "https://www.google.com/maps/place/Sultan+Riau+Grand+Mosque/@0.9293992,104.4178951,17z/data=!3m1!4b1!4m6!3m5!1s0x31d973b42377c96f:0xe0b6ce35aa671713!8m2!3d0.9293992!4d104.42047!16s%2Fm%2F02qgv6w?entry=ttu&g_ep=EgoyMDI2MDcwNS4wIKXMDSoASAFQAw%3D%3D"
  },
  //Situs Istana Kota Rebah
  {
    nama: "Situs Istana Kota Rebah",
    slug: "situs-istana-kota-rebah",
    deskripsi: "Merupakan situs tapak peninggalan yang diperkirakan adalah pusat kerajaan Riau – Johor pada masa Sultan Ibrahim (1673) sampai pada masa Sultan Mahmud III  (1784) dan pernah menjadi Bandar Perdagangan terbesar se-Asia Tenggara.",
    kabupaten: "Tanjungpinang",
    kecamatan: "Tanjungpinang Timur",
    alamat: "WFJQ+6GV, Kampung Bugis, Tanjungpinang Timur, Kota Tanjungpinang, Kepulauan Riau 29115",
    latitude: 0.9110632,
    longitude: 104.4621515,

    kategori: Category.SITUS,
    status: StatusCagar.DITETAPKAN,
    tingkat: TingkatCagar.KABUPATEN,

    tahun: 2014,

    thumbnail: "/uploads/istana-kota-rebah.jpg",

    nomorSK: "No SK 278 tahun 2014",

    sumber: "Disbud Kepri",

    googleMaps: "https://www.google.com/maps/place/Istana+Kota+Rebah/@0.9306061,104.4862277,17z/data=!4m14!1m7!3m6!1s0x31d96d813534652f:0x6deadb8f02bc605a!2sIstana+Kota+Rebah!8m2!3d0.9306061!4d104.4888026!16s%2Fg%2F11h4tss1jl!3m5!1s0x31d96d813534652f:0x6deadb8f02bc605a!8m2!3d0.9306061!4d104.4888026!16s%2Fg%2F11h4tss1jl?entry=ttu&g_ep=EgoyMDI2MDcwNS4wIKXMDSoASAFQAw%3D%3D"
  },
  //Kompleks Makam Kerkhoff
  {
    nama: "Kompleks Makam Kerkhoff",
    slug: "kompleks-makam-kerkhoff",
    deskripsi: "Pemakaman ini merupakan pemakaman orang Belanda. Berdasarkan inskripsi yang terdapat pada nisan-nisan di perkuburan itu dapat ditarik kesimpulan bahwa makam ini mulai dipergunakan pada abad ke-19 sampai abad ke-20. Angka tahun tertua yang terdapat pada nisan bertarikh tahun 1897, dan angka tahun termuda bertarikh tahun 1962.",
    kabupaten: "Tanjungpinang",
    kecamatan: "Tanjungpinang Barat",
    alamat: "Jl. Kemboja No.70, Kemboja, Kec. Tanjungpinang Barat., Kota Tanjung Pinang, Kepulauan Riau",
    latitude: 0.9255847,
    longitude: 104.4443662,

    kategori: Category.SITUS,
    status: StatusCagar.DITETAPKAN,
    tingkat: TingkatCagar.KABUPATEN,

    tahun: 2014,

    thumbnail: "/uploads/makam-belanda.jpg",

    nomorSK: "SK Penetapan No. 278 Tahun 2014",

    sumber: "Disbud Kepri",

    googleMaps: "https://www.google.com/maps/place/Kuburan+Belanda/@0.9255847,104.4443662,17z/data=!4m14!1m7!3m6!1s0x31d973007f04f2cb:0x4f1036949c38f23e!2sKuburan+Belanda!8m2!3d0.9255847!4d104.4469411!16s%2Fg%2F11x0rm3lwh!3m5!1s0x31d973007f04f2cb:0x4f1036949c38f23e!8m2!3d0.9255847!4d104.4469411!16s%2Fg%2F11x0rm3lwh?entry=ttu&g_ep=EgoyMDI2MDcwNS4wIKXMDSoASAFQAw%3D%3D"
  },
  //Makam Raja Ali Haji
  {
    nama: "Kompleks Makam Raja Ali Haji",
    slug: "kompleks-makam-raja-ali-haji",
    deskripsi: "Kompleks makam Raja Ali Haji terletak di Pulau Penyengat, berjarak sekitar 1,8 hingga 6 kilometer dari pusat Kota Tanjungpinang, Kepulauan Riau. Makam sang Pahlawan Nasional dan bapak bahasa Melayu ini disatukan dalam area yang sama dengan makam permaisuri Engku Putri Raja Hamidah.",
    kabupaten: "Tanjungpinang",
    kecamatan: "Tanjungpinang Kota",
    alamat: "WCHC+3J6, Jl. Pendidikan, Penyengat, Kec. Tj. Pinang Kota, Kota Tanjung Pinang, Kepulauan Riau 29114",
    latitude: 0.9276728,
    longitude: 104.4189391,

    kategori: Category.SITUS,
    status: StatusCagar.DITETAPKAN,
    tingkat: TingkatCagar.NASIONAL,

    tahun: 2004,

    thumbnail: "/uploads/makam-raja-ali-haji.jpg",

    nomorSK: "Keputusan Presiden RI No. 089/TK/Tahun 2004",

    sumber: "Disbud Kepri",

    googleMaps: "https://www.google.com/maps/place/Tomb+of+Raja+Ali+Haji/@0.9276728,104.4189391,17z/data=!3m1!4b1!4m6!3m5!1s0x31d973bb4b748825:0x5f4c21509cecb7df!8m2!3d0.9276728!4d104.421514!16s%2Fg%2F11hz772w6x?entry=ttu&g_ep=EgoyMDI2MDcwNS4wIKXMDSoASAFQAw%3D%3D"
  }
];
