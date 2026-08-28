"use client";

import ToastProvider from "../../components/admin/ToastProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
