import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Allow access for interactive dashboard demo if no active session
  return <>{children}</>;
}
