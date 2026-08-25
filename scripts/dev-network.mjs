import { networkInterfaces } from "node:os";
import { spawn } from "node:child_process";
import path from "node:path";

const interfaces = networkInterfaces();
const candidates = Object.entries(interfaces).flatMap(([name, addresses]) =>
  (addresses ?? [])
    .filter((address) => address.family === "IPv4" && !address.internal)
    .map((address) => ({ name, address: address.address })),
);
const preferred = candidates.find(({ name }) => /wi-?fi|wireless|wlan/i.test(name))
  ?? candidates.find(({ address }) => /^192\.168\.(?!56\.)/.test(address))
  ?? candidates[0];
const port = process.env.PORT ?? "3000";

console.log("\nAirport Wayfinding akan tersedia di:");
console.log(`  Lokal   : http://localhost:${port}`);
if (preferred) console.log(`  Jaringan: http://${preferred.address}:${port}`);
console.log("  Pastikan perangkat lain terhubung ke Wi-Fi yang sama.\n");

const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "dev", "--hostname", "0.0.0.0", "--port", port], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
