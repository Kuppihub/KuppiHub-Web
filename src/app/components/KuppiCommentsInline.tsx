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

    return (
      <div key={comment._id} style={{ marginLeft: depth * 16 }}>
        <div className="border border-gray-100 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-semibold text-gray-800">
              {comment.userName}
            </div>
            <div className="text-[10px] text-gray-500">
              {new Date(comment.createdAt).toLocaleDateString()}
            </div>
          </div>
          <p className="text-xs text-gray-700 mb-2">{comment.body}</p>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <button
              type="button"
              onClick={() => handleVote(comment._id, 1)}
              className="px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              aria-label="Upvote"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => handleVote(comment._id, -1)}
              className="px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              aria-label="Downvote"
            >
              ↓
            </button>
            <span className="text-gray-600">Score: {comment.score || 0}</span>
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
              className="text-blue-600 hover:text-blue-700"
            >
              Reply
            </button>
            {user?.uid === comment.userId && (
              <button
                type="button"
                onClick={() => handleDelete(comment._id)}
                className="text-red-600 hover:text-red-700"
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
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              required
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700 transition"
              >
                Post reply
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyToId(null);
                  setReplyBody("");
                }}
                className="text-xs text-gray-500"
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
    <div className="mt-5 border-t border-blue-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Comments</h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          {open ? "Hide" : "Show"} ({comments.length})
        </button>
      </div>

      {!open ? null : (
        <>
          {message && (
            <div className="mb-3 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2 mb-4">
            <textarea
              placeholder="Add a comment"
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              required
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700 transition"
              >
                Post
              </button>
              {!user && (
                <span className="text-xs text-gray-500">Login required</span>
              )}
            </div>
          </form>

          {loading ? (
            <p className="text-xs text-gray-500">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-500">No comments yet.</p>
          ) : (
            <div className="space-y-3">
              {commentTree.roots.map((comment) => renderComment(comment))}
            </div>
          )}
        </>
      )}

      {message && !open && (
        <div className="mb-3 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
          {message}
        </div>
      )}
    </div>
  );
}
