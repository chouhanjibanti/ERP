"use client";

import dynamic from "next/dynamic";

const ExistingErpApp = dynamic(() => import("../../src/App.jsx"), {
  ssr: false,
  loading: () => (
    <main className="app-loading" aria-live="polite">
      Loading EduPulse ERP...
    </main>
  ),
});

export default function ErpClient() {
  return <ExistingErpApp />;
}
