"use client";

import { useState, useEffect } from "react";
import QRScanner from "@/components/QRScanner";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import Head from "next/head";
import { History, ScanLine, FileDown, Settings, LogOut, Edit, Trash2, Plus, CheckSquare } from "lucide-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [fakturList, setFakturList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("scan");
  const [successPopup, setSuccessPopup] = useState(false);
  const [duplicatePopup, setDuplicatePopup] = useState(false);

  // States untuk CRUD
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [modalIndex, setModalIndex] = useState(-1);
  const [formData, setFormData] = useState({
    nomorFaktur: "",
    namaPenjual: "",
    npwpPenjual: "",
    bulan: "",
    tahun: "",
    jumlahPpn: "0"
  });

  // States untuk Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Perhitungan Pagination
  const totalPages = Math.max(1, Math.ceil(fakturList.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = fakturList.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fungsi untuk memuat data dari server
  const fetchFakturData = async () => {
    try {
      const res = await fetch("/efs/api/faktur");
      if (res.ok) {
        const data = await res.json();
        setFakturList(data);
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data:", err);
    }
  };

  useEffect(() => {
    fetchFakturData(); // fetch pertama kali
    const interval = setInterval(() => {
      fetchFakturData();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleScanSuccess = async (decodedText) => {
    if (loading) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/efs/api/faktur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: decodedText }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.isDuplicate) {
          setDuplicatePopup(true);
          setTimeout(() => setDuplicatePopup(false), 1500);
          return;
        }
        throw new Error(data.error || "Terjadi kesalahan saat memproses faktur.");
      }

      await fetchFakturData();

      // Tampilkan popup sukses
      setSuccessPopup(true);
      setTimeout(() => setSuccessPopup(false), 1500);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (fakturList.length === 0) return;
    const csvData = Papa.unparse(fakturList);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `faktur_pajak_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleExportExcel = () => {
    if (fakturList.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(fakturList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Faktur");
    XLSX.writeFile(workbook, `faktur_pajak_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleDelete = async (index) => {
    if (!window.confirm("Yakin ingin menghapus faktur ini?")) return;
    try {
      const res = await fetch("/efs/api/faktur", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index }),
      });
      if (res.ok) {
        await fetchFakturData();
        setSelectedIndices(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
      }
    } catch (err) {
      console.error("Gagal menghapus:", err);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIndices.length === 0) return;
    if (!window.confirm(`Yakin ingin menghapus ${selectedIndices.length} faktur terpilih?`)) return;
    try {
      const res = await fetch("/efs/api/faktur", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indices: selectedIndices }),
      });
      if (res.ok) {
        await fetchFakturData();
        setSelectedIndices([]);
      }
    } catch (err) {
      console.error("Gagal menghapus terpilih:", err);
    }
  };

  const handleDeleteAll = async () => {
    if (fakturList.length === 0) return;
    if (!window.confirm("PERINGATAN: Yakin ingin menghapus SEMUA data faktur?")) return;
    try {
      const res = await fetch("/efs/api/faktur", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAll: true }),
      });
      if (res.ok) {
        await fetchFakturData();
        setSelectedIndices([]);
      }
    } catch (err) {
      console.error("Gagal menghapus semua:", err);
    }
  };

  const handleSelect = (index, checked) => {
    if (checked) {
      setSelectedIndices(prev => [...prev, index]);
    } else {
      setSelectedIndices(prev => prev.filter(i => i !== index));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIndices(fakturList.map((_, i) => i));
    } else {
      setSelectedIndices([]);
    }
  };

  const openModal = (mode, index = -1) => {
    setModalMode(mode);
    setModalIndex(index);
    if (mode === "edit" && index >= 0) {
      setFormData({ ...fakturList[index] });
    } else {
      setFormData({ nomorFaktur: "", namaPenjual: "", npwpPenjual: "", bulan: "", tahun: "", jumlahPpn: "0" });
    }
    setModalOpen(true);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === "add") {
        const res = await fetch("/efs/api/faktur", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isManual: true, data: formData }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Gagal menambah data");
      } else {
        const res = await fetch("/efs/api/faktur", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ index: modalIndex, data: formData }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Gagal mengubah data");
      }
      setModalOpen(false);
      await fetchFakturData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Yakin ingin keluar?")) return;
    try {
      await fetch("/efs/api/auth", { method: "DELETE" });
      window.location.href = "/efs/login";
    } catch (err) {
      console.error("Gagal logout:", err);
    }
  };

  if (!mounted) return null;

  return (
    <div className="app-container">
      {/* BEAUTIFUL SUCCESS POPUP */}
      {successPopup && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          padding: "1.5rem 2rem",
          borderRadius: "20px",
          boxShadow: "0 20px 40px -10px rgba(16, 185, 129, 0.3), 0 0 0 1px rgba(16, 185, 129, 0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 9999,
          animation: "popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #34D399 0%, #059669 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
            boxShadow: "0 8px 20px -4px rgba(16, 185, 129, 0.5)"
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 style={{ margin: 0, color: "#065F46", fontSize: "1.25rem", fontWeight: "700", letterSpacing: "-0.01em" }}>Berhasil!</h2>
          <p style={{ margin: "0.25rem 0 0", color: "#4B5563", fontSize: "0.9rem", fontWeight: "500" }}>Faktur ditambahkan.</p>
        </div>
      )}

      {/* BEAUTIFUL DUPLICATE POPUP */}
      {duplicatePopup && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          padding: "1.5rem 2rem",
          borderRadius: "20px",
          boxShadow: "0 20px 40px -10px rgba(245, 158, 11, 0.3), 0 0 0 1px rgba(245, 158, 11, 0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 9999,
          animation: "popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FBBF24 0%, #D97706 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
            boxShadow: "0 8px 20px -4px rgba(245, 158, 11, 0.5)"
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h2 style={{ margin: 0, color: "#92400E", fontSize: "1.25rem", fontWeight: "700", letterSpacing: "-0.01em" }}>Sudah Ada!</h2>
          <p style={{ margin: "0.25rem 0 0", color: "#4B5563", fontSize: "0.9rem", fontWeight: "500", textAlign: "center" }}>Faktur ini sudah pernah di-scan.</p>
        </div>
      )}

      <header className="header" style={{ marginBottom: "2rem" }}>
        <div className="logo-section">
          <div className="logo-icon">
            <img src="/efs/icon.svg" alt="Logo" style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
          </div>
          <h1 className="title">e-Faktur</h1>
        </div>
        <p className="subtitle">Scanner Faktur DJP untuk ACD ICBP NSF</p>
      </header>

      <main className="main-content">
        {/* TAB SCAN */}
        <div className={`tab-content ${activeTab === "scan" ? "mobile-active" : ""}`}>
          <section className="card scanner-section">
            <h2 className="section-title">Pemindai Faktur</h2>
            <p style={{ marginBottom: "1.5rem", color: "#6B7280", fontSize: "0.85rem", textAlign: "center" }}>
              Arahkan kamera ke QR Code faktur.
            </p>
            <QRScanner onScanSuccess={handleScanSuccess} isActive={activeTab === "scan"} />
            {loading && <div className="loading-badge">Memproses data...</div>}
            {errorMsg && <div className="error-badge">{errorMsg}</div>}
          </section>
        </div>

        {/* TAB HISTORY */}
        <div className={`tab-content ${activeTab === "history" ? "mobile-active" : ""}`}>
          <section className="card table-section">
            <div className="table-header">
              <h2 className="section-title">Riwayat ({fakturList.length})</h2>
              <div className="desktop-action-buttons action-buttons" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => openModal("add")} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#3b82f6' }}>
                  <Plus size={18} /> Tambah
                </button>
                {selectedIndices.length > 0 && (
                  <button onClick={handleDeleteSelected} className="btn-delete" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                    <Trash2 size={18} /> Hapus Terpilih ({selectedIndices.length})
                  </button>
                )}
                {fakturList.length > 0 && selectedIndices.length === 0 && (
                  <button onClick={handleDeleteAll} className="btn-delete" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                    <Trash2 size={18} /> Hapus Semua
                  </button>
                )}
                {/* <button onClick={handleExportCSV} className="btn-secondary" disabled={fakturList.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                  <FileDown size={18} /> CSV
                </button> */}
                <button onClick={handleExportExcel} className="btn-primary" disabled={fakturList.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                  <FileDown size={18} /> Excel
                </button>
                <button onClick={handleLogout} className="btn-delete" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                  <LogOut size={18} /> Logout
                </button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '1%', whiteSpace: 'nowrap', textAlign: 'center', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        checked={fakturList.length > 0 && selectedIndices.length === fakturList.length}
                      />
                    </th>
                    <th>No. Seri Faktur</th>
                    <th>Supplier</th>
                    <th>Bulan</th>
                    <th>Tahun</th>
                    <th>PPN</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-state">Belum ada data.</td>
                    </tr>
                  ) : (
                    currentData.map((faktur, index) => {
                      const actualIndex = startIndex + index;
                      return (
                      <tr key={actualIndex} style={selectedIndices.includes(actualIndex) ? { backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}>
                        <td style={{ width: '1%', whiteSpace: 'nowrap', textAlign: 'center', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
                          <input
                            type="checkbox"
                            className="custom-checkbox"
                            checked={selectedIndices.includes(actualIndex)}
                            onChange={(e) => handleSelect(actualIndex, e.target.checked)}
                          />
                        </td>
                        <td className="font-medium text-primary">{faktur.nomorFaktur}</td>
                        <td>{faktur.namaPenjual}</td>
                        <td>{faktur.bulan}</td>
                        <td>{faktur.tahun}</td>
                        <td className="font-semibold text-accent">
                          Rp {parseInt(faktur.jumlahPpn).toLocaleString("id-ID")}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => openModal("edit", actualIndex)} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Edit size={14} />
                            </button>
                            <button onClick={() => handleDelete(actualIndex)} className="btn-delete" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {fakturList.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', padding: '0 0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tampilkan:</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid var(--border-light)', outline: 'none', background: 'var(--surface)', color: 'var(--text-main)', cursor: 'pointer' }}
                  >
                    <option value={10}>10 baris</option>
                    <option value={25}>25 baris</option>
                    <option value={50}>50 baris</option>
                    <option value={100}>100 baris</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Halaman {currentPage} dari {totalPages}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      disabled={currentPage === 1}
                      className="btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', borderRadius: '8px' }}
                    >
                      Prev
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                      disabled={currentPage === totalPages}
                      className="btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', borderRadius: '8px' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* TAB EXPORT */}
        <div className={`tab-content mobile-only-tab ${activeTab === "export" ? "mobile-active" : ""}`}>
          <section className="card">
            <h2 className="section-title">Ekspor & Pengaturan</h2>
            <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)" }}>Download semua data riwayat faktur Anda.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <button onClick={handleExportCSV} className="btn-secondary" disabled={fakturList.length === 0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
                <FileDown size={20} />
                Download CSV
              </button>
              <button onClick={handleExportExcel} className="btn-primary" disabled={fakturList.length === 0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
                <FileDown size={20} />
                Download Excel
              </button>

              <hr style={{ margin: "1rem 0", borderColor: "var(--border-light)", borderStyle: "solid", borderWidth: "1px 0 0 0" }} />

              <button onClick={handleLogout} className="btn-delete" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', width: '100%', borderRadius: '12px' }}>
                <LogOut size={20} />
                Keluar (Logout)
              </button>
            </div>
          </section>
        </div>

        {/* MODAL CRUD */}
        {modalOpen && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10000,
            display: "flex", justifyContent: "center", alignItems: "center",
            padding: "1rem"
          }}>
            <div style={{
              background: "white", borderRadius: "16px", padding: "2rem",
              width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              color: "#1F2937"
            }}>
              <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: "700" }}>
                {modalMode === "add" ? "Tambah Data Manual" : "Edit Data Faktur"}
              </h2>
              <form onSubmit={handleSaveModal} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "600" }}>No. Seri Faktur</label>
                  <input required type="text" value={formData.nomorFaktur} onChange={e => setFormData({ ...formData, nomorFaktur: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #D1D5DB" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "600" }}>Nama Penjual (Supplier)</label>
                  <input required type="text" value={formData.namaPenjual} onChange={e => setFormData({ ...formData, namaPenjual: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #D1D5DB" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "600" }}>NPWP Penjual</label>
                  <input required type="text" value={formData.npwpPenjual} onChange={e => setFormData({ ...formData, npwpPenjual: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #D1D5DB" }} />
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "600" }}>Bulan</label>
                    <input required type="text" placeholder="Misal: Januari" value={formData.bulan} onChange={e => setFormData({ ...formData, bulan: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #D1D5DB" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "600" }}>Tahun</label>
                    <input required type="text" placeholder="Misal: 2024" value={formData.tahun} onChange={e => setFormData({ ...formData, tahun: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #D1D5DB" }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "600" }}>Jumlah PPN (Tanpa Titik)</label>
                  <input required type="number" value={formData.jumlahPpn} onChange={e => setFormData({ ...formData, jumlahPpn: e.target.value })} style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #D1D5DB" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                  <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary" style={{ padding: "0.75rem 1.5rem" }}>Batal</button>
                  <button type="submit" className="btn-primary" style={{ padding: "0.75rem 1.5rem" }}>Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <History size={24} strokeWidth={activeTab === "history" ? 2.5 : 2} />
          <span>Riwayat</span>
        </button>

        <div className={`nav-item-center ${activeTab === "scan" ? "active" : ""}`} onClick={() => setActiveTab("scan")}>
          <div className="center-btn">
            <ScanLine size={32} strokeWidth={2.5} color="white" />
          </div>
          <span>Scan</span>
        </div>

        <button
          className={`nav-item ${activeTab === "export" ? "active" : ""}`}
          onClick={() => setActiveTab("export")}
        >
          <Settings size={24} strokeWidth={activeTab === "export" ? 2.5 : 2} />
          <span>Pengaturan</span>
        </button>
      </nav>
    </div>
  );
}
