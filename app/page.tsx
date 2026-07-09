"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, collection, getDocs, query, where, addDoc } from "../lib/firebase";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // ✅ admin 계정 자동 생성 (없을 경우)
  useEffect(() => {
    const createAdminIfMissing = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("userId", "==", "admin"));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          await addDoc(usersRef, { userId: "admin", password: "admin" });
          console.log("Admin account created.");
        }
      } catch (err) {
        console.error("Admin creation failed:", err);
      }
    };
    createAdminIfMissing();
  }, []);

  const handleLogin = async () => {
    setError("");

    if (!userId || !password) {
      setError("아이디와 비밀번호를 입력하세요.");
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("userId", "==", userId),
        where("password", "==", password)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        localStorage.setItem("userId", userId);
        const saved = localStorage.getItem("userId");
        if (saved === userId) {
          router.push("/budget");
        } else {
          alert("⚠️ 로그인 상태 저장에 실패했습니다. 다시 시도해주세요.");
        }
      } else {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch (err) {
      console.error("로그인 오류:", err);
      setError("로그인 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-beige dark:bg-beigeDark px-4 transition-colors">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin(); // ✅ Enter 키 또는 버튼 클릭 시 실행됨
        }}
        className="bg-cream dark:bg-[#2f2a25] p-8 rounded-xl shadow-md w-full max-w-md transition-colors"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-darkText dark:text-white">
          로그인
        </h2>

        <input
          type="text"
          placeholder="아이디"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full p-3 mb-3 border border-brownBorder rounded bg-white placeholder-gray-500 text-darkText"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-3 border border-brownBorder rounded bg-white placeholder-gray-500 text-darkText"
        />

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <button
          type="submit"
          className="w-full bg-beigeLight text-darkText font-semibold py-3 px-4 rounded-md shadow hover:brightness-105 active:scale-95 transition duration-150"
        >
          로그인
        </button>
      </form>
    </div>
  );
}
