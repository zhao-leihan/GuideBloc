"use client";
 
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Save, Loader2, Plus, Trash2, Shield, User as UserIcon, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { COUNTRIES } from "@/lib/countries";
 
export default function TouristProfilePage() {
  const { update: updateSession } = useSession();
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

  const [birthDate, setBirthDate] = useState("");
  const [title, setTitle] = useState("Mr");
  const [age, setAge] = useState("");
  
  const [savedMembers, setSavedMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
 
  // States for adding a new saved member
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberTitle, setNewMemberTitle] = useState("Mr");
  const [newMemberPassport, setNewMemberPassport] = useState("");
  const [newMemberIdCard, setNewMemberIdCard] = useState("");
  const [newMemberBirthDate, setNewMemberBirthDate] = useState("");
  const [newMemberAge, setNewMemberAge] = useState("");
  const [addingMember, setAddingMember] = useState(false);
 
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
        setBirthDate(data.birthDate ? data.birthDate.split("T")[0] : "");
        setTitle(data.title || "Mr");
        setAge(data.age ? data.age.toString() : "");
        setSavedMembers(data.savedMembers || []);
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
          idCardNumber,
          birthDate,
          title,
          age: age ? parseInt(age) : null
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
    if (!passportNumber || !passportPhoto || !idCardNumber || !idCardPhoto) {
      toast.error("Please fill in document numbers and upload photographs");
      return;
    }
    setIsVerifying(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "PENDING",
          passportNumber,
          passportPhoto,
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

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      toast.error("Companion name is required");
      return;
    }
    setAddingMember(true);
    try {
      const res = await fetch("/api/users/profile/saved-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMemberName,
          title: newMemberTitle,
          passportNumber: newMemberPassport,
          idCardNumber: newMemberIdCard,
          birthDate: newMemberBirthDate || null,
          age: newMemberAge ? parseInt(newMemberAge) : null
        }),
      });

      if (res.ok) {
        toast.success("Saved companion added successfully!");
        setNewMemberName("");
        setNewMemberTitle("Mr");
        setNewMemberPassport("");
        setNewMemberIdCard("");
        setNewMemberBirthDate("");
        setNewMemberAge("");
        fetchProfile();
      } else {
        toast.error("Failed to add companion");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error adding companion");
    } finally {
      setAddingMember(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Are you sure you want to delete this companion?")) return;
    try {
      const res = await fetch(`/api/users/profile/saved-members?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Companion deleted successfully");
        fetchProfile();
      } else {
        toast.error("Failed to delete companion");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting companion");
    }
  };

  return (
    <DashboardLayout role="tourist">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Profile</h1>
          <p className="text-dark-500">Manage your personal details and travel companions</p>
        </div>
        
        {loading ? (
          <div className="card p-12 text-center text-dark-500">Loading profile...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Tourist Details Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information Card */}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-dark-600 uppercase tracking-wider mb-1.5">Salutation</label>
                    <select 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      className="input"
                    >
                      <option value="Mr">Mr.</option>
                      <option value="Mrs">Mrs.</option>
                      <option value="Ms">Ms.</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-dark-600 uppercase tracking-wider mb-1.5">Full Name (as in ID/Passport)</label>
                    <input 
                      className="input" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Your Name" 
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-dark-600 uppercase tracking-wider mb-1.5">Birth Date</label>
                    <input 
                      type="date"
                      className="input" 
                      value={birthDate} 
                      onChange={(e) => setBirthDate(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-dark-600 uppercase tracking-wider mb-1.5">Age</label>
                    <input 
                      type="number"
                      className="input" 
                      value={age} 
                      onChange={(e) => setAge(e.target.value)} 
                      placeholder="Your Age"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-dark-600 uppercase tracking-wider mb-1.5">Country</label>
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
                  <div>
                    <label className="block text-xs font-bold text-dark-600 uppercase tracking-wider mb-1.5">Bio</label>
                    <textarea 
                      className="input min-h-[80px]" 
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)} 
                      placeholder="Tell us about yourself..." 
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 py-2.5 px-6 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Profile Details
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Passport Card */}
                      <div className="p-4 border border-dark-200 rounded-2xl bg-white space-y-3.5">
                        <h4 className="font-bold text-dark-800 text-sm">Passport Verification</h4>
                        <input 
                          type="text"
                          className="input text-xs"
                          value={passportNumber}
                          onChange={e => setPassportNumber(e.target.value)}
                          placeholder="Passport Number (e.g. A123456)"
                        />
                        
                        <div className="border border-dashed border-dark-300 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-dark-50 transition-colors relative min-h-[120px]">
                          {passportPhoto ? (
                            <>
                              <img src={passportPhoto} alt="Passport Preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setPassportPhoto(null); }}
                                className="absolute top-2 right-2 bg-red-650 hover:bg-red-800 text-white rounded-full p-1 shadow-md z-10 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                              <Plus className="w-5 h-5 text-dark-400 mb-1" />
                              <span className="text-[10px] font-bold text-dark-500 uppercase tracking-wider">Upload Passport Photo</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const r = new FileReader();
                                    r.onloadend = () => setPassportPhoto(r.result as string);
                                    r.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* KTP Card */}
                      <div className="p-4 border border-dark-200 rounded-2xl bg-white space-y-3.5">
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
                    </div>

                    <button
                      type="button"
                      onClick={handleStartVerification}
                      disabled={!passportNumber || !passportPhoto || !idCardNumber || !idCardPhoto || isVerifying}
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
                        Please wait while the Super Admin reviews your uploaded documents. This process usually takes up to 24 hours.
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

            {/* Right: Saved Companions Management */}
            <div className="space-y-6">
              {/* List of Saved Companions */}
              <div className="card p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-dark-100">
                  <UserIcon className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-dark-900">Saved Companions</h3>
                </div>

                {savedMembers.length === 0 ? (
                  <p className="text-xs text-dark-400 text-center py-4">No saved companions yet. Add them below or they will be automatically saved when booking a group tour.</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {savedMembers.map((member) => (
                      <div key={member.id} className="bg-dark-50 border border-dark-100 rounded-xl p-3 flex justify-between items-center group">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-dark-900 truncate">
                            {member.title ? `${member.title}. ` : ""}{member.name}
                          </p>
                          <div className="text-[10px] text-dark-400 space-y-0.5 mt-0.5">
                            {member.passportNumber && <p>Passport: {member.passportNumber}</p>}
                            {member.idCardNumber && <p>ID Card: {member.idCardNumber}</p>}
                            {member.age && <p>Age: {member.age} years old</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-1.5 text-dark-400 hover:text-danger rounded-lg hover:bg-danger-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Delete Companion"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Companion Form */}
              <div className="card p-6">
                <div className="flex items-center gap-2 pb-2 border-b border-dark-100 mb-4">
                  <Plus className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-dark-900">Add Companion</h3>
                </div>

                <form onSubmit={handleAddMember} className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-dark-600 uppercase tracking-wider mb-1">Salutation</label>
                      <select 
                        value={newMemberTitle} 
                        onChange={(e) => setNewMemberTitle(e.target.value)} 
                        className="input text-xs py-2 px-2"
                      >
                        <option value="Mr">Mr.</option>
                        <option value="Mrs">Mrs.</option>
                        <option value="Ms">Ms.</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-dark-600 uppercase tracking-wider mb-1">Full Name</label>
                      <input 
                        className="input text-xs py-2" 
                        value={newMemberName} 
                        onChange={(e) => setNewMemberName(e.target.value)} 
                        placeholder="Name" 
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-dark-600 uppercase tracking-wider mb-1">Passport</label>
                      <input 
                        className="input text-xs py-2" 
                        value={newMemberPassport} 
                        onChange={(e) => setNewMemberPassport(e.target.value)} 
                        placeholder="Passport" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-dark-600 uppercase tracking-wider mb-1">ID Card</label>
                      <input 
                        className="input text-xs py-2" 
                        value={newMemberIdCard} 
                        onChange={(e) => setNewMemberIdCard(e.target.value)} 
                        placeholder="ID Card" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-dark-600 uppercase tracking-wider mb-1">Birth Date</label>
                      <input 
                        type="date"
                        className="input text-xs py-2" 
                        value={newMemberBirthDate} 
                        onChange={(e) => setNewMemberBirthDate(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-dark-600 uppercase tracking-wider mb-1">Age</label>
                      <input 
                        type="number"
                        className="input text-xs py-2" 
                        value={newMemberAge} 
                        onChange={(e) => setNewMemberAge(e.target.value)} 
                        placeholder="Age" 
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={addingMember}
                    className="btn-primary w-full py-2.5 text-xs font-bold mt-2 flex items-center justify-center gap-1.5"
                  >
                    {addingMember ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Add to Companions
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
