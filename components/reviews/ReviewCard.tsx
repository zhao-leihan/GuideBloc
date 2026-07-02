import { Star } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string | Date;
    reviewer: {
      id: string;
      name: string;
      avatar: string | null;
    };
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          {review.reviewer.avatar ? (
            <img src={review.reviewer.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            review.reviewer.name[0]
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium text-dark-900">{review.reviewer.name}</p>
          <p className="text-xs text-dark-400">{formatDate(review.createdAt)}</p>
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
    </div>
  );
}
