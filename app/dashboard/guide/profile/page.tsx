"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSession } from "next-auth/react";
import { Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { COUNTRIES } from "@/lib/countries";

export default function GuideProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/users/profile");
      if (res.ok) {
        const data = await res.json();
        setName(data.name || "");
        setBio(data.bio || "");
        setCountry(data.country || "");
      } else {
        toast.error("Failed to load profile details");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, country }),
      });

      if (res.ok) {
        toast.success("Profile updated successfully!");
        await updateSession();
      } else {
        toast.error("Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="guide">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Profile</h1>
          <p className="text-dark-500">Edit your public profile</p>
        </div>
        
        {loading ? (
          <div className="card p-12 text-center text-dark-500">Loading profile...</div>
        ) : (
          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                {name ? name[0] : "?"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Full Name</label>
              <input 
                className="input" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Bio</label>
              <textarea 
                className="input min-h-[100px]" 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                placeholder="Write your professional bio..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Country</label>
              <select 
                className="input" 
                value={country} 
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">Select Country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2 py-2.5 px-5 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
