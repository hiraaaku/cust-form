import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, Search, ChevronRight, FileText,
  CheckCircle2, Clock, XCircle, AlertTriangle, X,
  ExternalLink, Building2, User, CreditCard
} from 'lucide-react';
import {
  getSubmissions,
  getDashboardStats,
  getSubmissionDetail,
  updateSubmissionStatus,
} from '../lib/Appsscript';

export default function AdminDashboard() {
  const [submissions, setSubmissions]   = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('Semua');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [selectedRef, setSelectedRef]   = useState(null);
  const [detail, setDetail]             = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab]       = useState('Data Customer');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, [filter, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsData, statsData] = await Promise.all([
        getSubmissions({ status: filter, search, page }),
        getDashboardStats(),
      ]);
      setSubmissions(subsData.data);
      setTotalPages(subsData.totalPages);
      setStats(statsData);
    } catch (err) {
      console.error('fetchData error:', err);
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

  const openDetail = async (ref) => {
    setSelectedRef(ref);
    setDetailLoading(true);
    setActiveTab('Data Customer');
    try {
      const data = await getSubmissionDetail(ref);
      setDetail(data);
    } catch (err) {
      console.error('detail error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => { setSelectedRef(null); setDetail(null); };

  const handleUpdateStatus = async (status) => {
    if (!detail) return;
    const catatan = window.prompt(
      `Tambahkan catatan untuk status "${status}" (opsional):`, 
      detail['Catatan Admin'] || ''
    );
    if (catatan === null) return; // user cancel

    setUpdatingStatus(true);
    try {
      await updateSubmissionStatus(detail['No. Referensi'], status, catatan);
      // Refresh detail & list
      const updated = await getSubmissionDetail(detail['No. Referensi']);
      setDetail(updated);
      fetchData();
    } catch (err) {
      alert('Gagal update status: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'Disetujui': 'bg-emerald-100 text-emerald-700',
      'Pending'  : 'bg-amber-100 text-amber-700',
      'Ditolak'  : 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${map[status] || 'bg-slate-100 text-slate-600'}`}>
        {status || 'Pending'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/page-mcu.jpeg" alt="Logo" className="w-10 h-10 rounded-full" />
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
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Pengajuan" value={stats?.total_pengajuan || 0}
            sub={`${stats?.pengajuan_7_hari || 0} minggu ini`}
            icon={<FileText className="w-5 h-5 text-amber-600" />} bg="bg-amber-50" />
          <StatCard title="Disetujui" value={stats?.total_disetujui || 0}
            sub={`${stats?.total_pengajuan ? Math.round((stats.total_disetujui / stats.total_pengajuan) * 100) : 0}% approval`}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} bg="bg-emerald-50" />
          <StatCard title="Pending" value={stats?.total_pending || 0}
            sub="Menunggu review"
            icon={<Clock className="w-5 h-5 text-amber-600" />} bg="bg-amber-50" />
          <StatCard title="Ditolak" value={stats?.total_ditolak || 0}
            sub="Total ditolak"
            icon={<XCircle className="w-5 h-5 text-red-600" />} bg="bg-red-50" />
        </div>

        {/* Filter & Search */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
              {['Semua', 'Pending', 'Disetujui', 'Ditolak'].map(f => (
                <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {f}
                </button>
              ))}
            </div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Cari nama usaha, pemilik, referensi..."
                  className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm w-72" />
              </div>
              <button type="submit" className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900">Cari</button>
            </form>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b">
                  {['No. REF','Nama Usaha','Jenis','Kota','Status','Tgl Masuk',''].map(h => (
                    <th key={h} className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-9 h-9 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin"></div>
                      <p className="text-slate-400 text-sm">Memuat data...</p>
                    </div>
                  </td></tr>
                ) : submissions.length === 0 ? (
                  <tr><td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertTriangle className="w-9 h-9 text-slate-200" />
                      <p className="text-slate-400 text-sm">Tidak ada data ditemukan</p>
                    </div>
                  </td></tr>
                ) : submissions.map(sub => (
                  <tr key={sub.nomor_referensi} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4"><span className="font-mono text-xs font-bold text-slate-500">{sub.nomor_referensi}</span></td>
                    <td className="px-5 py-4"><p className="font-bold text-slate-800 text-sm">{sub.nama_usaha}</p></td>
                    <td className="px-5 py-4"><span className="text-sm text-slate-500">{sub.jenis_usaha}</span></td>
                    <td className="px-5 py-4"><span className="text-sm text-slate-500">{sub.kota_provinsi}</span></td>
                    <td className="px-5 py-4">{getStatusBadge(sub.status)}</td>
                    <td className="px-5 py-4"><span className="text-xs text-slate-400">{sub.submitted_at}</span></td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => openDetail(sub.nomor_referensi)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-800">
                        Detail <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && totalPages > 1 && (
            <div className="px-5 py-4 bg-slate-50 border-t flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === p ? 'bg-amber-600 text-white' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRef && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeDetail} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

              {detailLoading ? (
                <div className="p-20 flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin"></div>
                  <p className="text-slate-400">Memuat detail...</p>
                </div>
              ) : detail ? (
                <>
                  {/* Modal Header */}
                  <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-slate-400">{detail['No. Referensi']}</span>
                      <h2 className="text-lg font-bold text-slate-800 mt-0.5">{detail['Nama Usaha']}</h2>
                    </div>
                    <button onClick={closeDetail} className="p-2 hover:bg-slate-100 rounded-full">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  {/* Status + Action */}
                  <div className="px-6 pt-5">
                    <div className={`p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      detail['Status'] === 'Disetujui' ? 'bg-emerald-50 border border-emerald-100' :
                      detail['Status'] === 'Ditolak'   ? 'bg-red-50 border border-red-100' :
                      'bg-amber-50 border border-amber-100'
                    }`}>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Status Saat Ini</p>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(detail['Status'])}
                          {detail['Catatan Admin'] && (
                            <span className="text-xs text-slate-500 italic">"{detail['Catatan Admin']}"</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateStatus('Disetujui')} disabled={updatingStatus}
                          className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50">
                          ✓ Setujui
                        </button>
                        <button onClick={() => handleUpdateStatus('Ditolak')} disabled={updatingStatus}
                          className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 disabled:opacity-50">
                          ✗ Tolak
                        </button>
                        <button onClick={() => handleUpdateStatus('Pending')} disabled={updatingStatus}
                          className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-300 disabled:opacity-50">
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b px-6 mt-4">
                    {['Data Customer', 'Dokumen & Foto'].map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-bold transition-all relative ${activeTab === tab ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}>
                        {tab}
                        {activeTab === tab && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                      {activeTab === 'Data Customer' ? (
                        <motion.div key="customer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <DetailCard title="Identitas Usaha" icon={<Building2 className="w-4 h-4" />}>
                            <Info label="Nama PT"          value={detail['Nama PT']} />
                            <Info label="Jenis Usaha"      value={detail['Jenis Usaha']} />
                            <Info label="Kota/Provinsi"    value={detail['Kota/Provinsi']} />
                            <Info label="Telepon"          value={detail['Telepon']} />
                            <Info label="Email"            value={detail['Email Usaha']} />
                            <Info label="Instagram"        value={detail['Instagram']} />
                            <Info label="Kapasitas"        value={detail['Kapasitas'] ? detail['Kapasitas'] + ' orang' : ''} />
                            <Info label="Jam Operasional"  value={detail['Jam Operasional']} />
                            <Info label="Tahun Berdiri"    value={detail['Tahun Berdiri']} />
                            <Info label="Google Maps"      value={detail['Google Maps']} isLink />
                            <Info label="Alamat"           value={detail['Alamat']} wide />
                          </DetailCard>

                          <div className="space-y-6">
                            <DetailCard title="Data Pemilik" icon={<User className="w-4 h-4" />}>
                              <Info label="Nama"         value={detail['Nama Pemilik']} />
                              <Info label="NIK"          value={detail['NIK'] ? String(detail['NIK']).substring(0, 6) + '**********' : ''} />
                              <Info label="Tempat Lahir" value={detail['Tempat Lahir']} />
                              <Info label="Tgl Lahir"    value={detail['Tgl Lahir']} />
                              <Info label="HP"           value={detail['HP Pemilik']} />
                              <Info label="Email"        value={detail['Email Pemilik']} />
                            </DetailCard>
                            <DetailCard title="Keuangan" icon={<CreditCard className="w-4 h-4" />}>
                              <Info label="Estimasi Order"   value={detail['Estimasi Order']} />
                              <Info label="Metode Bayar"     value={[detail['Metode Bayar Kategori'], detail['Metode Bayar Sub']].filter(Boolean).join(' / ')} />
                              <Info label="Tukar Faktur"     value={detail['Tukar Faktur']} />
                              <Info label="Referensi Dist."  value={detail['Referensi Distributor']} wide />
                            </DetailCard>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="docs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {[
                            ['KTP Pemilik',       detail['KTP Pemilik']],
                            ['NPWP',              detail['NPWP']],
                            ['SIUP-MB',           detail['SIUP-MB']],
                            ['NIB',               detail['NIB']],
                            ['Foto Depan',        detail['Foto Depan']],
                            ['Foto Interior',     detail['Foto Interior']],
                            ['KTP PJ',            detail['KTP PJ']],
                            ['SKDU',              detail['SKDU']],
                            ['Izin HO',           detail['Izin HO']],
                            ['Foto Wide',         detail['Foto Wide']],
                            ['Foto Dapur',        detail['Foto Dapur']],
                          ].map(([label, url]) => (
                            <DocCard key={label} label={label} url={url} />
                          ))}
                          {detail['Folder Drive'] && (
                            <a href={detail['Folder Drive']} target="_blank" rel="noreferrer"
                              className="col-span-2 sm:col-span-3 flex items-center gap-2 p-4 border border-amber-200 bg-amber-50 rounded-2xl text-sm font-bold text-amber-700 hover:bg-amber-100">
                              <ExternalLink className="w-4 h-4" /> Buka Semua Dokumen di Google Drive
                            </a>
                          )}
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

// ── Sub-components ──────────────────────────────────────────

function StatCard({ title, value, sub, icon, bg }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg}`}>{icon}</div>
      <p className="text-slate-400 text-xs font-medium">{title}</p>
      <p className="text-3xl font-bold text-slate-800 mt-0.5">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function DetailCard({ title, icon, children }) {
  return (
    <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-slate-50 px-5 py-3 border-b flex items-center gap-2">
        <span className="text-amber-600">{icon}</span>
        <h3 className="font-bold text-slate-700 text-sm">{title}</h3>
      </div>
      <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-4">{children}</div>
    </div>
  );
}

function Info({ label, value, wide, isLink }) {
  if (!value) return null;
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      {isLink ? (
        <a href={value} target="_blank" rel="noreferrer"
          className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1">
          Buka Link <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <p className="text-sm font-semibold text-slate-700 leading-snug">{value}</p>
      )}
    </div>
  );
}

function DocCard({ label, url }) {
  if (!url) return (
    <div className="border border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center bg-slate-50">
      <FileText className="w-7 h-7 text-slate-200 mb-2" />
      <p className="text-[10px] font-bold text-slate-300 uppercase">{label}</p>
      <p className="text-[9px] text-slate-300 mt-0.5 italic">Tidak diupload</p>
    </div>
  );

  // Google Drive URL — tidak bisa di-embed sebagai img, tampilkan tombol
  const isDrive = url.includes('drive.google.com');
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="group border border-slate-200 rounded-2xl overflow-hidden hover:border-amber-300 shadow-sm transition-all">
      {isDrive ? (
        <div className="h-32 bg-slate-50 flex flex-col items-center justify-center gap-2">
          <FileText className="w-8 h-8 text-amber-400" />
          <span className="text-[10px] font-bold text-slate-500">Klik untuk buka</span>
        </div>
      ) : (
        <div className="relative h-32 overflow-hidden">
          <img src={url} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-all flex items-center justify-center">
            <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}
      <div className="p-2.5 bg-white border-t">
        <p className="text-[10px] font-bold text-slate-600 uppercase truncate">{label}</p>
      </div>
    </a>
  );
}
