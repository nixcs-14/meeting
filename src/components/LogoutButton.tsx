"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded-md border border-ms-border bg-white px-3 py-1.5 text-xs font-semibold text-ms-text transition-colors hover:bg-ms-bg disabled:opacity-60 sm:text-sm"
    >
      {loading ? "…" : "Se déconnecter"}
    </button>
  );
}
