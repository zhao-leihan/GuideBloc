import { Star } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string;
    images?: string[];
    createdAt: string | Date;
    reviewer: {
      id: string;
      name: string;
      avatar: string | null;
    };
    guide?: {
      id: string;
      name: string;
      avatar: string | null;
    };
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
          {review.reviewer.avatar ? (
            <img src={review.reviewer.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            review.reviewer.name[0]
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-dark-900 text-sm truncate max-w-[120px]">{review.reviewer.name}</span>
            <span className="text-[9px] font-bold text-dark-500 uppercase tracking-wider px-1.5 py-0.5 bg-dark-50 rounded-md border border-dark-100 flex-shrink-0">Tourist</span>
            <span className="text-xs text-dark-400 font-medium mx-0.5 flex-shrink-0">reviewed</span>
            <span className="font-semibold text-primary text-sm truncate max-w-[120px]">{review.guide?.name || "Tour Guide"}</span>
            <span className="text-[9px] font-bold text-primary uppercase tracking-wider px-1.5 py-0.5 bg-primary/5 rounded-md border border-primary/10 flex-shrink-0">Guide</span>
          </div>
          <p className="text-[10px] text-dark-400 mt-1">{formatDate(review.createdAt)}</p>
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < review.rating ? "fill-accent text-accent" : "text-dark-200"}`}
            />
          ))}
        </div>
      </div>
      <p className="text-dark-600 text-sm leading-relaxed">{review.comment}</p>
      {review.images && review.images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {review.images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt="Review Attachment"
              className="w-16 h-16 object-cover rounded-lg border border-dark-200 hover:opacity-90 transition-opacity"
            />
          ))}
        </div>
      )}
    </div>
  );
}
