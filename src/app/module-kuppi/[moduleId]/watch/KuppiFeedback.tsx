"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authDelete, authGet, authPost } from "@/lib/auth-fetch";

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
  userPhoto?: string | null;
  body: string;
  score: number;
  createdAt: string;
  parentId?: string | null;
  canDelete?: boolean;
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
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const getInitial = (name?: string) =>
    name?.trim().charAt(0).toUpperCase() || "U";

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const valid = reviews.filter((r) => typeof r?.rating === "number");
    if (valid.length === 0) return 0;
    const total = valid.reduce((sum, r) => sum + r.rating, 0);
    return Math.round((total / valid.length) * 10) / 10;
  }, [reviews]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reviewsRes, commentsRes] = await Promise.all([
        fetch(`/api/kuppi/${kuppiId}/reviews`),
        user
          ? authGet(`/api/kuppi/${kuppiId}/comments`)
          : fetch(`/api/kuppi/${kuppiId}/comments`),
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
  }, [kuppiId, user]);

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
      setReviewTitle("");
      setReviewBody("");
      setMessage(data.updated ? "Review updated." : "Review submitted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to submit review");
    }
  };

  const submitComment = async (body: string, parentId?: string | null) => {
    setMessage(null);
    if (!user) {
      setMessage("Please log in to post a comment.");
      return;
    }

    try {
      const res = await authPost(`/api/kuppi/${kuppiId}/comments`, {
        body,
        parentId: parentId ?? null,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post comment");
      setComments((prev) => [data.comment, ...prev]);
      setMessage("Comment posted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to post comment");
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitComment(commentBody, null);
    setCommentBody("");
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    await submitComment(replyBody, parentId);
    setReplyBody("");
    setReplyToId(null);
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

  const handleDelete = async (commentId: string) => {
    if (!user) {
      setMessage("Please log in to delete your comment.");
      return;
    }
    try {
      const res = await authDelete(`/api/comments/${commentId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete comment");
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setMessage("Comment deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete comment");
    }
  };

  const commentTree = useMemo(() => {
    const byId = new Map<string, Comment>();
    const children = new Map<string, Comment[]>();
    comments.forEach((comment) => {
      byId.set(comment._id, comment);
    });
    comments.forEach((comment) => {
      if (comment.parentId && byId.has(comment.parentId)) {
        if (!children.has(comment.parentId)) {
          children.set(comment.parentId, []);
        }
        children.get(comment.parentId)?.push(comment);
      }
    });
    const roots = comments.filter(
      (comment) => !comment.parentId || !byId.has(comment.parentId)
    );
    return { roots, children };
  }, [comments]);

  const renderComment = (comment: Comment, depth = 0) => {
    const commentChildren = commentTree.children.get(comment._id) ?? [];
    const isReply = depth > 0;
    const avatarInitial = getInitial(comment.userName);

    return (
      <div key={comment._id} className={isReply ? "ml-8" : undefined}>
        <div
          className={[
            "rounded-[2rem] p-6 border shadow-sm transition-shadow",
            isReply ? "bg-gray-50/60 border-gray-100" : "bg-white border-gray-50",
            "hover:shadow-md",
          ].join(" ")}
        >
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold overflow-hidden">
                {comment.userPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={comment.userPhoto}
                    alt={comment.userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  avatarInitial
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{comment.userName}</p>
                <p className="text-gray-400 text-[10px]">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1">
              <button
                type="button"
                onClick={() => handleVote(comment._id, 1)}
                className="p-1 hover:text-rose-500 text-gray-400 transition-colors"
                aria-label="Love"
              >
                ♥
              </button>
              <span className="text-gray-700 text-[10px] font-bold px-1">
                {comment.score || 0}
              </span>
            </div>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">{comment.body}</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  setMessage("Please log in to reply.");
                  return;
                }
                setReplyToId((prev) => (prev === comment._id ? null : comment._id));
                setReplyBody("");
              }}
              className="flex items-center gap-1.5 text-gray-400 text-xs font-bold hover:text-indigo-600 transition-colors"
            >
              Reply
            </button>
            {comment.canDelete && (
              <button
                type="button"
                onClick={() => handleDelete(comment._id)}
                className="flex items-center gap-1.5 text-gray-400 text-xs font-bold hover:text-rose-500 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {replyToId === comment._id && (
          <form
            onSubmit={(e) => handleReplySubmit(e, comment._id)}
            className="mt-2 space-y-2"
          >
            <textarea
              placeholder={`Reply to ${comment.userName}`}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              className="w-full border border-gray-100 rounded-3xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200"
              rows={2}
              required
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 active:scale-95"
              >
                Post reply
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyToId(null);
                  setReplyBody("");
                }}
                className="text-xs text-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {commentChildren.length > 0 && (
          <div className="mt-3 space-y-3">
            {commentChildren.map((child) => renderComment(child, depth + 1))}
          </div>
        )}
      </div>
    );
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
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-4 py-2 rounded-full border border-indigo-100">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          {message}
        </div>
      )}

      <section className="bg-white rounded-[2.5rem] shadow-md p-6">
        <div className="flex flex-col items-center mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Community Rating
          </h2>
          <div className="flex items-center gap-6">
            <span className="text-7xl font-black text-gray-900">
              {averageRating || 0}
            </span>
            <div className="flex flex-col">
              <div className="flex text-yellow-400 text-4xl">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <span key={idx}>{idx < Math.round(averageRating) ? "★" : "☆"}</span>
                ))}
              </div>
              <span className="text-gray-400 text-lg font-medium">
                Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleReviewSubmit} className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-full py-3 px-6 flex justify-between items-center border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-gray-900 text-sm font-bold">Rate</span>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                className="text-sm font-semibold text-gray-600 bg-transparent border-none focus:ring-0 cursor-pointer pr-6 py-0"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {!user && (
              <span className="text-xs text-gray-400">Login required</span>
            )}
          </div>
          <input
            type="text"
            placeholder="Title (optional)"
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            className="w-full border border-gray-100 rounded-3xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200"
          />
          <textarea
            placeholder="Write your review"
            value={reviewBody}
            onChange={(e) => setReviewBody(e.target.value)}
            className="w-full border border-gray-100 rounded-3xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200"
            rows={3}
            required
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-8 rounded-full text-sm transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            Submit Review
          </button>
        </form>

        <div className="space-y-4">
          {reviews.length === 0 && (
            <p className="text-sm text-gray-500">No reviews yet.</p>
          )}
          {reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white rounded-[2rem] p-6 border border-gray-50 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">
                    {getInitial(review.userName)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{review.userName}</p>
                    <p className="text-gray-400 text-[10px]">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex text-yellow-400 text-xl">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span key={idx}>{idx < review.rating ? "★" : "☆"}</span>
                  ))}
                </div>
              </div>
              {review.title && (
                <div className="text-sm font-semibold text-gray-800 mb-1">
                  {review.title}
                </div>
              )}
              <p className="text-sm text-gray-600">{review.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-[2.5rem] shadow-md p-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Comments</h2>
            <p className="text-gray-400 text-sm">{comments.length} discussions</p>
          </div>
          <select className="text-xs font-semibold text-gray-500 bg-transparent border-none focus:ring-0 cursor-pointer pr-8 py-0">
            <option>Newest</option>
            <option>Top Rated</option>
          </select>
        </div>
        <form onSubmit={handleCommentSubmit} className="mb-8">
          <textarea
            placeholder="Ask a question or leave a comment"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            className="w-full h-28 p-5 rounded-3xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 text-sm placeholder-gray-400 transition-all outline-none"
            rows={3}
            required
          />
          <div className="flex items-center justify-between mt-3">
            {!user && (
              <span className="text-xs text-gray-400">Login required to post</span>
            )}
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-8 rounded-full text-sm transition-all shadow-lg shadow-indigo-100 active:scale-95"
            >
              Post Comment
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-gray-500">No comments yet.</p>
          )}
          {commentTree.roots.map((comment) => renderComment(comment))}
        </div>
      </section>
    </div>
  );
}
