"use client";

import { useEffect, useState } from "react";
import { Trophy, Award, Star, Compass, Loader2 } from "lucide-react";

interface GuideRank {
  id: string;
  name: string;
  avatar: string | null;
  level: number;
  xp: number;
  country: string | null;
}

export default function Leaderboard() {
  const [guides, setGuides] = useState<GuideRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/guide/leaderboard");
        if (res.ok) {
          const data = await res.json();
          setGuides(data);
        }
      } catch (err) {
        console.error("Leaderboard fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-dark-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span>Loading rankings...</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-dark-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-dark-100 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-dark-900 text-lg">Top Guide Rankings</h3>
        </div>
        <span className="text-xs text-dark-400 font-semibold tracking-wide uppercase">Global</span>
      </div>

      <div className="divide-y divide-dark-100">
        {guides.map((guide, idx) => {
          const rank = idx + 1;
          return (
            <div key={guide.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  rank === 1 
                    ? "bg-amber-500 text-white" 
                    : rank === 2 
                    ? "bg-slate-300 text-dark-800" 
                    : rank === 3 
                    ? "bg-amber-700 text-white" 
                    : "bg-dark-100 text-dark-500"
                }`}>
                  {rank}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-dark-200 bg-dark-50 flex-shrink-0">
                  <img 
                    src={guide.avatar || "/assets/default-avatar.png"} 
                    alt={guide.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>

                <div>
                  <h4 className="font-bold text-dark-900 text-sm flex items-center gap-1.5">
                    {guide.name}
                    {rank <= 3 && <Award className="w-3.5 h-3.5 text-primary" />}
                  </h4>
                  <span className="text-xs text-dark-400">{guide.country || "Explorer"}</span>
                </div>
              </div>

              {/* Level & XP */}
              <div className="text-right space-y-0.5">
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-bold">
                  <Star className="w-3 h-3 fill-current" /> Lvl {guide.level}
                </span>
                <p className="text-[10px] font-mono text-dark-400">{guide.xp % 1000}/1000 XP</p>
              </div>
            </div>
          );
        })}

        {guides.length === 0 && (
          <div className="text-center text-dark-400 py-6 text-sm">
            No guides found in leaderboard.
          </div>
        )}
      </div>
    </div>
  );
}
