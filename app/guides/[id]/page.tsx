import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Star, MapPin, Globe, Calendar } from "lucide-react";

// This would normally be a dynamic page fetching guide data
export default function GuideProfilePage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="card p-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
              A
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-dark-900">Tour Guide Profile</h1>
              <p className="text-dark-500">Guide ID: {params.id}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-dark-500">
                <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-accent text-accent" /> 4.9 (127 reviews)</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Bali, Indonesia</span>
                <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> English, Indonesian</span>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-lg font-bold text-dark-900 mb-3">About</h2>
            <p className="text-dark-600">Experienced local guide specializing in adventure and cultural tours across Bali.</p>
          </div>
          <div className="mt-8">
            <h2 className="text-lg font-bold text-dark-900 mb-3">Tours</h2>
            <p className="text-dark-500">This guide&apos;s tours will appear here.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
