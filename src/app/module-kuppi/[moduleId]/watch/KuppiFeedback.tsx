"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authDelete, authGet, authPost } from "@/lib/auth-fetch";

const MAX_COMMENT_LENGTH = 1000;

interface Review {
  _id: string;
  userId?: string;
  userName?: string;
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
  likedByMe?: boolean;
}

export default function KuppiFeedback({ kuppiId }: { kuppiId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState<number | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const currentUserReview = useMemo(
    () => reviews.find((review) => review.userId === user?.uid) ?? null,
    [reviews, user?.uid]
  );

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

  useEffect(() => {
    setReviewRating(currentUserReview?.rating ?? null);
  }, [currentUserReview]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!user) {
      setMessage("Please log in to submit a review.");
      return;
    }
    if (reviewRating === null) {
      setMessage("Please select a rating.");
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
      setReviewRating(null);
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
        userPhoto: user?.photoURL || null,
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
        prev.map((c) =>
          c._id === commentId
            ? { ...c, score: data.score, likedByMe: data.liked ?? c.likedByMe }
            : c
        )
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

    return (
      <div key={comment._id} className={isReply ? "ml-8" : undefined}>
        <div
          className={[
            "rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 border transition-all duration-300 shadow-sm",
            isReply 
              ? "bg-white/20 border-white/20 hover:bg-white/25 hover:border-white/25" 
              : "bg-white/35 border border-white/30 hover:bg-white/45 hover:border-white/35 hover:shadow-md",
            "backdrop-blur-md"
          ].join(" ")}
        >
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
            <div>
              <p className="text-gray-800 font-semibold text-sm sm:text-base flex items-center gap-2">
                {comment.userName}
                <span className="text-gray-400 text-xs font-normal">
                  ({new Date(comment.createdAt).toLocaleDateString()})
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/30 border border-white/40 rounded-lg px-2.5 py-1">
              <button
                type="button"
                onClick={() => handleVote(comment._id, 1)}
                className={`p-0.5 text-sm transition-colors ${
                  comment.likedByMe ? "text-rose-500 scale-110" : "text-gray-400 hover:text-rose-400 hover:scale-110"
                }`}
                aria-label="Love"
              >
                ♥
              </button>
              <span className="text-gray-700 text-xs font-bold px-1">
                {comment.score || 0}
              </span>
            </div>
          </div>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">{comment.body}</p>
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
              className="flex items-center gap-1.5 text-gray-500 text-xs font-bold hover:text-blue-600 transition-colors"
            >
              Reply
            </button>
            {comment.canDelete && (
              <button
                type="button"
                onClick={() => handleDelete(comment._id)}
                className="flex items-center gap-1.5 text-gray-500 text-xs font-bold hover:text-rose-500 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {replyToId === comment._id && (
          <form
            onSubmit={(e) => handleReplySubmit(e, comment._id)}
            className="mt-3.5 space-y-2.5 p-4 bg-white/20 border border-white/30 rounded-2xl backdrop-blur-md"
          >
            <textarea
              placeholder={`Reply to ${comment.userName}`}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              maxLength={MAX_COMMENT_LENGTH}
              className="w-full border border-white/30 rounded-xl px-4 py-3 text-sm bg-white/10 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white/25 transition-all duration-300"
              rows={2}
              required
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {replyBody.length}/{MAX_COMMENT_LENGTH}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/35 hover:bg-blue-500/35 text-blue-900 text-xs font-bold transition shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Post reply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyToId(null);
                    setReplyBody("");
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {commentChildren.length > 0 && (
          <div className="mt-3.5 space-y-3.5">
            {commentChildren.map((child) => renderComment(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-lg saturate-150 flex items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 font-medium">Loading reviews and discussion...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-800 text-xs font-semibold px-4 py-2 rounded-full border border-blue-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {message}
        </div>
      )}

      <section className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-lg saturate-150">
        <div className="border-b border-gray-150 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Reviews</h2>
            <div className="flex items-center gap-1 text-amber-500 text-lg">
              {Array.from({ length: 5 }).map((_, idx) => (
                <span key={idx}>{idx < Math.round(averageRating) ? "★" : "☆"}</span>
              ))}
            </div>
            <span className="text-sm font-bold text-gray-800">
              {averageRating || 0}
            </span>
            <span className="text-sm text-gray-500">
              ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
            </span>
          </div>
        </div>

        <form onSubmit={handleReviewSubmit} className="mt-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReviewRating(r)}
                className={`text-3xl leading-none transition ${
                  reviewRating !== null && r <= reviewRating
                    ? "text-amber-500"
                    : "text-gray-300 hover:text-amber-500"
                }`}
                aria-label={`Rate ${r} stars`}
              >
                ★
              </button>
            ))}
            {!user && <span className="text-xs text-gray-400">Login required</span>}
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={!user || reviewRating === null}
              className="bg-blue-500/20 hover:bg-blue-500/35 text-blue-900 font-semibold py-2 px-5 rounded-full text-sm border border-blue-500/35 hover:border-blue-500/50 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {currentUserReview ? "Update Review" : "Post Review"}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-[1.75rem] sm:rounded-[2.5rem] shadow-lg p-5 sm:p-6 saturate-150">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Comments</h2>
            <p className="text-gray-400 text-sm">{comments.length} discussions</p>
          </div>
          <select className="text-xs font-semibold text-gray-500 bg-white/10 border border-white/20 rounded-lg focus:ring-0 cursor-pointer px-3 py-1 mr-2 outline-none">
            <option className="bg-white text-gray-800">Newest</option>
            <option className="bg-white text-gray-800">Top Rated</option>
          </select>
        </div>
        <form onSubmit={handleCommentSubmit} className="mb-8">
          <textarea
            placeholder="Ask a question or leave a comment"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            className="w-full h-28 p-4 rounded-2xl border border-white/30 bg-white/20 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white/35 transition-all duration-300 text-sm outline-none"
            rows={3}
            required
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-400">
              {commentBody.length}/{MAX_COMMENT_LENGTH}
            </span>
            {!user && (
              <span className="text-xs text-gray-400">Login required to post</span>
            )}
            <button
              type="submit"
              className="bg-blue-500/20 hover:bg-blue-500/35 text-blue-900 font-bold py-2.5 px-8 rounded-full text-sm border border-blue-500/35 hover:border-blue-500/50 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Post Comment
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4 font-medium">No comments yet.</p>
          )}
          {commentTree.roots.map((comment) => renderComment(comment))}
        </div>
      </section>
    </div>
  );
}
