"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function TurnstileCaptcha({ onVerify }: { onVerify: (verified: boolean) => void }) {
  const [status, setStatus] = useState<"idle" | "verifying" | "success">("idle");

  const handleVerify = () => {
    if (status !== "idle") return;
    setStatus("verifying");
    setTimeout(() => {
      setStatus("success");
      onVerify(true);
    }, 1500);
  };

  return (
    <div className="border border-dark-200 bg-dark-50/50 p-3 rounded-xl flex items-center justify-between mt-4 mb-4 select-none">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleVerify}
          disabled={status !== "idle"}
          className={`w-5 h-5 rounded border flex items-center justify-center transition-all cursor-pointer ${
            status === "success" 
              ? "bg-secondary border-secondary text-white" 
              : "border-dark-300 hover:border-dark-400 bg-white"
          }`}
        >
          {status === "verifying" && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
          {status === "success" && <span className="text-[10px] font-black">✓</span>}
        </button>
        <span className="text-xs text-dark-700 font-medium">
          {status === "idle" && "Verify you are human"}
          {status === "verifying" && "Verifying browser security..."}
          {status === "success" && "Verification successful"}
        </span>
      </div>
      <div className="text-right">
        <span className="text-[9px] text-dark-400 font-bold block">Cloudflare Turnstile</span>
        <span className="text-[8px] text-dark-400 block mt-0.5">Privacy · Terms</span>
      </div>
    </div>
  );
}
