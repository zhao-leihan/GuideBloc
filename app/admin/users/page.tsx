"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Search, Shield, FileText, Check, X, Users as UsersIcon, ShieldAlert, UserX, UserCheck, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  country: string;
  joined: string;
  bookingsCount: number;
  guideStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  certificationText?: string;
  certificationFile?: string;
  isBlocked: boolean;
  verificationStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  verificationRejectReason?: string;
  idCardNumber?: string;
  idCardPhoto?: string;
  passportNumber?: string;
  passportPhoto?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedIdentityUser, setSelectedIdentityUser] = useState<User | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState("");
  const [warningUser, setWarningUser] = useState<User | null>(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [isSubmittingWarning, setIsSubmittingWarning] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        toast.error("Failed to load users");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading users");
    } finally {
      setLoading(false);
    }
  };

  const handleIdentityAction = async (userId: string, action: "APPROVE_IDENTITY" | "REJECT_IDENTITY", reason?: string) => {
    try {
      toast.loading(`${action === "APPROVE_IDENTITY" ? "Approving" : "Rejecting"} identity...`);
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, message: reason }),
      });

      toast.dismiss();
      if (res.ok) {
        toast.success(`Identity ${action === "APPROVE_IDENTITY" ? "approved" : "rejected"}!`);
        setSelectedIdentityUser(null);
        setShowRejectForm(false);
        setRejectReasonText("");
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update identity status");
      }
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error("Error updating identity status");
    }
  };

  const handleAction = async (userId: string, action: "APPROVE" | "REJECT") => {
    try {
      toast.loading(`${action === "APPROVE" ? "Approving" : "Rejecting"} guide application...`);
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });

      toast.dismiss();
      if (res.ok) {
        toast.success(`Guide application ${action === "APPROVE" ? "approved" : "rejected"}!`);
        setSelectedUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update guide status");
      }
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error("Error updating guide status");
    }
  };

  const handleBlockUnblock = async (userId: string, currentBlocked: boolean) => {
    try {
      const action = currentBlocked ? "UNBLOCK" : "BLOCK";
      toast.loading(`${action === "BLOCK" ? "Suspending" : "Activating"} user...`);
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });

      toast.dismiss();
      if (res.ok) {
        toast.success(`User successfully ${action === "BLOCK" ? "suspended" : "activated"}!`);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update user status");
      }
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error("Error updating user status");
    }
  };

  const handleSendWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningUser || !warningMessage.trim()) return;

    try {
      setIsSubmittingWarning(true);
      toast.loading("Sending warning letter...");
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: warningUser.id,
          action: "WARN",
          message: warningMessage.trim(),
        }),
      });

      toast.dismiss();
      if (res.ok) {
        toast.success("Warning notification sent successfully!");
        setWarningUser(null);
        setWarningMessage("");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to send warning");
      }
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error("Error sending warning");
    } finally {
      setIsSubmittingWarning(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-900">Users</h1>
            <p className="text-dark-500">Manage all platform users and pending guide approvals</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input 
            className="input pl-10" 
            placeholder="Search users by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="card overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-dark-500">Loading users...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-dark-50 border-b border-dark-200">
                <tr>
                  <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">User</th>
                  <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Country</th>
                  <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Bookings</th>
                  <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Joined</th>
                  <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Guide App Status</th>
                  <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Identity Verification</th>
                  <th className="text-left text-xs font-medium text-dark-500 px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-dark-50/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-dark-900 text-sm">{user.name}</p>
                        <p className="text-xs text-dark-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge text-xs ${
                        user.role === "ADMIN" ? "bg-red-500/10 text-red-500 font-bold" :
                        user.role === "GUIDE" ? "badge-primary font-semibold" : "badge-secondary"
                      }`}>{user.role}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-600">{user.country}</td>
                    <td className="px-6 py-4 text-sm text-dark-600">{user.bookingsCount}</td>
                    <td className="px-6 py-4 text-sm text-dark-600">{user.joined}</td>
                    <td className="px-6 py-4">
                      {user.isBlocked ? (
                        <span className="badge text-xs bg-red-500/10 text-red-600 font-bold">Suspended</span>
                      ) : (
                        <span className="badge text-xs bg-green-500/10 text-green-600 font-semibold">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.guideStatus !== "NONE" ? (
                        <span className={`badge text-xs font-semibold ${
                          user.guideStatus === "APPROVED" ? "bg-green-500/10 text-green-600" :
                          user.guideStatus === "PENDING" ? "bg-amber-500/10 text-amber-600 animate-pulse" :
                          "bg-red-500/10 text-red-600"
                        }`}>
                          {user.guideStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-dark-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.verificationStatus !== "NONE" ? (
                        <span className={`badge text-xs font-semibold ${
                          user.verificationStatus === "APPROVED" ? "bg-green-500/10 text-green-600" :
                          user.verificationStatus === "PENDING" ? "bg-amber-500/10 text-amber-600 animate-pulse" :
                          "bg-red-500/10 text-red-600"
                        }`}>
                          {user.verificationStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-dark-400">Unverified</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.guideStatus === "PENDING" && (
                          <button 
                            onClick={() => setSelectedUser(user)}
                            className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1 hover:border-primary/50 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" /> Review Application
                          </button>
                        )}
                        {user.verificationStatus === "PENDING" && (
                          <button 
                            onClick={() => setSelectedIdentityUser(user)}
                            className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1 hover:border-primary/50 cursor-pointer"
                          >
                          </button>
                        )}
                        {user.role !== "ADMIN" && (
                          <>
                            <button
                              onClick={() => setWarningUser(user)}
                              className="p-1.5 rounded-lg border border-yellow-250 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors cursor-pointer"
                              title="Send Warning Letter"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleBlockUnblock(user.id, user.isBlocked)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                user.isBlocked 
                                  ? "border-green-200 bg-green-50 text-green-600 hover:bg-green-100" 
                                  : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                              }`}
                              title={user.isBlocked ? "Activate User" : "Suspend User"}
                            >
                              {user.isBlocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* View Certification Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/60 backdrop-blur-sm p-4">
            <div className="card max-w-lg w-full bg-white p-6 rounded-2xl shadow-2xl relative">
              <button 
                onClick={() => setSelectedUser(null)} 
                className="absolute top-4 right-4 text-dark-400 hover:text-dark-600 text-lg"
              >
                &times;
              </button>
              <div className="flex items-center gap-3 border-b border-dark-100 pb-4 mb-4">
                <FileText className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-display font-bold text-dark-900 text-lg">Guide Application Review</h3>
                  <p className="text-xs text-dark-400">{selectedUser.name} &bull; {selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-dark-500 uppercase tracking-wider mb-2">Submitted Certification & Experience Details</p>
                  <div className="bg-dark-50 p-4 rounded-xl text-sm text-dark-800 font-sans border border-dark-100 whitespace-pre-wrap min-h-[120px] max-h-[240px] overflow-y-auto leading-relaxed">
                    {selectedUser.certificationText || "No certification text provided."}
                  </div>
                </div>

                {selectedUser.certificationFile ? (
                  <div>
                    <p className="text-xs font-bold text-dark-500 uppercase tracking-wider mb-2">Uploaded Certification Document</p>
                    <div className="bg-dark-50 p-4 rounded-xl border border-dark-100 flex flex-col items-center justify-center gap-3">
                      {selectedUser.certificationFile.startsWith("data:application/pdf") ? (
                        <div className="flex flex-col items-center gap-2 py-2 w-full text-center">
                          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mx-auto">
                            <FileText className="w-7 h-7" />
                          </div>
                          <span className="text-xs font-semibold text-dark-800">Certification Document (PDF)</span>
                          <a
                            href={selectedUser.certificationFile}
                            download={`${selectedUser.name.replace(/\s+/g, "_")}_certification.pdf`}
                            className="mt-1 inline-flex items-center gap-2 bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer"
                          >
                            Download / Open PDF
                          </a>
                        </div>
                      ) : selectedUser.certificationFile.startsWith("data:image/") ? (
                        <div className="flex flex-col items-center gap-3 w-full">
                          <div className="relative w-full max-h-48 overflow-hidden rounded-xl border border-dark-200 bg-white flex items-center justify-center p-2">
                            <img 
                              src={selectedUser.certificationFile} 
                              alt="Certification Preview" 
                              className="max-w-full max-h-40 object-contain rounded-lg"
                            />
                          </div>
                          <div className="flex gap-2 w-full">
                            <a
                              href={selectedUser.certificationFile}
                              download={`${selectedUser.name.replace(/\s+/g, "_")}_certification.png`}
                              className="flex-1 text-center bg-primary/10 text-primary hover:bg-primary/20 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                            >
                              Download Image
                            </a>
                            <a
                              href={selectedUser.certificationFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-center bg-dark-100 text-dark-700 hover:bg-dark-200 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                            >
                              Open Full View
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-2 w-full text-center">
                          <div className="w-12 h-12 bg-dark-100 text-dark-500 rounded-xl flex items-center justify-center mx-auto">
                            <FileText className="w-7 h-7" />
                          </div>
                          <span className="text-xs font-semibold text-dark-800">Attached File</span>
                          <a
                            href={selectedUser.certificationFile}
                            download="certification_document"
                            className="mt-1 inline-flex items-center gap-2 bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer"
                          >
                            Download File
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-dark-500 uppercase tracking-wider mb-2">Uploaded Certification Document</p>
                    <div className="bg-dark-50 p-4 rounded-xl border border-dark-100 text-center text-sm text-dark-400">
                      No certification file uploaded.
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4 border-t border-dark-100">
                  <button 
                    onClick={() => handleAction(selectedUser.id, "APPROVE")}
                    className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-3 font-semibold"
                  >
                    <Check className="w-4 h-4" /> Approve as Guide
                  </button>
                  <button 
                    onClick={() => handleAction(selectedUser.id, "REJECT")}
                    className="btn-danger flex-1 flex items-center justify-center gap-1.5 py-3 font-semibold"
                  >
                    <X className="w-4 h-4" /> Reject Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Identity Modal */}
        {selectedIdentityUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/60 backdrop-blur-sm p-4">
            <div className="card max-w-lg w-full bg-white p-6 rounded-2xl shadow-2xl relative">
              <button 
                onClick={() => {
                  setSelectedIdentityUser(null);
                  setShowRejectForm(false);
                  setRejectReasonText("");
                }} 
                className="absolute top-4 right-4 text-dark-400 hover:text-dark-600 text-lg cursor-pointer"
              >
                &times;
              </button>
              <div className="flex items-center gap-3 border-b border-dark-100 pb-4 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-display font-bold text-dark-900 text-lg">Identity Verification Review</h3>
                  <p className="text-xs text-dark-400">{selectedIdentityUser.name} &bull; {selectedIdentityUser.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* ID card info */}
                {selectedIdentityUser.idCardNumber && (
                  <div className="bg-dark-50 p-4 rounded-xl border border-dark-100 space-y-2">
                    <p className="text-xs font-bold text-dark-500 uppercase tracking-wider">KTP / NIK Number</p>
                    <p className="text-sm font-bold text-dark-900 font-mono bg-white px-2.5 py-1.5 rounded-lg border border-dark-150 inline-block">{selectedIdentityUser.idCardNumber}</p>
                    
                    {selectedIdentityUser.idCardPhoto ? (
                      <div className="mt-2.5 space-y-2">
                        <p className="text-xs font-bold text-dark-500 uppercase tracking-wider">KTP Document Photograph</p>
                        <div className="relative w-full max-h-60 overflow-hidden rounded-xl border border-dark-200 bg-white flex items-center justify-center p-2">
                          <img 
                            src={selectedIdentityUser.idCardPhoto} 
                            alt="KTP Document" 
                            className="max-w-full max-h-56 object-contain rounded-lg"
                          />
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={selectedIdentityUser.idCardPhoto}
                            download={`${selectedIdentityUser.name.replace(/\s+/g, "_")}_ktp.png`}
                            className="flex-1 text-center bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                          >
                            Download KTP
                          </a>
                          <a
                            href={selectedIdentityUser.idCardPhoto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center bg-dark-100 text-dark-700 hover:bg-dark-200 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                          >
                            Open Full View
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-dark-400 italic">No KTP photograph uploaded.</p>
                    )}
                  </div>
                )}

                {/* Passport info */}
                {selectedIdentityUser.passportNumber && (
                  <div className="bg-dark-50 p-4 rounded-xl border border-dark-100 space-y-2">
                    <p className="text-xs font-bold text-dark-500 uppercase tracking-wider">Passport Number</p>
                    <p className="text-sm font-bold text-dark-900 font-mono bg-white px-2.5 py-1.5 rounded-lg border border-dark-150 inline-block">{selectedIdentityUser.passportNumber}</p>
                    
                    {selectedIdentityUser.passportPhoto ? (
                      <div className="mt-2.5 space-y-2">
                        <p className="text-xs font-bold text-dark-500 uppercase tracking-wider">Passport Photograph</p>
                        <div className="relative w-full max-h-60 overflow-hidden rounded-xl border border-dark-200 bg-white flex items-center justify-center p-2">
                          <img 
                            src={selectedIdentityUser.passportPhoto} 
                            alt="Passport Document" 
                            className="max-w-full max-h-56 object-contain rounded-lg"
                          />
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={selectedIdentityUser.passportPhoto}
                            download={`${selectedIdentityUser.name.replace(/\s+/g, "_")}_passport.png`}
                            className="flex-1 text-center bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                          >
                            Download Passport
                          </a>
                          <a
                            href={selectedIdentityUser.passportPhoto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center bg-dark-100 text-dark-700 hover:bg-dark-200 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                          >
                            Open Full View
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-dark-400 italic">No passport photograph uploaded.</p>
                    )}
                  </div>
                )}

                {showRejectForm ? (
                  <div className="space-y-3 pt-3 border-t border-dark-100">
                    <label className="block text-xs font-bold text-dark-500 uppercase tracking-wider">
                      Rejection Reason
                    </label>
                    <textarea
                      value={rejectReasonText}
                      onChange={(e) => setRejectReasonText(e.target.value)}
                      placeholder="e.g. ID Card photo is blurry, unreadable, or NIK number does not match..."
                      className="w-full p-2.5 bg-dark-50 border border-dark-200 rounded-xl focus:border-primary outline-none text-dark-950 text-xs h-20 resize-none font-sans"
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowRejectForm(false)}
                        className="btn-outline flex-1 py-2 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleIdentityAction(selectedIdentityUser.id, "REJECT_IDENTITY", rejectReasonText.trim())}
                        disabled={!rejectReasonText.trim()}
                        className="btn-danger flex-1 py-2 text-xs font-semibold"
                      >
                        Confirm Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 pt-4 border-t border-dark-100">
                    <button 
                      onClick={() => handleIdentityAction(selectedIdentityUser.id, "APPROVE_IDENTITY")}
                      className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-3 font-semibold text-xs"
                    >
                      <Check className="w-4 h-4" /> Approve Identity
                    </button>
                    <button 
                      onClick={() => setShowRejectForm(true)}
                      className="btn-danger flex-1 flex items-center justify-center gap-1.5 py-3 font-semibold text-xs"
                    >
                      <X className="w-4 h-4" /> Reject Identity
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Send Warning Modal */}
        {warningUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="card max-w-md w-full bg-white p-6 rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => {
                  setWarningUser(null);
                  setWarningMessage("");
                }} 
                className="absolute top-4 right-4 text-dark-400 hover:text-dark-600 text-xl cursor-pointer"
              >
                &times;
              </button>
              
              <div className="flex items-center gap-3 border-b border-dark-100 pb-4 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                <div>
                  <h3 className="font-display font-bold text-dark-900 text-lg">Send Account Warning</h3>
                  <p className="text-xs text-dark-400">Recipient: {warningUser.name} ({warningUser.role})</p>
                </div>
              </div>

              <form onSubmit={handleSendWarning} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-dark-500 uppercase tracking-wider mb-2">
                    Infraction / Violation Message
                  </label>
                  <textarea 
                    className="w-full p-3 bg-dark-50/50 border border-dark-200 rounded-xl focus:border-primary outline-none text-dark-950 h-32 resize-none text-sm"
                    placeholder="Describe the policy violation, behavior problem, or profile contents that need correction..."
                    value={warningMessage}
                    onChange={(e) => setWarningMessage(e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-dark-400 mt-1 leading-relaxed">
                    This message will be logged as a warning in their record and delivered immediately to their Rewards & System mailbox.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setWarningUser(null);
                      setWarningMessage("");
                    }}
                    className="btn-outline flex-1 py-2.5 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmittingWarning || !warningMessage.trim()}
                    className="btn-primary flex-1 py-2.5 font-semibold text-xs bg-yellow-600 hover:bg-yellow-700 border-yellow-600 hover:border-yellow-700 text-white cursor-pointer"
                  >
                    {isSubmittingWarning ? "Sending..." : "Send Warning Notice"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
