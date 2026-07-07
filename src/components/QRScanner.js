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
            onDecodeError: (error) => { },
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
          hiddenInputRef.current.focus({ preventScroll: true });
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
        track.applyConstraints({ advanced: [{ zoom: val }] }).catch(() => { });
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

      {/* HIDDEN INPUT FOR HONEYWELL MODE */}
      {isHoneywellMode && (
        <input
          ref={hiddenInputRef}
          type="text"
          style={{ position: 'fixed', opacity: 0, top: '50%', left: '50%', zIndex: -100 }}
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
      )}

      {errorMsg && <div className="error-badge" style={{ marginTop: 0 }}>{errorMsg}</div>}

      <style>{`
        .hover-btn-scale {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .hover-btn-scale:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px -8px rgba(16, 185, 129, 0.3) !important;
          border-color: #10B981 !important;
        }
      `}</style>

      <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: isDesktop ? '600px' : '450px', justifyContent: 'center', flexWrap: 'wrap' }}>

        {/* KAMERA BUTTON (Mobile Only) */}
        {!isDesktop && (
          <button onClick={() => { if (isScanning) stopCamera(); else startCamera(); }} style={{
            flex: 'none', minWidth: '120px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            padding: '0.75rem 1rem', gap: '0.5rem', borderRadius: '16px', transition: 'all 0.2s ease-in-out', cursor: 'pointer',
            backgroundColor: isScanning ? '#ECFDF5' : '#ffffff',
            border: isScanning ? '2px solid #10B981' : '1px solid #E2E8F0',
            color: isScanning ? '#047857' : '#0F172A',
            boxShadow: isScanning ? '0 10px 15px -3px rgba(16, 185, 129, 0.15)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
              <circle cx="12" cy="13" r="3"></circle>
            </svg>
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Kamera</span>
            {isScanning && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10B981', background: '#D1FAE5', padding: '2px 6px', borderRadius: '10px' }}>ON</span>}
          </button>
        )}

        {/* UPLOAD BUTTON */}
        <button
          onClick={() => fileInputRef.current.click()}
          className={`hover-btn-scale ${!isDesktop ? 'desktop-action-buttons' : ''}`}
          style={{
            flex: isDesktop ? 1 : 'none', minWidth: isDesktop ? '150px' : '120px', display: 'flex', flexDirection: isDesktop ? 'column' : 'row', alignItems: 'center',
            justifyContent: 'center', padding: isDesktop ? '1.5rem 1rem' : '0.75rem 1rem', gap: isDesktop ? '0.75rem' : '0.5rem', borderRadius: isDesktop ? '24px' : '16px',
            backgroundColor: '#ffffff', border: '2px solid #E2E8F0', color: '#0F172A',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', cursor: 'pointer'
          }}
        >
          <svg width={isDesktop ? "48" : "24"} height={isDesktop ? "48" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <span style={{ fontSize: isDesktop ? '1rem' : '0.9rem', fontWeight: isDesktop ? '700' : '600' }}>Upload</span>
        </button>

        {/* SCANNER FISIK BUTTON (Desktop Only) */}
        {isDesktop && (
          <button
            onClick={() => { if (isHoneywellMode) stopHoneywell(); else startHoneywell(); }}
            className="hover-btn-scale"
            style={{
              flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '1.5rem 1rem', gap: '0.75rem', borderRadius: '24px', cursor: 'pointer',
              backgroundColor: isHoneywellMode ? '#ECFDF5' : '#ffffff',
              border: isHoneywellMode ? '2px solid #10B981' : '2px solid #E2E8F0',
              color: isHoneywellMode ? '#047857' : '#0F172A',
              boxShadow: isHoneywellMode ? '0 10px 15px -3px rgba(16, 185, 129, 0.15)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
              <rect x="7" y="7" width="1.5" height="10"></rect>
              <rect x="10.5" y="7" width="1.5" height="10"></rect>
              <rect x="14" y="7" width="2.5" height="10"></rect>
              <rect x="18.5" y="7" width="1" height="10"></rect>
            </svg>
            <span style={{ fontSize: '1rem', fontWeight: '700' }}>Scanner Fisik</span>
            {isHoneywellMode && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', background: '#D1FAE5', padding: '2px 8px', borderRadius: '12px', marginTop: '-4px' }}>ON</span>
            )}
          </button>
        )}
      </div>

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

