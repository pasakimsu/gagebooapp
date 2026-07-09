"use client";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("userId");
    if (!user) {
      window.location.href = "/login"; // ✅ 즉시 리디렉션 (시크릿 모드 포함 완전 차단)
      return null;
    }
  }

  return <>{children}</>;
}
