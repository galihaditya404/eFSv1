"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

export default function QRScanner({ onScanSuccess, isActive = true }) {
  const [isScanning, setIsScanning] = useState(false);
  const [isHoneywellMode, setIsHoneywellMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDesktop, setIsDesktop] = useState(true);
  
  // Zoom State
  const [zoomRange, setZoomRange] = useState(null);
  const [zoomValue, setZoomValue] = useState(1);

  const fileInputRef = useRef(null);
  const scannerRef = useRef(null);
  const hiddenInputRef = useRef(null);
  const isStartingRef = useRef(false);
  const onScanSuccessRef = useRef(onScanSuccess);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    setIsDesktop(typeof window !== "undefined" && window.innerWidth > 640);
    const handleResize = () => setIsDesktop(window.innerWidth > 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    if (isScanning || isStartingRef.current) return;
    isStartingRef.current = true;
    setIsScanning(true);
    setIsHoneywellMode(false);
    setErrorMsg("");

    try {
      const videoElement = document.getElementById("qr-video");

      if (!scannerRef.current) {
        scannerRef.current = new QrScanner(
          videoElement,
          (result) => {
            if (result && result.data) {
              onScanSuccessRef.current(result.data);
            }
          },
          {
            onDecodeError: (error) => {},
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 10,
          }
        );
      }

      await scannerRef.current.start();

      // Check if camera supports zoom
      const hasCamera = await QrScanner.hasCamera();
      if (hasCamera && videoElement.srcObject) {
        const track = videoElement.srcObject.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities();
          if (capabilities.zoom) {
            setZoomRange({ min: capabilities.zoom.min, max: capabilities.zoom.max, step: capabilities.zoom.step });
            setZoomValue(capabilities.zoom.min);
          } else {
            setZoomRange(null);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Akses kamera ditolak atau kamera tidak ditemukan.");
      setIsScanning(false);
    } finally {
      isStartingRef.current = false;
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
    }
    setIsScanning(false);
    setZoomRange(null);
  };

  const startHoneywell = async () => {
    await stopCamera();
    setIsHoneywellMode(true);
    setErrorMsg("");
  };

  const stopHoneywell = () => {
    setIsHoneywellMode(false);
  };

  // Watch for isActive changes
  useEffect(() => {
    if (isActive) {
      if (!isDesktop) {
        if (!isScanning) startCamera();
      }
    } else {
      if (isScanning) stopCamera();
      if (isHoneywellMode) stopHoneywell();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isDesktop]);

  // Auto-focus the hidden input when in Honeywell Mode
  useEffect(() => {
    let focusTimeout;
    const enforceFocus = () => {
      if (isActive && isHoneywellMode && isDesktop && hiddenInputRef.current) {
        // Only steal focus if they aren't typing in another legit input field
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== "INPUT" && activeTag !== "TEXTAREA") {
          hiddenInputRef.current.focus();
        }
      }
    };

    if (isActive && isHoneywellMode && isDesktop) {
      focusTimeout = setTimeout(enforceFocus, 100);
      window.addEventListener("click", enforceFocus);
    }

    return () => {
      clearTimeout(focusTimeout);
      window.removeEventListener("click", enforceFocus);
    };
  }, [isActive, isHoneywellMode, isDesktop]);

  // We no longer need the global window keydown listener because the hidden input catches everything natively!


  const handleFileUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      if (result && result.data) {
        onScanSuccessRef.current(result.data);
      }
    } catch (err) {
      console.error("Scan File Error:", err);
      setErrorMsg("Error: " + (err?.message || err || "QR tidak valid"));
    }

    e.target.value = "";
  };

  const handleZoomChange = (e) => {
    const val = parseFloat(e.target.value);
    setZoomValue(val);
    const videoElement = document.getElementById("qr-video");
    if (videoElement && videoElement.srcObject) {
      const track = videoElement.srcObject.getVideoTracks()[0];
      if (track) {
        track.applyConstraints({ advanced: [{ zoom: val }] }).catch(() => {});
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>

      <video
        id="qr-video"
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "20px",
          overflow: "hidden",
          display: isScanning ? "block" : "none",
          border: "4px solid #10B981"
        }}
      ></video>

      {zoomRange && isScanning && (
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#047857' }}>{zoomRange.min}x</span>
          <input
            type="range"
            min={zoomRange.min}
            max={zoomRange.max}
            step={zoomRange.step}
            value={zoomValue}
            onChange={handleZoomChange}
            style={{ flex: 1, accentColor: '#10B981' }}
          />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#047857' }}>{zoomRange.max}x</span>
        </div>
      )}

      {isHoneywellMode && (
        <div style={{
          width: "100%", maxWidth: "450px", padding: "2.5rem 1.5rem",
          borderRadius: "24px",
          background: "linear-gradient(145deg, #ffffff, #f0fdf4)",
          border: "2px solid #10B981",
          boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.2)",
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: "1.5rem", color: "#064E3B", textAlign: "center",
          position: "relative",
          overflow: "hidden",
          animation: "pulseGlow 2s infinite"
        }}>
          {/* Style untuk animasi */}
          <style>{`
            @keyframes pulseGlow {
              0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4), 0 10px 25px -5px rgba(16, 185, 129, 0.2); }
              70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0), 0 10px 25px -5px rgba(16, 185, 129, 0.2); }
              100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0), 0 10px 25px -5px rgba(16, 185, 129, 0.2); }
            }
            @keyframes scanLine {
              0% { top: -10%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 100%; opacity: 0; }
            }
            @keyframes floatIcon {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
              100% { transform: translateY(0px); }
            }
          `}</style>
          
          {/* Laser Scanner Animation */}
          <div style={{
            position: "absolute", left: 0, width: "100%", height: "3px",
            background: "linear-gradient(90deg, transparent, #10B981, transparent)",
            boxShadow: "0 0 10px #10B981",
            animation: "scanLine 2.5s infinite linear",
            zIndex: 1
          }}></div>

          {/* HIDDEN INPUT TO NATIVELY INTERCEPT ALL BROWSER SHORTCUTS AND CAPTURE TYPING */}
          <input
            ref={hiddenInputRef}
            type="text"
            style={{ position: 'absolute', opacity: 0, top: '-9999px', left: '-9999px' }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const val = e.target.value;
                clearTimeout(window.scannerTimeout);
                if (val.trim().length > 5) {
                  onScanSuccessRef.current(val.trim());
                }
                e.target.value = "";
              }
            }}
            onChange={(e) => {
              const val = e.target.value;
              clearTimeout(window.scannerTimeout);
              window.scannerTimeout = setTimeout(() => {
                if (val.trim().length > 5) {
                  onScanSuccessRef.current(val.trim());
                }
                if (hiddenInputRef.current) hiddenInputRef.current.value = "";
              }, 200);
            }}
          />

          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            background: "#ECFDF5", display: "flex", justifyContent: "center", alignItems: "center",
            boxShadow: "inset 0 0 20px rgba(16, 185, 129, 0.2)",
            animation: "floatIcon 3s ease-in-out infinite",
            position: "relative",
            zIndex: 2
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7V4h16v3M9 20h6M12 14v6"></path>
            </svg>
          </div>

          <div style={{ position: "relative", zIndex: 2 }}>
            <h3 style={{ margin: 0, fontWeight: 800, fontSize: "1.4rem", letterSpacing: "-0.02em" }}>
              Mode Scanner Fisik
            </h3>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "0.5rem" }}>
              <span style={{ display: "inline-block", width: "10px", height: "10px", backgroundColor: "#10B981", borderRadius: "50%", animation: "pulseGlow 1.5s infinite" }}></span>
              <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#059669" }}>Sistem Siap Menerima Data...</span>
            </div>
            <p style={{ margin: "1rem 0 0", fontSize: "0.85rem", opacity: 0.7, lineHeight: 1.5 }}>
              Arahkan alat scanner fisik ke barcode faktur pajak dan tekan tombolnya. Data akan terbaca otomatis.
            </p>
          </div>
        </div>
      )}

      {errorMsg && <div className="error-badge" style={{ marginTop: 0 }}>{errorMsg}</div>}

      {!isScanning && !isHoneywellMode ? (
        <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: isDesktop ? '600px' : '450px', justifyContent: 'center', flexWrap: 'wrap' }}>

          {!isDesktop && (
            <button onClick={startCamera} className="btn-primary btn-scan-camera" style={{ flex: 1, minWidth: '150px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                <circle cx="12" cy="13" r="3"></circle>
              </svg>
              <span style={{ fontSize: '1rem', fontWeight: '500' }}>Kamera</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current.click()}
            className={`btn-secondary ${!isDesktop ? 'desktop-action-buttons' : ''}`}
            style={{
              flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '1.5rem 1rem', gap: '0.75rem', borderRadius: '24px'
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span style={{ fontSize: '1rem', fontWeight: '600' }}>Upload</span>
          </button>

          {isDesktop && (
            <button onClick={startHoneywell} className="btn-secondary" style={{
              flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '1.5rem 1rem', gap: '0.75rem', borderRadius: '24px',
              backgroundColor: '#ECFDF5', border: '2px solid #34D399', color: '#047857',
              boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05)',
              transition: 'all 0.2s ease-in-out'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                <rect x="7" y="7" width="1.5" height="10"></rect>
                <rect x="10.5" y="7" width="1.5" height="10"></rect>
                <rect x="14" y="7" width="2.5" height="10"></rect>
                <rect x="18.5" y="7" width="1" height="10"></rect>
              </svg>
              <span style={{ fontSize: '1rem', fontWeight: '700', letterSpacing: '-0.01em' }}>Scanner Fisik</span>
            </button>
          )}

        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px', marginTop: '0.5rem' }}>

          <button onClick={() => fileInputRef.current.click()} className="btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '16px', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            Upload Gambar
          </button>

          {isScanning && (
            <button onClick={stopCamera} style={{ background: 'transparent', color: '#EF4444', border: 'none', fontWeight: '500', fontSize: '0.95rem', padding: '0.5rem', cursor: 'pointer', alignSelf: 'center', textDecoration: 'none' }}>
              Tutup Kamera
            </button>
          )}

          {isHoneywellMode && (
            <button onClick={stopHoneywell} style={{ background: 'transparent', color: '#EF4444', border: 'none', fontWeight: '500', fontSize: '0.95rem', padding: '0.5rem', cursor: 'pointer', alignSelf: 'center', textDecoration: 'none' }}>
              Batal Mode Scanner
            </button>
          )}
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />
    </div>
  );
}

