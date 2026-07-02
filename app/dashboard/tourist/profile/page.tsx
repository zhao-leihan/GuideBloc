"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Save, Loader2, Plus, Trash2, Shield, User as UserIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { COUNTRIES } from "@/lib/countries";

export default function TouristProfilePage() {
  const { update: updateSession } = useSession();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [idCardNumber, setIdCardNumber] = useState("");
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
        setPassportNumber(data.passportNumber || "");
        setIdCardNumber(data.idCardNumber || "");
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
            <div className="lg:col-span-2 card p-6 space-y-5">
              <div className="flex items-center gap-4 pb-2 border-b border-dark-100">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                  {name ? name[0] : "?"}
                </div>
                <div>
                  <h3 className="font-bold text-dark-900">Personal Information</h3>
                  <p className="text-xs text-dark-400">Used for automated tour bookings and receipts</p>
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
                  <label className="block text-xs font-bold text-dark-600 uppercase tracking-wider mb-1.5">Passport Number</label>
                  <input 
                    className="input" 
                    value={passportNumber} 
                    onChange={(e) => setPassportNumber(e.target.value)} 
                    placeholder="E.g. A1234567" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark-600 uppercase tracking-wider mb-1.5">ID Card Number (KTP / NIK)</label>
                  <input 
                    className="input" 
                    value={idCardNumber} 
                    onChange={(e) => setIdCardNumber(e.target.value)} 
                    placeholder="E.g. 3273xxxxxxxxxxxx" 
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
