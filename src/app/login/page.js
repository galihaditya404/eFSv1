"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Gagal masuk.");
      }
    } catch (err) {
      setErrorMsg("Koneksi bermasalah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper" style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "row",
      backgroundColor: "#F8FAFC"
    }}>

      {/* Kiri: Background Image (Hidden di layar kecil) */}
      <div className="login-bg" style={{
        flex: 1,
        backgroundImage: "url('/bg-login.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative"
      }}>
        {/* Overlay tipis agar gambar terlihat lebih elegan */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 100%)"
        }}>
          <div className="desktop-only-text" style={{ position: "absolute", bottom: "3rem", left: "3rem", color: "white" }}>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>e-Faktur Scanner</h2>
            <p style={{ fontSize: "1.1rem", opacity: 0.8, maxWidth: "500px" }}>
              Sistem scanner QR Code e-Faktur DJP untuk Accounting Department - ICBP NSF.
            </p>
          </div>
        </div>
      </div>

      {/* Kanan: Login Form */}
      <div className="login-form-container" style={{
        width: "100%",
        maxWidth: "500px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.05)",
        zIndex: 10
      }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>

          {/* Logo / Ikon Perusahaan */}
          <div style={{
            width: "80px",
            height: "80px",
            background: "#50a780",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "2rem",
            boxShadow: "0 8px 20px -4px rgba(0, 0, 0, 0.1)"
          }}>
            <img src="/icon.svg" alt="Logo" style={{ width: '70%', height: '70%', objectFit: 'contain' }} />
          </div>

          <h1 style={{
            fontSize: "1.85rem",
            fontWeight: "800",
            color: "#111827",
            marginBottom: "0.5rem",
            letterSpacing: "-0.02em"
          }}>
            Selamat Datang
          </h1>
          <p style={{ color: "#6B7280", fontSize: "0.95rem", marginBottom: "2.5rem", lineHeight: "1.5" }}>
            Silakan masukkan kredensial akses Anda untuk masuk ke dalam sistem e-Faktur.
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "1.25rem", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }}>
                <Lock size={20} />
              </div>
              <input
                type="password"
                placeholder="Password / PIN Akses"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "1.15rem 1.15rem 1.15rem 3.25rem",
                  borderRadius: "12px",
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  fontSize: "1rem",
                  fontWeight: "500",
                  color: "#111827",
                  outline: "none",
                  transition: "all 0.2s ease"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#10B981";
                  e.target.style.background = "white";
                  e.target.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E5E7EB";
                  e.target.style.background = "#F9FAFB";
                  e.target.style.boxShadow = "none";
                }}
                autoFocus
              />
            </div>

            {errorMsg && (
              <div style={{
                color: "#DC2626",
                fontSize: "0.9rem",
                fontWeight: "500",
                background: "#FEF2F2",
                border: "1px solid #FEE2E2",
                padding: "0.85rem",
                borderRadius: "10px",
                animation: "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
              }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: "100%",
                padding: "1.15rem",
                borderRadius: "12px",
                background: loading || !password ? "#E5E7EB" : "#10B981",
                color: loading || !password ? "#9CA3AF" : "white",
                fontSize: "1.05rem",
                fontWeight: "600",
                border: "none",
                cursor: loading || !password ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginTop: "1rem",
                boxShadow: loading || !password ? "none" : "0 4px 12px rgba(16, 185, 129, 0.3)",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => {
                if (!loading && password) e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseOut={(e) => {
                if (!loading && password) e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {loading ? "Memverifikasi..." : "Masuk ke Sistem"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div style={{ marginTop: "3rem", textAlign: "center", color: "#656669ff", fontSize: "0.8rem" }}>
            &copy; 2026 Indofood CBP Sukses Makmur Tbk - Nutrition & Special Foods<br /> G.B.J.
          </div>

        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .login-wrapper {
            position: relative;
            align-items: center;
            justify-content: center;
          }
          .login-bg {
            position: absolute !important;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 0;
          }
          .login-form-container {
            position: relative;
            z-index: 10;
            max-width: 92% !important;
            height: auto !important;
            border-radius: 24px !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
            margin: 0 auto;
            padding: 2.5rem 1.5rem !important;
            background-color: rgba(255, 255, 255, 0.45) !important;
          }
          .desktop-only-text {
            display: none !important;
          }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div >
  );
}
