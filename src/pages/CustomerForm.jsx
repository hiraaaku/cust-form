import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  AlertCircle, 
  Loader2,
  X,
  Clock,
  Check,
  XCircle
} from 'lucide-react';
import { submitForm } from '../lib/supabase';

const STEPS = [
  { id: 1, title: 'Data Usaha' },
  { id: 2, title: 'Data Pemilik' },
  { id: 3, title: 'Keuangan' },
  { id: 4, title: 'Dokumen' },
  { id: 5, title: 'Review' }
];

const JENIS_USAHA = ['Bar', 'Restoran', 'Hotel', 'Karaoke', 'Nightclub', 'Lainnya'];
const ESTIMASI_ORDER = ['Kurang dari 10 karton', '10–50 karton', '50–100 karton', 'Lebih dari 100 karton'];
// payment categories and sub-options
const METODE_BAYAR_KATEGORI = ['Tunai', 'Non Tunai'];
const METODE_BAYAR_SUBS = {
  Tunai: ['COD', 'CBD'],
  'Non Tunai': ['TOP 21 hari', 'TOP 30 hari']
};

export default function CustomerForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nama_usaha: '',
    nama_pt: '',
    jenis_usaha: '',
    alamat: '',
    kota_provinsi: '',
    google_maps_link: '',
    telepon: '',
    email_usaha: '',
    instagram: '',
    kapasitas: '',
    jam_operasional: '',
    tahun_berdiri: '',
    nama_pemilik: '',
    nik: '',
    tempat_lahir: '',
    tgl_lahir: '',
    hp_pemilik: '',
    email_pemilik: '',
    estimasi_order: '',
    metode_bayar_kategori: '',
    metode_bayar_sub: '',
    referensi_distributor: '',
    tukar_faktur: ''
  });

  const [files, setFiles] = useState({
    ktp_pemilik: null,
    npwp: null,
    siupmb: null,
    nib: null,
    foto_depan: null,
    foto_interior: null,
    ktp_pj: null,
    skdu: null,
    ho: null,
    foto_wide: null,
    foto_dapur: null
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasil, setHasil] = useState(null);
  const [agreed, setAgreed] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const update = { ...prev, [name]: value };
      // if category changes, clear the sub-option
      if (name === 'metode_bayar_kategori') {
        update.metode_bayar_sub = '';
      }
      return update;
    });
    setErrors(prev => {
      const newErrors = { ...prev };
      if (newErrors[name]) {
        delete newErrors[name];
      }
      // when category changed we also drop any sub-option error
      if (name === 'metode_bayar_kategori' && newErrors.metode_bayar_sub) {
        delete newErrors.metode_bayar_sub;
      }
      return newErrors;
    });
  };

  const handleFileChange = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [key]: file }));
    }
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.nama_usaha) newErrors.nama_usaha = 'Wajib diisi';
      if (!formData.nama_pt) newErrors.nama_pt = 'Wajib diisi';
      if (!formData.jenis_usaha) newErrors.jenis_usaha = 'Wajib diisi';
      if (!formData.alamat) newErrors.alamat = 'Wajib diisi';
      if (!formData.kota_provinsi) newErrors.kota_provinsi = 'Wajib diisi';
      if (!formData.telepon) newErrors.telepon = 'Wajib diisi';
      else if (!/^\d{10,}$/.test(formData.telepon)) newErrors.telepon = 'Minimal 10 digit angka';
      if (!formData.email_usaha) newErrors.email_usaha = 'Wajib diisi';
      if (!formData.kapasitas) newErrors.kapasitas = 'Wajib diisi';
      if (!formData.jam_operasional) newErrors.jam_operasional = 'Wajib diisi';
      if (!formData.tahun_berdiri) newErrors.tahun_berdiri = 'Wajib diisi';
    } else if (step === 2) {
      if (!formData.nama_pemilik) newErrors.nama_pemilik = 'Wajib diisi';
      if (!formData.nik) newErrors.nik = 'Wajib diisi';
      else if (!/^\d{16}$/.test(formData.nik)) newErrors.nik = 'Harus 16 digit angka';
      if (!formData.tempat_lahir) newErrors.tempat_lahir = 'Wajib diisi';
      if (!formData.tgl_lahir) newErrors.tgl_lahir = 'Wajib diisi';
      if (!formData.hp_pemilik) newErrors.hp_pemilik = 'Wajib diisi';
      else if (!/^\d{10,}$/.test(formData.hp_pemilik)) newErrors.hp_pemilik = 'Minimal 10 digit angka';
      if (!formData.email_pemilik) newErrors.email_pemilik = 'Wajib diisi';
    } else if (step === 3) {
      if (!formData.estimasi_order) newErrors.estimasi_order = 'Wajib diisi';
      if (!formData.tukar_faktur) newErrors.tukar_faktur = 'Wajib diisi';
      if (!formData.metode_bayar_kategori) newErrors.metode_bayar_kategori = 'Wajib diisi';
      if (!formData.metode_bayar_sub) newErrors.metode_bayar_sub = 'Wajib diisi';
    } else if (step === 4) {
      if (!files.ktp_pemilik) newErrors.ktp_pemilik = 'Wajib diupload';
      if (!files.npwp) newErrors.npwp = 'Wajib diupload';
      if (!files.siupmb) newErrors.siupmb = 'Wajib diupload';
      if (!files.nib) newErrors.nib = 'Wajib diupload';
      if (!files.foto_depan) newErrors.foto_depan = 'Wajib diupload';
      if (!files.foto_interior) newErrors.foto_interior = 'Wajib diupload';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    setStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!agreed) return;
    setSubmitting(true);
    try {
      const result = await submitForm(formData, files, (progress) => {
        setUploadProgress(progress);
      });
      setHasil(result);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Terjadi kesalahan saat mengirim pengajuan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
          <img src="/page-mcu.jpeg" alt="Logo" className="w-12 h-12" />
          <div>
            <h1 className="text-xl font-bold text-slate-800">Pengajuan Kemitraan</h1>
            <p className="text-sm text-slate-500 font-medium">Lengkapi data untuk bergabung sebagai mitra kami</p>
          </div>
        </div>
      </div>

      {/* Sticky Progress Bar */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center flex-1 relative">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                  ${step > s.id ? 'bg-emerald-500 text-white' : step === s.id ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-500'}
                `}>
                  {step > s.id ? <Check className="w-6 h-6" /> : s.id}
                </div>
                <span className={`text-[10px] mt-1 font-semibold uppercase tracking-wider hidden sm:block ${step === s.id ? 'text-amber-600' : 'text-slate-400'}`}>
                  {s.title}
                </span>
                {s.id < STEPS.length && (
                  <div className={`absolute top-5 left-[60%] w-[80%] h-[2px] -z-10 ${step > s.id ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl shadow-sm border p-6 sm:p-10"
          >
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Data Identitas Usaha</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Nama Usaha *</label>
                    <input 
                      type="text" name="nama_usaha" value={formData.nama_usaha} onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.nama_usaha ? 'border-red-500' : 'border-slate-200'}`}
                      placeholder="Contoh: Restoran Bintang Lima"
                    />
                    {errors.nama_usaha && <p className="text-red-500 text-xs">{errors.nama_usaha}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Nama PT *</label>
                    <input 
                      type="text" name="nama_pt" value={formData.nama_pt} onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.nama_pt ? 'border-red-500' : 'border-slate-200'}`}
                      placeholder="Contoh: PT. Maju Jaya"
                    />
                    {errors.nama_pt && <p className="text-red-500 text-xs">{errors.nama_pt}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Jenis Usaha *</label>
                    <select 
                      name="jenis_usaha" value={formData.jenis_usaha} onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.jenis_usaha ? 'border-red-500' : 'border-slate-200'}`}
                    >
                      <option value="">Pilih Jenis Usaha</option>
                      {JENIS_USAHA.map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                    {errors.jenis_usaha && <p className="text-red-500 text-xs">{errors.jenis_usaha}</p>}
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Alamat Lengkap *</label>
                    <textarea 
                      name="alamat" value={formData.alamat} onChange={handleInputChange} rows={3}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.alamat ? 'border-red-500' : 'border-slate-200'}`}
                      placeholder="Alamat lengkap usaha..."
                    ></textarea>
                    {errors.alamat && <p className="text-red-500 text-xs">{errors.alamat}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Kota / Provinsi *</label>
                    <input 
                      type="text" name="kota_provinsi" value={formData.kota_provinsi} onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.kota_provinsi ? 'border-red-500' : 'border-slate-200'}`}
                      placeholder="Contoh: Jakarta Selatan, DKI Jakarta"
                    />
                    {errors.kota_provinsi && <p className="text-red-500 text-xs">{errors.kota_provinsi}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Google Maps Link (Opsional)</label>
                    <input 
                      type="text" name="google_maps_link" value={formData.google_maps_link} onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Telepon Usaha *</label>
                    <input 
                      type="text" name="telepon" value={formData.telepon} onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.telepon ? 'border-red-500' : 'border-slate-200'}`}
                      placeholder="021XXXXXXXX"
                    />
                    {errors.telepon && <p className="text-red-500 text-xs">{errors.telepon}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Email Usaha *</label>
                    <input 
                      type="email" name="email_usaha" value={formData.email_usaha} onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.email_usaha ? 'border-red-500' : 'border-slate-200'}`}
                      placeholder="email@usaha.com"
                    />
                    {errors.email_usaha && <p className="text-red-500 text-xs">{errors.email_usaha}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Instagram (Opsional)</label>
                    <input 
                      type="text" name="instagram" value={formData.instagram} onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="@namausaha"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Kapasitas (Orang) *</label>
                    <input 
                      type="number" name="kapasitas" value={formData.kapasitas} onChange={handleInputChange} min="1"
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.kapasitas ? 'border-red-500' : 'border-slate-200'}`}
                      placeholder="Contoh: 50"
                    />
                    {errors.kapasitas && <p className="text-red-500 text-xs">{errors.kapasitas}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Jam Operasional *</label>
                    <input 
                      type="text" name="jam_operasional" value={formData.jam_operasional} onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.jam_operasional ? 'border-red-500' : 'border-slate-200'}`}
                      placeholder="Senin-Minggu 17:00-02:00"
                    />
                    {errors.jam_operasional && <p className="text-red-500 text-xs">{errors.jam_operasional}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Tahun Berdiri *</label>
                    <input 
                      type="number" name="tahun_berdiri" value={formData.tahun_berdiri} onChange={handleInputChange} min="1900" max={new Date().getFullYear()}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.tahun_berdiri ? 'border-red-500' : 'border-slate-200'}`}
                      placeholder="Contoh: 2020"
                    />
                    {errors.tahun_berdiri && <p className="text-red-500 text-xs">{errors.tahun_berdiri}</p>}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Data Pemilik</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Nama Pemilik *</label>
                    <input 
                      type="text" name="nama_pemilik" value={formData.nama_pemilik} onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.nama_pemilik ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.nama_pemilik && <p className="text-red-500 text-xs">{errors.nama_pemilik}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">NIK (KTP) *</label>
                    <input 
                      type="text" name="nik" value={formData.nik} onChange={handleInputChange} maxLength={16}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.nik ? 'border-red-500' : 'border-slate-200'}`}
                      placeholder="16 digit angka"
                    />
                    {errors.nik && <p className="text-red-500 text-xs">{errors.nik}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Tempat Lahir *</label>
                    <input 
                      type="text" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.tempat_lahir ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.tempat_lahir && <p className="text-red-500 text-xs">{errors.tempat_lahir}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Tanggal Lahir *</label>
                    <input 
                      type="date" name="tgl_lahir" value={formData.tgl_lahir} onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.tgl_lahir ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.tgl_lahir && <p className="text-red-500 text-xs">{errors.tgl_lahir}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">HP Pemilik *</label>
                    <input 
                      type="text" name="hp_pemilik" value={formData.hp_pemilik} onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.hp_pemilik ? 'border-red-500' : 'border-slate-200'}`}
                      placeholder="08XXXXXXXXXX"
                    />
                    {errors.hp_pemilik && <p className="text-red-500 text-xs">{errors.hp_pemilik}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Email Pemilik *</label>
                    <input 
                      type="email" name="email_pemilik" value={formData.email_pemilik} onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.email_pemilik ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.email_pemilik && <p className="text-red-500 text-xs">{errors.email_pemilik}</p>}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Keuangan & Referensi</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Estimasi Order Per Bulan *</label>
                    <select 
                      name="estimasi_order" value={formData.estimasi_order} onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.estimasi_order ? 'border-red-500' : 'border-slate-200'}`}
                    >
                      <option value="">Pilih Estimasi</option>
                      {ESTIMASI_ORDER.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    {errors.estimasi_order && <p className="text-red-500 text-xs">{errors.estimasi_order}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Tukar Faktur *</label>
                    <select
                      name="tukar_faktur"
                      value={formData.tukar_faktur}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.tukar_faktur ? 'border-red-500' : 'border-slate-200'}`}
                    >
                      <option value="">Pilih</option>
                      <option value="Ya">Ya</option>
                      <option value="Tidak">Tidak</option>
                    </select>
                    {errors.tukar_faktur && <p className="text-red-500 text-xs">{errors.tukar_faktur}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Kategori Metode Pembayaran *</label>
                    <select
                      name="metode_bayar_kategori"
                      value={formData.metode_bayar_kategori}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.metode_bayar_kategori ? 'border-red-500' : 'border-slate-200'}`}
                    >
                      <option value="">Pilih Kategori</option>
                      {METODE_BAYAR_KATEGORI.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                    {errors.metode_bayar_kategori && <p className="text-red-500 text-xs">{errors.metode_bayar_kategori}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Opsi Metode Pembayaran *</label>
                    <select
                      name="metode_bayar_sub"
                      value={formData.metode_bayar_sub}
                      onChange={handleInputChange}
                      disabled={!formData.metode_bayar_kategori}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${errors.metode_bayar_sub ? 'border-red-500' : 'border-slate-200'} ${!formData.metode_bayar_kategori ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Pilih Opsi</option>
                      {formData.metode_bayar_kategori && METODE_BAYAR_SUBS[formData.metode_bayar_kategori].map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    {errors.metode_bayar_sub && <p className="text-red-500 text-xs">{errors.metode_bayar_sub}</p>}
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Referensi Distributor (Opsional)</label>
                    <textarea 
                      name="referensi_distributor" value={formData.referensi_distributor} onChange={handleInputChange} rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="Kosongkan jika tidak ada"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Upload Dokumen & Foto</h2>
                  <p className="text-slate-500 text-sm mt-1">Format: JPG, PNG, atau PDF (untuk dokumen tertentu)</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Dokumen Wajib */}
                  {[
                    { key: 'ktp_pemilik', label: 'KTP Pemilik', desc: 'Foto KTP yang terbaca jelas', required: true, accept: 'image/*,.pdf' },
                    { key: 'npwp', label: 'NPWP Usaha / Pribadi', desc: 'Foto atau scan NPWP', required: true, accept: 'image/*,.pdf' },
                    { key: 'siupmb', label: 'SIUP-MB', desc: 'Masa berlaku harus terlihat jelas', required: true, accept: 'image/*,.pdf' },
                    { key: 'nib', label: 'NIB / SIUP Umum', desc: 'Nomor Induk Berusaha dari OSS', required: true, accept: 'image/*,.pdf' },
                    { key: 'foto_depan', label: 'Foto Tampak Depan Gedung', desc: 'Papan nama usaha harus terlihat', required: true, accept: 'image/*' },
                    { key: 'foto_interior', label: 'Foto Interior / Area Bar', desc: 'Tampilkan bar counter atau area utama', required: true, accept: 'image/*' },
                    { key: 'ktp_pj', label: 'KTP Penanggung Jawab Izin', desc: 'Jika berbeda dari pemilik', required: false, accept: 'image/*,.pdf' },
                    { key: 'skdu', label: 'SKDU', desc: 'Surat Keterangan Domisili Usaha', required: false, accept: 'image/*,.pdf' },
                    { key: 'ho', label: 'Izin HO / Izin Gangguan', desc: 'Jika diwajibkan di daerah Anda', required: false, accept: 'image/*,.pdf' },
                    { key: 'foto_wide', label: 'Foto Tampak Luar Wide Shot', desc: 'Foto area sekitar gedung', required: false, accept: 'image/*' },
                    { key: 'foto_dapur', label: 'Foto Dapur / Area Servis', desc: 'Opsional untuk restoran', required: false, accept: 'image/*' }
                  ].map((doc) => (
                    <div key={doc.key} className={`p-5 border rounded-2xl transition-all ${files[doc.key] ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${doc.required ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                            {doc.required ? 'Wajib' : 'Opsional'}
                          </span>
                          <h3 className="font-bold text-slate-800 mt-1">{doc.label}</h3>
                          <p className="text-xs text-slate-500">{doc.desc}</p>
                        </div>
                        {files[doc.key] && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                      </div>

                      {files[doc.key] ? (
                        <div className="flex items-center gap-3 mt-4">
                          <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center overflow-hidden">
                            {files[doc.key].type.startsWith('image/') ? (
                              <img src={URL.createObjectURL(files[doc.key])} alt="preview" className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-6 h-6 text-amber-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 truncate">{files[doc.key].name}</p>
                            <button 
                              onClick={() => setFiles(prev => ({ ...prev, [doc.key]: null }))}
                              className="text-xs text-amber-600 font-bold mt-1 hover:underline"
                            >
                              Ganti File
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="mt-4 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-6 cursor-pointer hover:bg-slate-50 transition-colors">
                          <Upload className="w-6 h-6 text-slate-400 mb-2" />
                          <span className="text-xs font-semibold text-slate-600">Pilih File</span>
                          <input 
                            type="file" 
                            accept={doc.accept} 
                            onChange={(e) => handleFileChange(e, doc.key)}
                            className="hidden"
                          />
                        </label>
                      )}
                      {errors[doc.key] && <p className="text-red-500 text-xs mt-2">{errors[doc.key]}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-slate-800">Review Pengajuan</h2>
                
                <div className="space-y-6">
                  {/* Card Data Usaha */}
                  <div className="border rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-6 py-3 border-b flex justify-between items-center">
                      <h3 className="font-bold text-slate-700">Data Usaha</h3>
                      <button onClick={() => setStep(1)} className="text-xs font-bold text-amber-600">Edit</button>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                      <div><p className="text-slate-500">Nama Usaha</p><p className="font-semibold">{formData.nama_usaha}</p></div>
                      <div><p className="text-slate-500">Jenis Usaha</p><p className="font-semibold">{formData.jenis_usaha}</p></div>
                      <div className="col-span-2"><p className="text-slate-500">Alamat</p><p className="font-semibold">{formData.alamat}</p></div>
                      <div><p className="text-slate-500">Telepon</p><p className="font-semibold">{formData.telepon}</p></div>
                      <div><p className="text-slate-500">Kapasitas</p><p className="font-semibold">{formData.kapasitas} Orang</p></div>
                    </div>
                  </div>

                  {/* Card Data Pemilik */}
                  <div className="border rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-6 py-3 border-b flex justify-between items-center">
                      <h3 className="font-bold text-slate-700">Data Pemilik</h3>
                      <button onClick={() => setStep(2)} className="text-xs font-bold text-amber-600">Edit</button>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                      <div><p className="text-slate-500">Nama Pemilik</p><p className="font-semibold">{formData.nama_pemilik}</p></div>
                      <div><p className="text-slate-500">NIK</p><p className="font-semibold">{formData.nik.substring(0, 6)}**********</p></div>
                      <div><p className="text-slate-500">HP Pemilik</p><p className="font-semibold">{formData.hp_pemilik}</p></div>
                      <div><p className="text-slate-500">Email</p><p className="font-semibold">{formData.email_pemilik}</p></div>
                    </div>
                  </div>

                  {/* Card Keuangan */}
                  <div className="border rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-6 py-3 border-b flex justify-between items-center">
                      <h3 className="font-bold text-slate-700">Keuangan & Referensi</h3>
                      <button onClick={() => setStep(3)} className="text-xs font-bold text-amber-600">Edit</button>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                      <div><p className="text-slate-500">Estimasi Order</p><p className="font-semibold">{formData.estimasi_order}</p></div>
                      <div><p className="text-slate-500">Metode Bayar</p><p className="font-semibold">
                        {formData.metode_bayar_kategori && formData.metode_bayar_sub
                          ? `${formData.metode_bayar_kategori} / ${formData.metode_bayar_sub}`
                          : ''}
                      </p></div>
                    </div>
                  </div>

                  {/* Card Dokumen */}
                  <div className="border rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-6 py-3 border-b flex justify-between items-center">
                      <h3 className="font-bold text-slate-700">Dokumen Upload</h3>
                      <button onClick={() => setStep(4)} className="text-xs font-bold text-amber-600">Edit</button>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(files).map(([key, file]) => {
                        if (!file) return null;
                        const labels = {
                          ktp_pemilik: 'KTP Pemilik', npwp: 'NPWP', siupmb: 'SIUP-MB', nib: 'NIB / SIUP',
                          foto_depan: 'Foto Depan', foto_interior: 'Foto Interior', ktp_pj: 'KTP PJ',
                          skdu: 'SKDU', ho: 'Izin HO', foto_wide: 'Foto Wide', foto_dapur: 'Foto Dapur'
                        };
                        return (
                          <div key={key} className="flex items-center gap-2 text-sm text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>{labels[key]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                      Saya menyatakan seluruh data dan dokumen yang saya berikan adalah benar dan dapat dipertanggungjawabkan.
                    </span>
                  </label>
                </div>
              </div>
            )}

            <div className="mt-12 flex justify-between items-center">
              {step > 1 ? (
                <button 
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" /> Kembali
                </button>
              ) : <div></div>}

              {step < 5 ? (
                <button 
                  onClick={nextStep}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-amber-600 text-white font-bold shadow-lg shadow-amber-200 hover:bg-amber-700 transition-all"
                >
                  Lanjut <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={!agreed || submitting}
                  className={`
                    flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-white shadow-xl transition-all
                    ${!agreed || submitting ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'}
                  `}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Mengirim...
                    </>
                  ) : (
                    'Kirim Pengajuan'
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Success Modal */}
      <AnimatePresence>
        {hasil && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 sm:p-12 max-w-lg w-full text-center shadow-2xl relative"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Terima Kasih!</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Pengajuan Anda sudah kami terima. Tim kami akan menghubungi Anda dalam 2-3 hari ke depan.
              </p>
              <div className="bg-slate-50 py-4 px-6 rounded-2xl mb-8 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nomor Referensi</p>
                <span className="font-mono text-2xl font-bold text-amber-600 tracking-wider">{hasil.nomorReferensi}</span>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-amber-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all"
              >
                Selesai
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Overlay */}
      <AnimatePresence>
        {submitting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl">
              <Loader2 className="w-16 h-16 text-amber-600 animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Sedang Memproses</h3>
              <p className="text-slate-500 text-sm mb-6">Mohon tunggu sebentar, kami sedang mengupload dokumen Anda.</p>
              
              <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
                <div 
                  className="bg-amber-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-amber-600 font-bold">{uploadProgress}%</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
