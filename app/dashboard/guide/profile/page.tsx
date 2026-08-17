"use client";
 
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSession } from "next-auth/react";
import { Save, Loader2, Shield, Trash2, Plus, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { COUNTRIES } from "@/lib/countries";
 
export default function GuideProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  
  // Verification states
  const [passportNumber, setPassportNumber] = useState("");
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
  const [idCardNumber, setIdCardNumber] = useState("");
  const [idCardPhoto, setIdCardPhoto] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState("NONE");
  const [verificationRejectReason, setVerificationRejectReason] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

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
        setAvatar(data.avatar || null);
        setPassportNumber(data.passportNumber || "");
        setPassportPhoto(data.passportPhoto || null);
        setIdCardNumber(data.idCardNumber || "");
        setIdCardPhoto(data.idCardPhoto || null);
        setVerificationStatus(data.verificationStatus || "NONE");
        setVerificationRejectReason(data.verificationRejectReason || null);
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
        body: JSON.stringify({ 
          name, 
          bio, 
          country, 
          avatar,
          passportNumber,
          idCardNumber
        }),
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

  const handleStartVerification = async () => {
    if (!idCardNumber || !idCardPhoto) {
      toast.error("Please fill in ID card number and upload a photograph");
      return;
    }
    setIsVerifying(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "PENDING",
          idCardNumber,
          idCardPhoto,
        }),
      });

      if (res.ok) {
        setVerificationStatus("PENDING");
        setVerificationRejectReason(null);
        toast.success("Documents submitted successfully! Waiting for Admin approval.");
        await updateSession();
      } else {
        toast.error("Failed to submit verification documents");
      }
    } catch (err) {
      console.error(err);
      toast.error("Verification connection error");
    } finally {
      setIsVerifying(false);
    }
  };
  const handleResetVerification = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "NONE",
          verificationRejectReason: null,
        }),
      });
      if (res.ok) {
        setVerificationStatus("NONE");
        setVerificationRejectReason(null);
        toast.success("Verification state reset successfully!");
        await updateSession();
      } else {
        toast.error("Failed to reset verification");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error resetting verification");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <DashboardLayout role="guide">
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Profile</h1>
          <p className="text-dark-500">Edit your public profile and identity credentials</p>
        </div>
        
        {loading ? (
          <div className="card p-12 text-center text-dark-500">Loading profile...</div>
        ) : (
          <div className="space-y-6">
            {/* Personal Details Card */}
            <div className="card p-6 space-y-5">
              <div className="flex items-center gap-4 pb-4 border-b border-dark-100">
                <div className="relative group cursor-pointer">
                  {avatar ? (
                    <img src={avatar} alt="Profile Photo" className="w-16 h-16 rounded-full object-cover border border-dark-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                      {name ? name[0] : "?"}
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold cursor-pointer">
                    Edit
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setAvatar(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <div>
                  <h3 className="font-bold text-dark-900">Personal Information</h3>
                  <p className="text-xs text-dark-400">Upload profile photo by hovering and clicking &quot;Edit&quot;</p>
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

            {/* Identity Verification Card */}
            <div className="card p-6 space-y-5">
              <div className="flex items-center gap-4 pb-2 border-b border-dark-100">
                <Shield className="w-6 h-6 text-primary animate-pulse" />
                <div>
                  <h3 className="font-bold text-dark-900 font-display">Identity Verification</h3>
                  <p className="text-xs text-dark-400">Verify your KTP and Passport documents</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-dark-200 bg-dark-50/50">
                <span className="text-xs font-bold text-dark-600 uppercase tracking-wider">Verification Status</span>
                <span className={cn(
                  "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                  verificationStatus === "APPROVED" ? "bg-green-100 text-green-700" :
                  verificationStatus === "PENDING" ? "bg-yellow-100 text-yellow-700 animate-pulse" :
                  verificationStatus === "REJECTED" ? "bg-red-100 text-red-700" :
                  "bg-dark-100 text-dark-600"
                )}>
                  {verificationStatus || "NOT VERIFIED"}
                </span>
              </div>

              {verificationStatus === "REJECTED" && verificationRejectReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 leading-relaxed font-medium">
                  <strong>Verification failed:</strong> {verificationRejectReason} Please check the inputs and upload clear document photos to try again.
                </div>
              )}

              {verificationStatus === "APPROVED" && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-green-800 text-sm">Identity Verified Successfully</h4>
                    <p className="text-xs text-green-600 mt-0.5 leading-relaxed">
                      Your identity documents have been checked and approved by system verification.
                    </p>
                  </div>
                </div>
              )}

              {(verificationStatus === "NONE" || verificationStatus === "REJECTED") && (
                <div className="space-y-4">
                  {/* KTP Card */}
                  <div className="p-4 border border-dark-200 rounded-2xl bg-white space-y-3.5 max-w-md mx-auto w-full">
                    <h4 className="font-bold text-dark-800 text-sm">KTP (ID Card) Verification</h4>
                    <input 
                      type="text"
                      className="input text-xs"
                      value={idCardNumber}
                      onChange={e => setIdCardNumber(e.target.value)}
                      placeholder="NIK / ID Number (e.g. 3273...)"
                    />
                    
                    <div className="border border-dashed border-dark-300 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-dark-50 transition-colors relative min-h-[120px]">
                      {idCardPhoto ? (
                        <>
                          <img src={idCardPhoto} alt="KTP Preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                          <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); setIdCardPhoto(null); }}
                            className="absolute top-2 right-2 bg-red-650 hover:bg-red-800 text-white rounded-full p-1 shadow-md z-10 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                          <Plus className="w-5 h-5 text-dark-400 mb-1" />
                          <span className="text-[10px] font-bold text-dark-500 uppercase tracking-wider">Upload KTP Photo</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const r = new FileReader();
                                r.onloadend = () => setIdCardPhoto(r.result as string);
                                r.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartVerification}
                    disabled={!idCardNumber || !idCardPhoto || isVerifying}
                    className="w-full btn-primary py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Documents...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" /> Submit Documents for Verification
                      </>
                    )}
                  </button>
                </div>
              )}

              {verificationStatus === "PENDING" && (
                <div className="p-8 text-center space-y-4 border border-dark-100 rounded-2xl bg-dark-50/20">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <h4 className="font-bold text-dark-900 text-sm">Verification Pending Approval</h4>
                    <p className="text-xs text-dark-500 mt-1 max-w-xs mx-auto leading-relaxed">
                      Please wait while the Super Admin reviews your uploaded KTP/document. This process usually takes up to 24 hours.
                    </p>
                    <button
                      onClick={handleResetVerification}
                      className="text-xs text-primary hover:underline font-semibold mt-4 block mx-auto cursor-pointer"
                    >
                      Cancel & Reset Verification
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
