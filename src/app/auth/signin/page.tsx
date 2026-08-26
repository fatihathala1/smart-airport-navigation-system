"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { ArrowLeft, LockKeyhole, ShieldCheck, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setPending(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setPending(false);
    if (result?.error) { setError("Email atau kata sandi tidak sesuai."); return; }
    router.push("/admin");
    router.refresh();
  }
  return (
    <main className="signin-shell">
      <section className="signin-intro">
        <Link href="/" className="signin-brand">
          <Image className="admin-brand-logo" src="/injourney-airports-white.png" width={253} height={121} alt="InJourney Airports" priority />
          <span><strong>Wayfinding</strong><small>Portal manajemen operasional</small></span>
        </Link>

        <div className="signin-intro-copy">
          <span className="signin-eyebrow">BANDARA INTERNASIONAL JUANDA</span>
          <h1>Satu portal, akses sesuai tanggung jawab.</h1>
          <p>Role dikenali otomatis dari akun. Setelah masuk, setiap admin hanya melihat fitur yang menjadi kewenangannya.</p>
        </div>

        <div className="signin-role-list" aria-label="Jenis akses administrator">
          <div>
            <span><Store size={20} /></span>
            <p><strong>Admin Komersil</strong><small>Kelola tenant, ruang, fasilitas, dan pantau peta terminal.</small></p>
          </div>
          <div>
            <span><ShieldCheck size={20} /></span>
            <p><strong>Superadmin</strong><small>Kelola akun, keamanan, navigation graph, audit log, dan peta.</small></p>
          </div>
        </div>
      </section>

      <section className="signin-panel">
        <div className="signin-lock-icon"><LockKeyhole size={24} /></div>
        <span className="signin-panel-kicker">PORTAL ADMIN</span>
        <h2>Selamat datang kembali</h2>
        <p>Masukkan akun Admin Komersil atau Superadmin untuk melanjutkan.</p>
        <form onSubmit={submit} noValidate>
          <label htmlFor="admin-email"><span>Email resmi</span></label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            placeholder="nama@juanda-airport.com"
            required
          />
          <label htmlFor="admin-password"><span>Kata sandi</span></label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            minLength={12}
            required
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" disabled={pending}>{pending ? "Memeriksa akun..." : "Masuk ke Dashboard"}</button>
        </form>
        <p className="signin-security-note"><ShieldCheck size={14} /> Akses dashboard ditentukan oleh role pada akun.</p>
        <Link href="/" className="signin-back-link"><ArrowLeft size={15} /> Kembali ke peta pengunjung</Link>
      </section>
    </main>
  );
}
