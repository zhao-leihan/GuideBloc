"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Camera, Check, Shield, Navigation, AlertCircle, Compass, Smile } from "lucide-react";
import toast from "react-hot-toast";

interface MeetInterfaceProps {
  bookingId: string;
  role: "TOURIST" | "GUIDE";
  otherPartyName: string;
  otherPartyAvatar?: string;
}

export default function MeetInterface({
  bookingId,
  role,
  otherPartyName,
  otherPartyAvatar = "/assets/default-avatar.png",
}: MeetInterfaceProps) {
  const [status, setStatus] = useState<"NOT_STARTED" | "SHARING" | "ARRIVED" | "COMPLETED">("NOT_STARTED");
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [theirCoords, setTheirCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  
  const [myPhoto, setMyPhoto] = useState<string | null>(null);
  const [theirPhoto, setTheirPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTracking, setActiveTracking] = useState(false);
  
  const watchIdRef = useRef<number | null>(null);

  // Poll status from the API
  useEffect(() => {
    const fetchMeetDetails = async () => {
      try {
        const res = await fetch(`/api/meet?bookingId=${bookingId}`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);
          
          if (role === "TOURIST") {
            setMyPhoto(data.touristPhoto);
            setTheirPhoto(data.guidePhoto);
            if (data.guideLat && data.guideLng) {
              setTheirCoords({ lat: data.guideLat, lng: data.guideLng });
            }
          } else {
            setMyPhoto(data.guidePhoto);
            setTheirPhoto(data.touristPhoto);
            if (data.touristLat && data.touristLng) {
              setTheirCoords({ lat: data.touristLat, lng: data.touristLng });
            }
          }
        }
      } catch (err) {
        console.error("Error fetching meet details:", err);
      }
    };

    fetchMeetDetails();
    const interval = setInterval(fetchMeetDetails, 5000);
    return () => clearInterval(interval);
  }, [bookingId, role]);

  // Track location
  const startTracking = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setActiveTracking(true);
    toast.success("GPS Location Sharing Activated!");

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMyCoords({ lat, lng });

        // Post to API
        try {
          const res = await fetch("/api/meet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId, lat, lng }),
          });
          if (res.ok) {
            const data = await res.json();
            setStatus(data.status);
            if (role === "TOURIST" && data.guideLat && data.guideLng) {
              setTheirCoords({ lat: data.guideLat, lng: data.guideLng });
            } else if (role === "GUIDE" && data.touristLat && data.touristLng) {
              setTheirCoords({ lat: data.touristLat, lng: data.touristLng });
            }
          }
        } catch (err) {
          console.error("Failed to post coordinates:", err);
        }
      },
      (error) => {
        console.error("GPS Error:", error);
        toast.error("Failed to fetch GPS coordinates. Using mock tracking.");
        // Mock fallback for local testing
        const mockLat = -6.2 + Math.random() * 0.005;
        const mockLng = 106.8 + Math.random() * 0.005;
        setMyCoords({ lat: mockLat, lng: mockLng });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setActiveTracking(false);
    toast.success("Location sharing paused.");
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Calculate distance
  useEffect(() => {
    if (myCoords && theirCoords) {
      const R = 6371e3; // meters
      const lat1 = myCoords.lat;
      const lon1 = myCoords.lng;
      const lat2 = theirCoords.lat;
      const lon2 = theirCoords.lng;
      
      const phi1 = (lat1 * Math.PI) / 180;
      const phi2 = (lat2 * Math.PI) / 180;
      const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
      const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) *
          Math.cos(phi2) *
          Math.sin(deltaLambda / 2) *
          Math.sin(deltaLambda / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      const d = R * c;
      setDistance(Math.round(d));
    } else {
      setDistance(null);
    }
  }, [myCoords, theirCoords]);

  // Mock photo upload / camera snapshot
  const handlePhotoUpload = async () => {
    setUploading(true);
    try {
      // Simulate selfie snapshot / upload delay
      await new Promise((r) => setTimeout(r, 1500));
      
      // Generating a dummy avatar/selfie URL
      const randomId = Math.floor(Math.random() * 100);
      const mockSelfieUrl = `https://images.unsplash.com/photo-${role === "TOURIST" ? "1534528741775-53994a69daeb" : "1507003211169-0a1dd7228f2d"}?auto=format&fit=crop&w=150&h=150&q=80`;

      const res = await fetch("/api/meet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, photoUrl: mockSelfieUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        setMyPhoto(mockSelfieUrl);
        setStatus(data.status);
        toast.success("Selfie verified! Upload shared.");
      }
    } catch (err) {
      toast.error("Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 text-white max-w-lg mx-auto shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dark-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Live Meetup Radar</h3>
            <p className="text-xs text-dark-400">Locate each other in-person using real-time GPS</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
          status === "COMPLETED" 
            ? "bg-green-500/10 text-green-400" 
            : status === "ARRIVED" 
            ? "bg-blue-500/10 text-blue-400"
            : status === "SHARING" 
            ? "bg-amber-500/10 text-amber-400"
            : "bg-dark-800 text-dark-400"
        }`}>
          {status.replace("_", " ")}
        </div>
      </div>

      {/* Radar Visual Display */}
      <div className="flex justify-center relative py-4">
        <div className="w-64 h-64 rounded-full border-2 border-dark-700 bg-dark-950 flex items-center justify-center relative overflow-hidden">
          {/* Sweeper animation */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/5 to-primary/20 rounded-full animate-spin-radar origin-center pointer-events-none" />
          
          {/* Radar Circles */}
          <div className="absolute w-48 h-48 border border-dark-800 rounded-full" />
          <div className="absolute w-32 h-32 border border-dark-800/50 rounded-full" />
          <div className="absolute w-16 h-16 border border-dark-800/30 rounded-full" />
          
          {/* Radar Crosshairs */}
          <div className="absolute inset-x-0 h-px bg-dark-800/60" />
          <div className="absolute inset-y-0 w-px bg-dark-800/60" />

          {/* Self Pin (Center) */}
          <div className="absolute z-10 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full border-2 border-primary bg-dark-900 overflow-hidden flex items-center justify-center shadow-lg">
              <Smile className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-semibold bg-primary text-white px-1.5 py-0.5 rounded-md mt-1 shadow-sm">You</span>
          </div>

          {/* Other Party Pin (Radar Coordinate Offset) */}
          {status !== "NOT_STARTED" && theirCoords && (
            <div 
              className="absolute z-10 flex flex-col items-center animate-pulse"
              style={{
                top: distance && distance < 200 ? "35%" : "20%",
                left: distance && distance < 200 ? "65%" : "75%",
              }}
            >
              <div className="w-8 h-8 rounded-full border-2 border-secondary bg-dark-900 overflow-hidden shadow-lg flex items-center justify-center">
                <img src={otherPartyAvatar} alt={otherPartyName} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-semibold bg-secondary text-white px-1.5 py-0.5 rounded-md mt-1 shadow-sm">{otherPartyName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Meetup Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark-800/50 border border-dark-700/50 p-3.5 rounded-xl text-center space-y-1">
          <span className="text-xs text-dark-400 block">Proximity</span>
          <span className="text-xl font-bold text-white tracking-wide">
            {distance !== null ? `${distance} m` : "Radar Offline"}
          </span>
        </div>
        <div className="bg-dark-800/50 border border-dark-700/50 p-3.5 rounded-xl text-center space-y-1">
          <span className="text-xs text-dark-400 block">Meetup Status</span>
          <span className="text-sm font-semibold text-primary block mt-1">
            {status === "NOT_STARTED" && "Awaiting activation"}
            {status === "SHARING" && "Approaching..."}
            {status === "ARRIVED" && "Nearby! Verify selfie"}
            {status === "COMPLETED" && "Met & Verified!"}
          </span>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-3 bg-dark-800/30 p-4 rounded-xl border border-dark-800">
        <h4 className="text-xs font-bold text-dark-300 uppercase tracking-wider mb-2">Checkpoints</h4>
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-300">1. Share GPS locations</span>
          {activeTracking ? (
            <span className="text-green-400 flex items-center gap-1"><Check className="w-4 h-4" /> Active</span>
          ) : (
            <span className="text-dark-500">Not Sharing</span>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-300">2. Proximity check (Within 50m)</span>
          {status === "ARRIVED" || status === "COMPLETED" ? (
            <span className="text-green-400 flex items-center gap-1"><Check className="w-4 h-4" /> Met</span>
          ) : (
            <span className="text-dark-500">Out of range</span>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-300">3. Both uploaded selfie</span>
          {status === "COMPLETED" ? (
            <span className="text-green-400 flex items-center gap-1"><Check className="w-4 h-4" /> Completed</span>
          ) : (
            <span className="text-dark-500">
              {myPhoto ? "Awaiting partner" : "Selfie missing"}
            </span>
          )}
        </div>
      </div>

      {/* Selfie Verification Grid */}
      {(status === "ARRIVED" || myPhoto || theirPhoto) && (
        <div className="grid grid-cols-2 gap-4 border-t border-dark-800 pt-4">
          <div className="space-y-2 text-center">
            <span className="text-xs text-dark-400">Your Selfie</span>
            {myPhoto ? (
              <div className="w-24 h-24 rounded-2xl mx-auto overflow-hidden border border-primary relative">
                <img src={myPhoto} alt="Your selfie" className="w-full h-full object-cover" />
                <div className="absolute bottom-1 right-1 bg-primary text-white p-1 rounded-full"><Check className="w-3 h-3" /></div>
              </div>
            ) : (
              <button 
                onClick={handlePhotoUpload}
                disabled={uploading}
                className="w-24 h-24 rounded-2xl mx-auto border-2 border-dashed border-dark-600 hover:border-primary flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Camera className="w-6 h-6 text-dark-400" />
                <span className="text-[10px] text-dark-400">Take Photo</span>
              </button>
            )}
          </div>
          <div className="space-y-2 text-center">
            <span className="text-xs text-dark-400">{otherPartyName}&apos;s Selfie</span>
            {theirPhoto ? (
              <div className="w-24 h-24 rounded-2xl mx-auto overflow-hidden border border-secondary relative">
                <img src={theirPhoto} alt="Other selfie" className="w-full h-full object-cover" />
                <div className="absolute bottom-1 right-1 bg-secondary text-white p-1 rounded-full"><Check className="w-3 h-3" /></div>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl mx-auto border-2 border-dashed border-dark-800 bg-dark-950 flex flex-col items-center justify-center">
                <Loader2 className="w-5 h-5 text-dark-500 animate-spin" />
                <span className="text-[10px] text-dark-500 mt-1">Awaiting...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 border-t border-dark-800 pt-4">
        {activeTracking ? (
          <button 
            onClick={stopTracking}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <AlertCircle className="w-4.5 h-4.5" /> Pause GPS Sharing
          </button>
        ) : (
          <button 
            onClick={startTracking}
            className="flex-1 bg-primary hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Navigation className="w-4.5 h-4.5" /> Share GPS Location
          </button>
        )}
      </div>

      {status === "COMPLETED" && (
        <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl flex items-center gap-3">
          <Shield className="w-5 h-5 text-green-400" />
          <p className="text-xs text-green-300">
            Meetup successfully verified by double-sided selfie matching. Have a safe tour!
          </p>
        </div>
      )}
    </div>
  );
}

// Inline animation loader helper
function Loader2({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
