"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authPost } from "@/lib/auth-fetch";

interface Review {
  _id: string;
  userName: string;
  rating: number;
  title?: string;
  body: string;
  createdAt: string;
}

interface Comment {
  _id: string;
  userName: string;
  body: string;
  score: number;
  createdAt: string;
}

export default function KuppiFeedback({ kuppiId }: { kuppiId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }, [reviews]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reviewsRes, commentsRes] = await Promise.all([
        fetch(`/api/kuppi/${kuppiId}/reviews`),
        fetch(`/api/kuppi/${kuppiId}/comments`),
      ]);
      const reviewsData = await reviewsRes.json();
      const commentsData = await commentsRes.json();
      setReviews(reviewsData.reviews || []);
      setComments(commentsData.comments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!kuppiId) return;
    fetchAll();
  }, [kuppiId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!user) {
      setMessage("Please log in to submit a review.");
      return;
    }

    try {
      const res = await authPost(`/api/kuppi/${kuppiId}/reviews`, {
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");
      setReviews((prev) => [data.review, ...prev]);
      setReviewTitle("");
      setReviewBody("");
      setMessage("Review submitted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to submit review");
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!user) {
      setMessage("Please log in to post a comment.");
      return;
    }

    try {
      const res = await authPost(`/api/kuppi/${kuppiId}/comments`, {
        body: commentBody,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post comment");
      setComments((prev) => [data.comment, ...prev]);
      setCommentBody("");
      setMessage("Comment posted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to post comment");
    }
  };

  const handleVote = async (commentId: string, value: 1 | -1) => {
    if (!user) {
      setMessage("Please log in to vote.");
      return;
    }
    try {
      const res = await authPost(`/api/comments/${commentId}/vote`, { value });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to vote");
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, score: data.score } : c))
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to vote");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <p className="text-gray-600">Loading reviews and discussion...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg p-3">
          {message}
        </div>
      )}

      <section className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Reviews</h2>
          <div className="text-sm text-gray-600">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""} · Avg {averageRating || 0}
          </div>
        </div>

        <form onSubmit={handleReviewSubmit} className="space-y-3 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-gray-700">Rating</label>
            <select
              value={reviewRating}
              onChange={(e) => setReviewRating(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {!user && (
              <span className="text-xs text-gray-500">Login required to submit</span>
            )}
          </div>
          <input
            type="text"
            placeholder="Title (optional)"
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Write your review"
            value={reviewBody}
            onChange={(e) => setReviewBody(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            rows={3}
            required
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
          >
            Submit Review
          </button>
        </form>

        <div className="space-y-4">
          {reviews.length === 0 && (
            <p className="text-sm text-gray-500">No reviews yet.</p>
          )}
          {reviews.map((review) => (
            <div key={review._id} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-semibold text-gray-800">{review.userName}</div>
                <div className="text-xs text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-sm text-yellow-600 mb-1">Rating: {review.rating}/5</div>
              {review.title && (
                <div className="text-sm font-medium text-gray-800">{review.title}</div>
              )}
              <p className="text-sm text-gray-600">{review.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Discussion</h2>
        <form onSubmit={handleCommentSubmit} className="space-y-3 mb-6">
          <textarea
            placeholder="Ask a question or leave a comment"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            rows={3}
            required
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition"
            >
              Post Comment
            </button>
            {!user && (
              <span className="text-xs text-gray-500">Login required to post</span>
            )}
          </div>
        </form>

        <div className="space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-gray-500">No comments yet.</p>
          )}
          {comments.map((comment) => (
            <div key={comment._id} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-semibold text-gray-800">{comment.userName}</div>
                <div className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{comment.body}</p>
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => handleVote(comment._id, 1)}
                  className="px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                >
                  Upvote
                </button>
                <button
                  type="button"
                  onClick={() => handleVote(comment._id, -1)}
                  className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Downvote
                </button>
                <span className="text-gray-600">Score: {comment.score || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
