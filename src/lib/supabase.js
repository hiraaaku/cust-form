import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Menghitung skor kelayakan berdasarkan data form dan file yang diupload.
 */
export const hitungSkor = (formData, files) => {
  const hardRuleFail = []
  const breakdown = {
    dokumen_izin: 0,
    foto_lokasi: 0,
    usia_usaha: 0,
    referensi: 0,
    data_digital: 0,
    kapasitas: 0,
    dok_opsional: 0
  }

  // Hard Rules
  if (!files.ktp_pemilik) hardRuleFail.push('KTP Pemilik wajib diupload')
  if (!files.siupmb) hardRuleFail.push('SIUP-MB wajib diupload')
  if (!files.nib) hardRuleFail.push('NIB / SIUP Umum wajib diupload')

  // Scoring Breakdown
  // 1. Dokumen Izin (Max 25)
  if (files.siupmb) breakdown.dokumen_izin += 15
  if (files.nib) breakdown.dokumen_izin += 10

  // 2. Foto Lokasi (Max 20)
  if (files.foto_depan) breakdown.foto_lokasi += 8
  if (files.foto_interior) breakdown.foto_lokasi += 7
  if (files.foto_wide) breakdown.foto_lokasi += 5

  // 3. Usia Usaha (Max 15)
  const currentYear = new Date().getFullYear()
  const usia = currentYear - Number(formData.tahun_berdiri)
  if (usia >= 3) breakdown.usia_usaha = 15
  else if (usia >= 2) breakdown.usia_usaha = 10
  else if (usia >= 1) breakdown.usia_usaha = 5
  else breakdown.usia_usaha = 0

  // 4. Referensi (Max 10)
  if (formData.referensi_distributor && formData.referensi_distributor.trim().length > 0) {
    breakdown.referensi = 10
  }

  // 5. Data Digital (Max 10)
  if (formData.instagram && formData.instagram.trim().length > 0) breakdown.data_digital += 5
  if (formData.google_maps_link && formData.google_maps_link.trim().length > 0) breakdown.data_digital += 5

  // 6. Kapasitas (Max 10)
  const kap = Number(formData.kapasitas)
  if (kap >= 50) breakdown.kapasitas = 10
  else if (kap >= 20) breakdown.kapasitas = 7
  else if (kap >= 10) breakdown.kapasitas = 4
  else breakdown.kapasitas = 2

  // 7. Dokumen Opsional (Max 10)
  if (files.skdu) breakdown.dok_opsional += 5
  if (files.ho) breakdown.dok_opsional += 5

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0)

  let status = 'DITOLAK'

  // special rule: any Tunai payment category is automatically approved
  if (formData.metode_bayar_kategori === 'Tunai') {
    status = 'DISETUJUI'
  } else if (hardRuleFail.length > 0) {
    status = 'DITOLAK'
  } else if (total >= 70) {
    status = 'DISETUJUI'
  } else if (total >= 55) {
    status = 'PENDING REVIEW'
  } else {
    status = 'DITOLAK'
  }

  return { total, breakdown, status, hardRuleFail }
}

/**
 * Upload file ke ImgBB.
 */
export const uploadToImgbb = async (file) => {
  if (!file) return null
  if (file.type === 'application/pdf') return null

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async () => {
      const base64Data = reader.result.split(',')[1]
      const formData = new FormData()
      formData.append('key', import.meta.env.VITE_IMGBB_API_KEY)
      formData.append('image', base64Data)

      try {
        const response = await fetch('https://api.imgbb.com/1/upload', {
          method: 'POST',
          body: formData
        })
        const result = await response.json()
        if (result.success) {
          resolve(result.data.url)
        } else {
          reject(new Error('Upload ImgBB gagal'))
        }
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Upload semua dokumen dan foto.
 */
export const uploadSemuaDokumen = async (files, onProgress) => {
  const keys = [
    'ktp_pemilik', 'npwp', 'siupmb', 'nib', 'foto_depan',
    'foto_interior', 'ktp_pj', 'skdu', 'ho', 'foto_wide',
    'foto_dapur'
  ]
  const urls = {}
  let completed = 0
  const totalFiles = Object.values(files).filter(f => f !== null).length

  for (const key of keys) {
    const file = files[key]
    if (!file) continue

    if (file.type === 'application/pdf') {
      urls[key] = 'PDF_UPLOADED'
    } else {
      try {
        const url = await uploadToImgbb(file)
        urls[key] = url
      } catch (error) {
        console.error(`Gagal upload ${key}:`, error)
      }
    }
    completed++
    if (onProgress) onProgress(Math.round((completed / totalFiles) * 100))
  }

  return urls
}

/**
 * Submit form pengajuan.
 */
export const submitForm = async (formData, files, onProgress) => {
  const nomorReferensi = 'REQ-' + Date.now()
  const scoring = hitungSkor(formData, files)
  const urls = await uploadSemuaDokumen(files, onProgress)

  const payload = {
    nomor_referensi: nomorReferensi,
    nama_usaha: formData.nama_usaha,
    jenis_usaha: formData.jenis_usaha,
    alamat: formData.alamat,
    kota_provinsi: formData.kota_provinsi,
    google_maps_link: formData.google_maps_link || null,
    telepon: formData.telepon,
    email_usaha: formData.email_usaha,
    instagram: formData.instagram || null,
    kapasitas: Number(formData.kapasitas),
    jam_operasional: formData.jam_operasional,
    tahun_berdiri: Number(formData.tahun_berdiri),
    nama_pemilik: formData.nama_pemilik,
    nik: formData.nik,
    tempat_lahir: formData.tempat_lahir,
    tgl_lahir: formData.tgl_lahir,
    hp_pemilik: formData.hp_pemilik,
    email_pemilik: formData.email_pemilik,
    estimasi_order: formData.estimasi_order,
    // combine kategori and sub-option into one string for storage
    metode_bayar: formData.metode_bayar_kategori
      ? `${formData.metode_bayar_kategori} - ${formData.metode_bayar_sub}`
      : formData.metode_bayar || null,
    referensi_distributor: formData.referensi_distributor || null,
    url_ktp_pemilik: urls.ktp_pemilik || null,
    url_npwp: urls.npwp || null,
    url_siupmb: urls.siupmb || null,
    url_nib: urls.nib || null,
    url_foto_depan: urls.foto_depan || null,
    url_foto_interior: urls.foto_interior || null,
    url_ktp_pj: urls.ktp_pj || null,
    url_skdu: urls.skdu || null,
    url_ho: urls.ho || null,
    url_foto_wide: urls.foto_wide || null,
    url_foto_dapur: urls.foto_dapur || null,
    skor_total: scoring.total,
    skor_dokumen_izin: scoring.breakdown.dokumen_izin,
    skor_foto_lokasi: scoring.breakdown.foto_lokasi,
    skor_usia_usaha: scoring.breakdown.usia_usaha,
    skor_referensi: scoring.breakdown.referensi,
    skor_data_digital: scoring.breakdown.data_digital,
    skor_kapasitas: scoring.breakdown.kapasitas,
    skor_dok_opsional: scoring.breakdown.dok_opsional,
    status_otomatis: scoring.status,
    hard_rule_fail: scoring.hardRuleFail.length > 0,
    hard_rule_detail: scoring.hardRuleFail,
    submitted_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('submissions')
    .insert([payload])
    .select()

  if (error) throw error

  return { data: data[0], scoring, nomorReferensi }
}

/**
 * Ambil daftar pengajuan (Admin).
 */
export const getSubmissions = async ({ status, search, page = 1, perPage = 10 }) => {
  let query = supabase
    .from('submissions')
    .select('id, nomor_referensi, nama_usaha, jenis_usaha, kota_provinsi, telepon, skor_total, status_otomatis, submitted_at, hard_rule_fail', { count: 'exact' })

  if (status && status !== 'Semua') {
    query = query.eq('status_otomatis', status)
  }

  if (search) {
    query = query.or(`nama_usaha.ilike.%${search}%,nama_pemilik.ilike.%${search}%,nomor_referensi.ilike.%${search}%`)
  }

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, count, error } = await query
    .order('submitted_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  return {
    data,
    count,
    totalPages: Math.ceil(count / perPage)
  }
}

/**
 * Ambil detail pengajuan (Admin).
 */
export const getSubmissionDetail = async (id) => {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Ambil statistik dashboard (Admin).
 */
export const getDashboardStats = async () => {
  // Menggunakan view 'dashboard_stats' jika tersedia, jika tidak hitung manual
  // Untuk kemudahan, kita hitung manual di sini jika view tidak ada
  const { data, error } = await supabase
    .from('submissions')
    .select('status_otomatis, skor_total, submitted_at')

  if (error) throw error

  const stats = {
    total_pengajuan: data.length,
    total_disetujui: data.filter(d => d.status_otomatis === 'DISETUJUI').length,
    total_pending: data.filter(d => d.status_otomatis === 'PENDING REVIEW').length,
    total_ditolak: data.filter(d => d.status_otomatis === 'DITOLAK').length,
    rata_rata_skor: data.length > 0 ? (data.reduce((acc, curr) => acc + curr.skor_total, 0) / data.length).toFixed(1) : 0,
    pengajuan_7_hari: data.filter(d => {
      const date = new Date(d.submitted_at)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 7
    }).length,
    pending_review_belum_ditangani: data.filter(d => d.status_otomatis === 'PENDING REVIEW').length
  }

  return stats
}
