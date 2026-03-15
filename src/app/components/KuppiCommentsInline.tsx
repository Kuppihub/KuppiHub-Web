"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authDelete, authPost } from "@/lib/auth-fetch";

interface Comment {
  _id: string;
  userId: string;
  userName: string;
  body: string;
  score: number;
  createdAt: string;
  parentId?: string | null;
}

export default function KuppiCommentsInline({ kuppiId }: { kuppiId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const getInitial = (name?: string) =>
    name?.trim().charAt(0).toUpperCase() || "U";

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kuppi/${kuppiId}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!kuppiId) return;
    fetchComments();
  }, [kuppiId]);

  useEffect(() => {
    if (!kuppiId || !open) return;
    fetchComments();
  }, [kuppiId, open]);

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

  const handleSubmit = async (e: React.FormEvent) => {
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
            "rounded-[2rem] p-5 border shadow-sm transition-shadow",
            isReply ? "bg-gray-50/60 border-gray-100" : "bg-white border-gray-50",
            "hover:shadow-md",
          ].join(" ")}
        >
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                {avatarInitial}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-xs">{comment.userName}</p>
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
          <p className="text-gray-600 text-xs leading-relaxed mb-4">{comment.body}</p>
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
            {user?.uid === comment.userId && (
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
              className="w-full border border-gray-100 rounded-3xl px-4 py-3 text-xs bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200"
              rows={2}
              required
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full bg-indigo-600 text-white text-xs hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 active:scale-95"
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

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Comments</h3>
          <p className="text-xs text-gray-400">{comments.length} discussions</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {!open ? null : (
        <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)]">
          {message && (
            <div className="mb-5 inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-4 py-2 rounded-full border border-indigo-100">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mb-6">
            <textarea
              placeholder="Add a comment..."
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              className="w-full h-24 p-4 rounded-3xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 text-sm placeholder-gray-400 transition-all outline-none"
              rows={3}
              required
            />
            <div className="flex items-center justify-between mt-3">
              {!user && <span className="text-xs text-gray-400">Login required</span>}
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-8 rounded-full text-xs transition-all shadow-lg shadow-indigo-100 active:scale-95"
              >
                Post
              </button>
            </div>
          </form>

          {loading ? (
            <p className="text-xs text-gray-500">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-500">No comments yet.</p>
          ) : (
            <div className="space-y-5">{commentTree.roots.map((c) => renderComment(c))}</div>
          )}
        </div>
      )}

      {message && !open && (
        <div className="mb-3 inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-4 py-2 rounded-full border border-indigo-100">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          {message}
        </div>
      )}
    </div>
  );
}
