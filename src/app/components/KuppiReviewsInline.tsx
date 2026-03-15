"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authPost } from "@/lib/auth-fetch";
import { Send } from "lucide-react";

interface Review {
  _id: string;
  userName: string;
  rating: number;
  title?: string;
  body: string;
  createdAt: string;
}

export default function KuppiReviewsInline({ kuppiId }: { kuppiId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [message, setMessage] = useState<string | null>(null);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const valid = reviews.filter((r) => typeof r?.rating === "number");
    if (valid.length === 0) return 0;
    const total = valid.reduce((sum, r) => sum + r.rating, 0);
    return Math.round((total / valid.length) * 10) / 10;
  }, [reviews]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kuppi/${kuppiId}/reviews`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!kuppiId) return;
    fetchReviews();
  }, [kuppiId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!user) {
      setMessage("Please log in to submit a review.");
      return;
    }
    try {
      const res = await authPost(`/api/kuppi/${kuppiId}/reviews`, {
        rating: reviewRating,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");
      if (!data.review) {
        throw new Error("Failed to submit review");
      }
      setReviews((prev) => {
        if (data.updated && data.review?._id) {
          const exists = prev.some((r) => r._id === data.review._id);
          if (exists) {
            return prev.map((r) => (r._id === data.review._id ? data.review : r));
          }
        }
        return [data.review, ...prev];
      });
      setMessage(data.updated ? "Review updated." : "Review submitted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to submit review");
    }
  };

  return (
    <div className="mt-6 border-t border-blue-100 pt-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Ratings</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="flex items-center gap-0.5 text-yellow-500 text-xl">
            {[1, 2, 3, 4, 5].map((r) => (
              <span key={r}>{r <= Math.round(averageRating) ? "★" : "☆"}</span>
            ))}
          </div>
          <span className="text-base font-semibold text-gray-700">
            {averageRating || 0}
          </span>
          <span>({reviews.length})</span>
        </div>
      </div>

      {message && (
        <div className="mb-3 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Rate</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReviewRating(r)}
                  aria-label={`Rate ${r} out of 5`}
                  className={`text-2xl leading-none ${
                    r <= reviewRating ? "text-yellow-500" : "text-gray-300"
                  } hover:text-yellow-500 transition`}
                >
                  ★
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-500">{reviewRating}/5</span>
          </div>
          <div className="flex items-center gap-3">
            {!user && (
              <span className="text-sm text-gray-400">Login required</span>
            )}
            <button
              type="submit"
              disabled={!user}
              aria-label="Submit rating"
              className="h-11 w-11 flex items-center justify-center rounded-full bg-indigo-600 text-white text-base font-medium hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <p className="text-xs text-gray-500">Loading ratings...</p>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-gray-500">No ratings yet.</p>
      ) : null}
    </div>
  );
}
