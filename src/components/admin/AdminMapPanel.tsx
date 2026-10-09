"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Check, Image as ImageIcon, Layers3, MapPin, Save } from "lucide-react";
import { MapStage } from "@/components/wayfinding/MapStage";
import { floors, spaces } from "@/data/demo-wayfinding";
import type { MapSpace, TerminalCode } from "@/types";
import { SceneModel, type SceneBounds, type SceneObjectRecord } from "@/components/map3d/SceneModel";
import type { SelectedObject } from "@/lib/map3d/object-metadata";
import { defaultMapObjectConfig, fetchMapObjectConfigsFromDb, getMapObjectPhotoUrl, readMapObjectConfigs, saveMapObjectConfigToDb, writeMapObjectConfigs, type MapObjectConfig, type MapObjectConfigByName, type MapObjectDoorSide, type MapObjectOccupancy } from "@/lib/map3d/admin-object-config";

function LegacyAdminMapPanel() {
  const [terminal, setTerminal] = useState<TerminalCode>("T1");
  const [floorId, setFloorId] = useState("T1-L1");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const terminalFloors = floors.filter((floor) => floor.terminal === terminal);
  const visibleSpaces = useMemo(
    () => spaces.filter((space) => space.floorId === floorId),
    [floorId]
  );
  const selected = spaces.find((space) => space.id === selectedId) ?? null;

  const selectTerminal = (nextTerminal: TerminalCode) => {
    setTerminal(nextTerminal);
    setFloorId(`${nextTerminal}-L1`);
    setSelectedId(null);
  };

  const selectSpace = (space: MapSpace) => {
    setSelectedId(space.id);
  };

  return (
    <div className="content-box admin-map-box">
      <div className="box-header admin-map-header">
        <div className="box-title">
          <h2>Peta Terminal Interaktif</h2>
          <p>Pantau ruang, tenant, dan fasilitas tanpa keluar dari portal admin.</p>
        </div>

        <div className="admin-map-selectors" aria-label="Pilih area peta">
          <div className="admin-map-selector-group" aria-label="Pilih terminal">
            {(["T1", "T2"] as TerminalCode[]).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={terminal === item}
                onClick={() => selectTerminal(item)}
              >
                Terminal {item.slice(1)}
              </button>
            ))}
          </div>
          <div className="admin-map-selector-group" aria-label="Pilih lantai">
            {terminalFloors.map((floor) => (
              <button
                key={floor.id}
                type="button"
                aria-pressed={floorId === floor.id}
                onClick={() => {
                  setFloorId(floor.id);
                  setSelectedId(null);
                }}
              >
                {floor.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-map-summary">
        <span><Layers3 size={15} /> {terminal} &bull; {floorId.endsWith("L1") ? "Lantai 1" : "Lantai 2"}</span>
        <strong>{visibleSpaces.length} lokasi ditampilkan</strong>
      </div>

      <div className="admin-map-canvas">
        <MapStage
          terminal={terminal}
          floorId={floorId}
          spaces={visibleSpaces}
          selectedId={selectedId}
          route={null}
          fromId={null}
          toId={null}
          currentId={null}
          onSelect={selectSpace}
        />
      </div>

      <div className="admin-map-selection" data-empty={!selected}>
        <span className="admin-map-selection-icon"><MapPin size={18} /></span>
        {selected ? (
          <div>
            <small>LOKASI TERPILIH</small>
            <strong>{selected.tenant?.name ?? selected.label}</strong>
            <span>{selected.code} &bull; {selected.category} &bull; {selected.status === "ACTIVE" ? "Aktif" : "Tidak aktif"}</span>
          </div>
        ) : (
          <div>
            <strong>Pilih lokasi pada peta</strong>
            <span>Klik area ruang atau ikon POI untuk melihat ringkasannya.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminCamera({ bounds }: { bounds: SceneBounds | null }) {
  const { camera } = useThree();
  useEffect(() => {
    if (!bounds || !(camera instanceof THREE.PerspectiveCamera)) return;
    const direction = new THREE.Vector3(0.72, 0.95, 0.72).normalize();
    camera.position.copy(bounds.center).add(direction.multiplyScalar(Math.max(bounds.radius * 1.35, 20)));
    camera.lookAt(bounds.center);
  }, [bounds, camera]);
  return <OrbitControls makeDefault enableDamping minDistance={3} maxDistance={1000} />;
}

const OCCUPANCY_OPTIONS: Array<{ value: MapObjectOccupancy; label: string; help: string }> = [
  { value: "OCCUPIED", label: "Ditempati", help: "Lokasi aktif dan memiliki tenant/fasilitas." },
  { value: "OBSTACLE", label: "Tembok / pilar", help: "Tetap terlihat dan menjadi penghalang rute." },
  { value: "WALKABLE", label: "Kosong / bisa dilalui", help: "Disembunyikan dari model dan tidak menghalangi rute." },
];

function EditorField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="admin-object-field"><span>{label}</span>{children}</label>;
}

export function AdminMapPanel() {
  const [bounds, setBounds] = useState<SceneBounds | null>(null);
  const [objects, setObjects] = useState<SceneObjectRecord[]>([]);
  const [selected, setSelected] = useState<SelectedObject | null>(null);
  const [configs, setConfigs] = useState<MapObjectConfigByName>({});
  const [draft, setDraft] = useState<MapObjectConfig | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Muat dari DB saat panel dibuka; fallback ke localStorage jika DB tidak tersedia
  useEffect(() => {
    fetchMapObjectConfigsFromDb()
      .then(setConfigs)
      .catch(() => setConfigs(readMapObjectConfigs()));
  }, []);
  const handleReady = useCallback((nextBounds: SceneBounds, nextObjects: SceneObjectRecord[]) => { setBounds(nextBounds); setObjects(nextObjects); }, []);
  const editableObjects = useMemo(() => objects.filter((record) => record.selectable && /^(T1|TI)-GF-|^T1-FF-|^BAGGAGE|^DOOR__|^tembok[-_]pillar|^tembok_pilar_/i.test(record.name)), [objects]);
  const selectRecord = useCallback((record: SceneObjectRecord) => {
    setSelected({ ...record.metadata, uuid: record.uuid, name: record.name, position: [0, 0, 0] });
    setDraft(configs[record.name] ?? defaultMapObjectConfig(record.name));
    setSaved(false);
  }, [configs]);
  const selectObject = useCallback((selection: SelectedObject) => {
    const record = objects.find((item) => item.uuid === selection.uuid);
    if (record?.selectable) selectRecord(record);
  }, [objects, selectRecord]);
  const updateDraft = <K extends keyof MapObjectConfig>(key: K, value: MapObjectConfig[K]) => setDraft((current) => current ? { ...current, [key]: value } : current);
    const updateDoor = (index: number, key: "side" | "open" | "position", value: string | boolean) => setDraft((current) => {
      if (!current) return current;
      const entryDoors = current.entryDoors.map((door, doorIndex) => {
        if (doorIndex !== index) return door;
        if (key === "side") return { ...door, side: value as MapObjectDoorSide };
        if (key === "open") return { ...door, open: Boolean(value) };
        return { ...door, position: Number(value) };
      });
      return { ...current, entryDoors };
    });
  const saveDraft = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveMapObjectConfigToDb(draft);
      const next = { ...configs, [draft.objectName]: { ...draft, updatedAt: new Date().toISOString() } };
      setConfigs(next);
      setDraft(next[draft.objectName]);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Gagal menyimpan ke database");
      // Fallback: simpan ke localStorage saja
      const next = { ...configs, [draft.objectName]: { ...draft, updatedAt: new Date().toISOString() } };
      writeMapObjectConfigs(next);
      setConfigs(next);
      setDraft(next[draft.objectName]);
    } finally {
      setSaving(false);
    }
  };

  return <div className="content-box admin-map-box admin-object-editor">
    <div className="box-header admin-map-header"><div className="box-title"><h2>Editor lokasi 3D Terminal 1</h2><p>Pilih area T1-GF, tenant, Avsec, toilet, nursery, MAN, atau musholla untuk mengatur identitas dan operasional.</p></div><div className="admin-map-summary"><span><Layers3 size={15} /> T1 &bull; Ground Floor</span><strong>{editableObjects.length} objek dapat diatur</strong></div></div>
    <div className="admin-map-canvas admin-3d-editor-canvas"><Canvas dpr={[1, 1.5]} camera={{ fov: 55, near: 0.01, far: 100000, position: [20, 20, 20] }}><color attach="background" args={["#102d3d"]} /><ambientLight intensity={0.9} /><hemisphereLight intensity={1.1} color="#ffffff" groundColor="#65747d" /><directionalLight position={[12, 24, 10]} intensity={1.7} /><Suspense fallback={null}><SceneModel selectedUuid={selected?.uuid ?? null} onSelect={selectObject} onReady={handleReady} objectConfigs={configs} /></Suspense><AdminCamera bounds={bounds} /></Canvas>{!bounds && <div className="admin-3d-loading">Memuat model GLB...</div>}</div>
    <div className="admin-object-editor-layout"><aside className="admin-object-list"><div className="admin-object-list-header"><strong>Objek editable</strong><span>{editableObjects.length}</span></div><div className="admin-object-list-scroll">{editableObjects.map((record) => <button type="button" key={record.uuid} className={record.uuid === selected?.uuid ? "is-selected" : ""} onClick={() => selectRecord(record)}><strong>{configs[record.name]?.displayName || record.selectableLabel || record.name}</strong><small>{record.name} &bull; {configs[record.name]?.occupancy === "WALKABLE" ? "Bisa dilalui" : configs[record.name]?.occupancy === "OBSTACLE" ? "Obstacle" : record.metadata.category}</small></button>)}</div></aside>
      <section className="admin-object-form">{!draft ? <div className="admin-object-empty"><ImageIcon size={22} /><strong>Pilih objek dari model</strong><span>Data tenant/fasilitas, jam aktif, foto, dan status rute akan muncul di sini.</span></div> : <><div className="admin-object-form-heading"><div><small>OBJEK TERPILIH</small><h3>{selected?.name}</h3></div><span className="admin-object-pill">{draft.entityType === "TENANT" ? "Tenant" : "Fasilitas"}</span></div><div className="admin-object-form-grid">
        <EditorField label="Nama tampilan"><input value={draft.displayName} onChange={(event) => updateDraft("displayName", event.target.value)} placeholder="Contoh: Kopi Juanda" /></EditorField>
        <EditorField label="Jenis data"><select value={draft.entityType} onChange={(event) => updateDraft("entityType", event.target.value as MapObjectConfig["entityType"])}><option value="TENANT">Tenant komersial</option><option value="FACILITY">Fasilitas / layanan</option></select></EditorField><EditorField label="Warna objek"><span className="admin-object-color-field"><input type="color" value={draft.color || "#D8C7A7"} onChange={(event) => updateDraft("color", event.target.value)} /><input value={draft.color} onChange={(event) => updateDraft("color", event.target.value)} placeholder="#D8C7A7" pattern="^#[0-9a-fA-F]{6}$" /></span></EditorField>
        <EditorField label="Status bentuk lokasi"><select value={draft.occupancy} onChange={(event) => updateDraft("occupancy", event.target.value as MapObjectOccupancy)}>{OCCUPANCY_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></EditorField><div className="admin-object-occupancy-help">{OCCUPANCY_OPTIONS.find((option) => option.value === draft.occupancy)?.help}</div>
        <div className="admin-object-doors"><div className="admin-object-doors-heading"><strong>Pintu masuk (maksimal 4)</strong><span>Rute hanya boleh masuk dari pintu yang terbuka. Posisi 0% dan 100% adalah kedua ujung sisi; 50% adalah titik tengah sisi.</span></div>{draft.entryDoors.map((door, index) => <div className="admin-object-door-row" key={`${draft.objectName}-door-${index}`}><strong>Pintu {index + 1}</strong><select value={door.side} onChange={(event) => updateDoor(index, "side", event.target.value as MapObjectDoorSide)}><option value="NORTH">Utara</option><option value="EAST">Timur</option><option value="SOUTH">Selatan</option><option value="WEST">Barat</option></select><label><input type="checkbox" checked={door.open} onChange={(event) => updateDoor(index, "open", event.target.checked)} /> Buka</label><label className="admin-object-door-position">Posisi <input type="range" min="0" max="100" value={door.position} aria-label={`Posisi pintu ${index + 1}`} onChange={(event) => updateDoor(index, "position", event.target.value)} /><span>{door.position}%</span></label></div>)}</div>
        <EditorField label="Deskripsi / detail"><textarea rows={4} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} placeholder="Layanan, akses, dan informasi penting." /></EditorField>
        <EditorField label="Foto tampak depan (URL)"><input type="url" value={draft.photoUrl} onChange={(event) => updateDraft("photoUrl", event.target.value)} placeholder="URL gambar langsung atau link Google Drive" /><small className="admin-object-field-help">Untuk Google Drive, ubah akses file menjadi â€œAnyone with the link / Siapa saja yang memiliki link dapat melihatâ€.</small></EditorField>
        <EditorField label="Website / sosial media"><input type="url" value={draft.websiteUrl} onChange={(event) => updateDraft("websiteUrl", event.target.value)} placeholder="https://..." /></EditorField><EditorField label="Instagram / link lain"><input type="url" value={draft.instagramUrl} onChange={(event) => updateDraft("instagramUrl", event.target.value)} placeholder="https://instagram.com/..." /></EditorField>
        <EditorField label="Kontak"><input value={draft.contact} onChange={(event) => updateDraft("contact", event.target.value)} placeholder="Telepon / email" /></EditorField><EditorField label="Jam buka"><input type="time" value={draft.openTime} onChange={(event) => updateDraft("openTime", event.target.value)} /></EditorField><EditorField label="Jam tutup"><input type="time" value={draft.closeTime} onChange={(event) => updateDraft("closeTime", event.target.value)} /></EditorField><EditorField label="Masa aktif mulai"><input type="date" value={draft.activeFrom} onChange={(event) => updateDraft("activeFrom", event.target.value)} /></EditorField><EditorField label="Masa aktif sampai"><input type="date" value={draft.activeUntil} onChange={(event) => updateDraft("activeUntil", event.target.value)} /></EditorField>
      </div>{getMapObjectPhotoUrl(draft.photoUrl) && <img className="admin-object-photo-preview" src={getMapObjectPhotoUrl(draft.photoUrl)} alt={`Foto ${draft.displayName || draft.objectName}`} onError={(event) => { event.currentTarget.style.display = "none"; }} />}<div className="admin-object-form-actions"><button type="button" className="primary-button" onClick={saveDraft} disabled={saving}><Save size={15} /> {saving ? "Menyimpan..." : "Simpan konfigurasi"}</button>{saved && !saveError && <span className="admin-object-saved"><Check size={14} /> Tersimpan ke database</span>}{saveError && <span className="admin-object-saved" style={{color:"#e05252",fontSize:"12px"}}>{saveError} (tersimpan lokal)</span>}</div></>}</section></div>
  </div>;
}

