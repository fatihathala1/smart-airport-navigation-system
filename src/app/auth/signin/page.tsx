"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { LockKeyhole } from "lucide-react";
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
      <Link href="/" className="signin-brand"><span className="brand-mark">JUA</span><span><strong>Wayfinding</strong><small>Portal admin</small></span></Link>
      <section className="signin-panel">
        <LockKeyhole size={28} />
        <h1>Masuk sebagai admin</h1>
        <p>Akun dibuat oleh Super Admin. Penumpang tidak memerlukan akun.</p>
        <form onSubmit={submit} noValidate>
          <label><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></label>
          <label><span>Kata sandi</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" minLength={12} required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" disabled={pending}>{pending ? "Memeriksa..." : "Masuk"}</button>
        </form>
        <Link href="/">Kembali ke peta publik</Link>
      </section>
    </main>
  );
}
