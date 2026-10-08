"use client";

import { useState } from "react";
import SettingsForm from "@/components/admin/SettingsForm";

export default function AdminCmsPage() {
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Site settings</h1>
        <p className="mt-1 text-sm text-white/50">
          Branding, notice bar, contact details, and operating hours.
        </p>
      </div>

      {toast && (
        <div className="rounded-xl bg-neon/10 px-4 py-2 text-sm font-medium text-neon ring-1 ring-neon/40">
          {toast}
        </div>
      )}

      <SettingsForm
        onSaved={(message) => {
          setToast(message);
          setTimeout(() => setToast(null), 3000);
        }}
      />
    </div>
  );
}