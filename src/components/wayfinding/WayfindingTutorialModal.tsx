"use client";

import { useState } from "react";
import {
  Compass,
  Footprints,
  Layers,
  MapPin,
  Navigation,
  QrCode,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useMapStore } from "@/store/mapStore";

interface WayfindingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQrModal?: () => void;
  onOpenSearchModal?: () => void;
}

export function WayfindingTutorialModal({
  isOpen,
  onClose,
  onOpenQrModal,
  onOpenSearchModal,
}: WayfindingTutorialModalProps) {
  const store = useMapStore();
  const lang = store.lang;
  const [activeStep, setActiveStep] = useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      id: "search",
      badge: lang === "ID" ? "Langkah 1" : "Step 1",
      title: lang === "ID" ? "Cari Lokasi atau Klik Denah" : "Search Location or Tap Map",
      icon: Search,
      iconBg: "linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(2, 132, 199, 0.3))",
      iconColor: "#38bdf8",
      description:
        lang === "ID"
          ? "Gunakan kolom pencarian di bagian atas atau ketuk langsung area polygon ruangan pada denah peta untuk melihat detail gate, resto, musala, ATM, atau layanan bandara."
          : "Use the top search bar or tap directly on room polygons on the map floorplan to view details for gates, dining, prayer rooms, ATMs, or services.",
      tips: [
        lang === "ID" ? "Ketik nama tempat seperti 'Gate 1' atau 'Kedai Madura'" : "Type keywords like 'Gate 1' or 'Dining'",
        lang === "ID" ? "Gunakan filter cepat seperti Kuliner, Mushola, atau Layanan" : "Filter quickly by F&B, Prayer, or Services",
      ],
      actionText: lang === "ID" ? "Buka Pencarian Lokasi" : "Open Search Overlay",
      actionIcon: Search,
      onAction: () => {
        onClose();
        if (onOpenSearchModal) onOpenSearchModal();
        else store.setIsSearchOpen(true);
      },
    },
    {
      id: "qr",
      badge: lang === "ID" ? "Langkah 2" : "Step 2",
      title: lang === "ID" ? "Scan QR Standee Fisik" : "Scan Airport QR Standee",
      icon: QrCode,
      iconBg: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))",
      iconColor: "#10b981",
      description:
        lang === "ID"
          ? "Posisikan posisi awal keberadaan Anda secara presisi dengan memindai kode QR yang terpasang di tiang/standee Bandara Juanda, atau pilih titik awal secara manual."
          : "Set your accurate starting point by scanning physical QR standees located across Juanda Airport, or select your origin point manually.",
      tips: [
        lang === "ID" ? "Membantu sistem menentukan titik 'Where Am I?' lokasi Anda secara tepat" : "Helps the system establish your exact 'Where Am I?' starting pin",
        lang === "ID" ? "Tidak perlu mengira-ngira di mana Anda berada saat ini" : "No need to guess where you currently stand",
      ],
      actionText: lang === "ID" ? "Simulasi Scan QR" : "Simulate QR Scan",
      actionIcon: QrCode,
      onAction: () => {
        onClose();
        if (onOpenQrModal) onOpenQrModal();
      },
    },
    {
      id: "navigation",
      badge: lang === "ID" ? "Langkah 3" : "Step 3",
      title: lang === "ID" ? "Petunjuk Arah Rute Interaktif" : "Interactive Turn-by-Turn Route",
      icon: Navigation,
      iconBg: "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.3))",
      iconColor: "#f59e0b",
      description:
        lang === "ID"
          ? "Tekan 'Mulai Petunjuk Arah' pada tempat tujuan Anda. Algoritma Dijkstra akan menghitung rute terpendek, estimasi jarak jalan kaki, dan durasi tempuh secara akurat."
          : "Tap 'Get Directions' on your target space. The Dijkstra engine calculates the shortest path, walking distance, and estimated walk duration.",
      tips: [
        lang === "ID" ? "Garis rute biru bercahaya menunjukkan rute yang harus diikuti" : "Glowing blue route line highlights your turn-by-turn path",
        lang === "ID" ? "Mendukung indikator instruksi prapenerbangan" : "Supports flight boarding gate navigation alerts",
      ],
    },
    {
      id: "floors",
      badge: lang === "ID" ? "Langkah 4" : "Step 4",
      title: lang === "ID" ? "Navigasi Lintas Lantai & Fasilitas" : "Multi-Floor & Facility Navigation",
      icon: Layers,
      iconBg: "linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(126, 34, 206, 0.3))",
      iconColor: "#c084fc",
      description:
        lang === "ID"
          ? "Jika tujuan berada di lantai berbeda, sistem secara otomatis memberikan instruksi perpindahan melalui Lift (Elevator) atau Tangga (Stairs) beserta filter cepat fasilitas terdekat."
          : "If your destination is on another floor, automatic transfer guidance directs you through Escalators, Elevators, or Stairs with nearby facility shortcuts.",
      tips: [
        lang === "ID" ? "Gunakan tombol T1-L1 / T1-L2 untuk berpindah tampilan denah lantai" : "Use T1-L1 / T1-L2 pills to toggle floorplan views",
        lang === "ID" ? "Akses cepat filter Toilet, Mushola, dan Child Care di panel samping" : "Quick filter buttons for Restrooms, Prayer Rooms, and Elevators",
      ],
    },
  ];

  const currentStep = steps[activeStep];

  return (
    <div className="modal-overlay tutorial-modal-backdrop" onClick={onClose}>
      <div className="modal-card tutorial-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header tutorial-modal-header">
          <div className="tutorial-modal-title-group">
            <div className="tutorial-modal-badge-icon">
              <Sparkles size={22} />
            </div>
            <div>
              <h3>{lang === "ID" ? "Panduan Navigasi Peta Interaktif" : "Interactive Wayfinding Guide"}</h3>
              <p>{lang === "ID" ? "Pelajari cara mudah menemukan lokasi & petunjuk arah di Bandara Juanda" : "Learn how to easily find locations & directions at Juanda Airport"}</p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup panduan">
            <X size={18} />
          </button>
        </div>

        {/* Step Tabs Navigation */}
        <div className="tutorial-step-tabs">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === idx;
            return (
              <button
                key={step.id}
                type="button"
                className="tutorial-step-tab-btn"
                data-active={isActive}
                onClick={() => setActiveStep(idx)}
              >
                <span className="step-num-badge">{idx + 1}</span>
                <Icon size={16} />
                <span className="step-tab-label">{step.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Active Step Content */}
        <div className="tutorial-step-body">
          <div className="tutorial-step-hero">
            <div
              className="tutorial-step-icon-large"
              style={{ background: currentStep.iconBg, color: currentStep.iconColor }}
            >
              <currentStep.icon size={32} />
            </div>
            <div>
              <span className="tutorial-step-tag">{currentStep.badge}</span>
              <h4 className="tutorial-step-title">{currentStep.title}</h4>
            </div>
          </div>

          <p className="tutorial-step-desc">{currentStep.description}</p>

          <div className="tutorial-tips-box">
            <h5>{lang === "ID" ? "💡 Tips Praktis:" : "💡 Quick Tips:"}</h5>
            <ul>
              {currentStep.tips.map((tip, i) => (
                <li key={i}>
                  <Footprints size={14} className="tip-bullet-icon" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {currentStep.onAction && (
            <div className="tutorial-step-action-row">
              <button type="button" className="tutorial-cta-btn" onClick={currentStep.onAction}>
                <currentStep.actionIcon size={16} />
                <span>{currentStep.actionText}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="tutorial-modal-footer">
          <div className="tutorial-footer-dots">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                className="tutorial-dot-pill"
                data-active={activeStep === i}
                onClick={() => setActiveStep(i)}
                aria-label={`Ke langkah ${i + 1}`}
              />
            ))}
          </div>

          <div className="tutorial-footer-buttons">
            {activeStep > 0 && (
              <button
                type="button"
                className="tutorial-nav-btn prev"
                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              >
                {lang === "ID" ? "Sebelumnya" : "Previous"}
              </button>
            )}

            {activeStep < steps.length - 1 ? (
              <button
                type="button"
                className="tutorial-nav-btn next"
                onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
              >
                {lang === "ID" ? "Langkah Berikutnya" : "Next Step"}
              </button>
            ) : (
              <button type="button" className="tutorial-nav-btn finish" onClick={onClose}>
                {lang === "ID" ? "Selesai & Mulai Peta" : "Finish & Open Map"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
