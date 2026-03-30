import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, 
  Search, 
  Filter, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle,
  TrendingUp,
  Users,
  AlertTriangle,
  X,
  MapPin,
  Phone,
  Mail,
  Instagram,
  ExternalLink,
  Calendar,
  Building2,
  User,
  CreditCard,
  FileCheck,
  ImageIcon
} from 'lucide-react';
import { getSubmissions, getDashboardStats, getSubmissionDetail } from '../lib/supabase';

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Data Customer');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [filter, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsData, statsData] = await Promise.all([
        getSubmissions({ status: filter, search, page }),
        getDashboardStats()
      ]);
      setSubmissions(subsData.data);
      setTotalPages(subsData.totalPages);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    navigate('/admin/login');
  };

  const openDetail = async (id) => {
    setSelectedId(id);
    setDetailLoading(true);
    setActiveTab('Data Customer');
    try {
      const data = await getSubmissionDetail(id);
      setDetail(data);
    } catch (error) {
      console.error('Error fetching detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DISETUJUI': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">DISETUJUI</span>;
      case 'PENDING REVIEW': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">PENDING REVIEW</span>;
      case 'DITOLAK': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">DITOLAK</span>;
      default: return null;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 55) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/page-mcu.jpeg" alt="Logo" className="w-10 h-10" />
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-none">Admin Panel</h1>
              <p className="text-xs text-slate-500 mt-1">Manajemen Pengajuan Mitra</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {stats?.total_pending > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-amber-700">{stats.total_pending} Pending</span>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            title="Total Pengajuan" 
            value={stats?.total_pengajuan || 0} 
            subText={`${stats?.pengajuan_7_hari || 0} minggu ini`}
            icon={<FileText className="w-6 h-6 text-amber-600" />}
            color="amber"
          />
          <StatCard 
            title="Disetujui" 
            value={stats?.total_disetujui || 0} 
            subText={`${stats?.total_pengajuan ? Math.round((stats.total_disetujui / stats.total_pengajuan) * 100) : 0}% approval rate`}
            icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
            color="emerald"
          />
          <StatCard 
            title="Pending Review" 
            value={stats?.total_pending || 0} 
            subText="Menunggu review sistem"
            icon={<Clock className="w-6 h-6 text-amber-600" />}
            color="amber"
          />
          <StatCard 
            title="Ditolak" 
            value={stats?.total_ditolak || 0} 
            subText={`Rata-rata skor: ${stats?.rata_rata_skor || 0}`}
            icon={<XCircle className="w-6 h-6 text-red-600" />}
            color="red"
          />
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
              {['Semua', 'DISETUJUI', 'PENDING REVIEW', 'DITOLAK'].map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setPage(1); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {f === 'PENDING REVIEW' ? 'Pending' : f}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama usaha, pemilik, atau nomor REQ..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                />
              </div>
              <button type="submit" className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-all">
                Cari
              </button>
            </form>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">No. REQ</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Usaha</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Jenis</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kota</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Skor</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-medium">Memuat data...</p>
                      </div>
                    </td>
                  </tr>
                ) : submissions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <AlertTriangle className="w-10 h-10 text-slate-300" />
                        <p className="text-slate-500 font-medium">Tidak ada data pengajuan ditemukan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-slate-600">{sub.nomor_referensi}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{sub.nama_usaha}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{sub.jenis_usaha}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{sub.kota_provinsi}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${getScoreColor(sub.skor_total)}`}>{sub.skor_total}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(sub.status_otomatis)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500">{new Date(sub.submitted_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => openDetail(sub.id)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors"
                        >
                          Detail <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === p ? 'bg-amber-600 text-white' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDetail}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {detailLoading ? (
                <div className="p-20 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-medium">Memuat detail...</p>
                </div>
              ) : detail ? (
                <>
                  {/* Modal Header */}
                  <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">{detail.nomor_referensi}</span>
                        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                        <span className="text-xs text-slate-500">{new Date(detail.submitted_at).toLocaleString('id-ID')}</span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-800 mt-1">{detail.nama_usaha}</h2>
                    </div>
                    <button onClick={closeDetail} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <X className="w-6 h-6 text-slate-400" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                    {/* Status Banner */}
                    <div className={`mb-8 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${
                      detail.status_otomatis === 'DISETUJUI' ? 'bg-emerald-50 border border-emerald-100' :
                      detail.status_otomatis === 'PENDING REVIEW' ? 'bg-amber-50 border border-amber-100' :
                      'bg-red-50 border border-red-100'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          detail.status_otomatis === 'DISETUJUI' ? 'bg-emerald-600' :
                          detail.status_otomatis === 'PENDING REVIEW' ? 'bg-amber-500' :
                          'bg-red-600'
                        }`}>
                          {detail.status_otomatis === 'DISETUJUI' ? <CheckCircle2 className="w-6 h-6 text-white" /> :
                           detail.status_otomatis === 'PENDING REVIEW' ? <Clock className="w-6 h-6 text-white" /> :
                           <XCircle className="w-6 h-6 text-white" />}
                        </div>
                        <div>
                          <p className={`text-xs font-bold uppercase tracking-wider ${
                            detail.status_otomatis === 'DISETUJUI' ? 'text-emerald-700' :
                            detail.status_otomatis === 'PENDING REVIEW' ? 'text-amber-700' :
                            'text-red-700'
                          }`}>Status Sistem</p>
                          <h3 className={`text-xl font-bold ${
                            detail.status_otomatis === 'DISETUJUI' ? 'text-emerald-800' :
                            detail.status_otomatis === 'PENDING REVIEW' ? 'text-amber-800' :
                            'text-red-800'
                          }`}>{detail.status_otomatis}</h3>
                        </div>
                      </div>

                      <div className="text-right">
                        {detail.hard_rule_fail ? (
                          <div className="text-left sm:text-right">
                            <p className="text-xs font-bold text-red-700 uppercase mb-1">Gagal Aturan Wajib:</p>
                            <ul className="text-sm text-red-600 space-y-0.5">
                              {detail.hard_rule_detail.map((err, i) => (
                                <li key={i} className="flex items-center gap-2 justify-end">
                                  <span>{err}</span>
                                  <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Skor Kelayakan</p>
                            <div className="flex items-end gap-1 justify-end">
                              <span className={`text-4xl font-bold ${getScoreColor(detail.skor_total)}`}>{detail.skor_total}</span>
                              <span className="text-slate-400 font-bold mb-1">/ 100</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scoring Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                      <ScoreBar label="Dokumen Izin" value={detail.skor_dokumen_izin} max={25} />
                      <ScoreBar label="Foto Lokasi" value={detail.skor_foto_lokasi} max={20} />
                      <ScoreBar label="Usia Usaha" value={detail.skor_usia_usaha} max={15} />
                      <ScoreBar label="Referensi" value={detail.skor_referensi} max={10} />
                      <ScoreBar label="Data Digital" value={detail.skor_data_digital} max={10} />
                      <ScoreBar label="Kapasitas" value={detail.skor_kapasitas} max={10} />
                      <ScoreBar label="Dok Opsional" value={detail.skor_dok_opsional} max={10} />
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b mb-8">
                      {['Data Customer', 'Dokumen & Foto'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-8 py-4 text-sm font-bold transition-all relative ${activeTab === tab ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {tab}
                          {activeTab === tab && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                      {activeTab === 'Data Customer' ? (
                        <motion.div 
                          key="customer"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                        >
                          <DetailCard title="Data Identitas Usaha" icon={<Building2 className="w-5 h-5" />}>
                            <InfoItem label="Jenis Usaha" value={detail.jenis_usaha} />
                            <InfoItem label="Alamat" value={detail.alamat} fullWidth />
                            <InfoItem label="Kota / Provinsi" value={detail.kota_provinsi} />
                            <InfoItem label="Telepon" value={detail.telepon} />
                            <InfoItem label="Email Usaha" value={detail.email_usaha} />
                            <InfoItem label="Instagram" value={detail.instagram} icon={<Instagram className="w-3 h-3" />} />
                            <InfoItem label="Google Maps" value={detail.google_maps_link} isLink />
                            <InfoItem label="Kapasitas" value={`${detail.kapasitas} Orang`} />
                            <InfoItem label="Jam Operasional" value={detail.jam_operasional} />
                            <InfoItem label="Tahun Berdiri" value={detail.tahun_berdiri} />
                          </DetailCard>

                          <div className="space-y-8">
                            <DetailCard title="Data Pemilik" icon={<User className="w-5 h-5" />}>
                              <InfoItem label="Nama Pemilik" value={detail.nama_pemilik} />
                              <InfoItem label="NIK" value={`${detail.nik.substring(0, 6)}**********`} />
                              <InfoItem label="Tempat Lahir" value={detail.tempat_lahir} />
                              <InfoItem label="Tanggal Lahir" value={detail.tgl_lahir} />
                              <InfoItem label="HP Pemilik" value={detail.hp_pemilik} />
                              <InfoItem label="Email Pemilik" value={detail.email_pemilik} />
                            </DetailCard>

                            <DetailCard title="Keuangan & Referensi" icon={<CreditCard className="w-5 h-5" />}>
                              <InfoItem label="Estimasi Order" value={detail.estimasi_order} />
                              <InfoItem label="Metode Bayar" value={detail.metode_bayar} />
                              <InfoItem label="Referensi Distributor" value={detail.referensi_distributor} fullWidth />
                            </DetailCard>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="docs"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                          <DocCard label="KTP Pemilik" url={detail.url_ktp_pemilik} />
                          <DocCard label="NPWP" url={detail.url_npwp} />
                          <DocCard label="SIUP-MB" url={detail.url_siupmb} />
                          <DocCard label="NIB / SIUP" url={detail.url_nib} />
                          <DocCard label="Foto Depan" url={detail.url_foto_depan} />
                          <DocCard label="Foto Interior" url={detail.url_foto_interior} />
                          <DocCard label="KTP Penanggungjawab" url={detail.url_ktp_pj} />
                          <DocCard label="SKDU" url={detail.url_skdu} />
                          <DocCard label="Izin HO" url={detail.url_ho} />
                          <DocCard label="Foto Wide" url={detail.url_foto_wide} />
                          <DocCard label="Foto Dapur" url={detail.url_foto_dapur} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, subText, icon, color }) {
  const colors = {
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600'
  };
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-3xl font-bold text-slate-800">{value}</span>
      </div>
      <p className="text-xs text-slate-400 mt-2 font-medium">{subText}</p>
    </div>
  );
}

function ScoreBar({ label, value, max }) {
  const percent = (value / max) * 100;
  const getBarColor = () => {
    if (percent === 100) return 'bg-emerald-500';
    if (percent >= 60) return 'bg-amber-500';
    if (percent >= 30) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1.5">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all duration-1000 ${getBarColor()}`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function DetailCard({ title, icon, children }) {
  return (
    <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-slate-50 px-6 py-4 border-b flex items-center gap-2">
        <div className="text-amber-600">{icon}</div>
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      <div className="p-6 grid grid-cols-2 gap-y-5 gap-x-6">
        {children}
      </div>
    </div>
  );
}

function InfoItem({ label, value, fullWidth, isLink, icon }) {
  if (!value) return null;
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
        {icon} {label}
      </p>
      {isLink ? (
        <a href={value} target="_blank" rel="noreferrer" className="text-sm font-bold text-amber-600 hover:underline flex items-center gap-1">
          Buka Link <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <p className="text-sm font-semibold text-slate-700 leading-relaxed">{value}</p>
      )}
    </div>
  );
}

function DocCard({ label, url }) {
  if (!url) {
    return (
      <div className="border border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/50">
        <FileText className="w-8 h-8 text-slate-200 mb-2" />
        <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
        <p className="text-[10px] text-slate-300 mt-1 italic">Tidak diupload</p>
      </div>
    );
  }

  if (url === 'PDF_UPLOADED') {
    return (
      <div className="border border-red-100 bg-red-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
        <FileText className="w-8 h-8 text-red-400 mb-2" />
        <p className="text-[10px] font-bold text-red-700 uppercase">{label}</p>
        <p className="text-[10px] text-red-500 mt-1 font-bold">FILE PDF</p>
        <p className="text-[9px] text-red-400 mt-2">File PDF berhasil diterima. Tidak dapat dipreview.</p>
      </div>
    );
  }

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noreferrer"
      className="group relative border border-slate-200 rounded-2xl overflow-hidden hover:border-amber-300 transition-all shadow-sm"
    >
      <img src={url} alt={label} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg">
          <ExternalLink className="w-3 h-3 text-amber-600" />
          <span className="text-[10px] font-bold text-slate-800">Buka ↗</span>
        </div>
      </div>
      <div className="p-3 bg-white border-t">
        <p className="text-[10px] font-bold text-slate-600 uppercase truncate">{label}</p>
        <p className="text-[9px] text-amber-500 mt-0.5 font-bold">Klik untuk buka ↗</p>
      </div>
    </a>
  );
}
