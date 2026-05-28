"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, Rating, Stack, Typography } from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";
import { authGet, authPost } from "@/lib/auth-fetch";

interface Review {
  _id: string;
  rating: number;
  mine?: boolean;
}

export default function KuppiReviewsInline({ kuppiId }: { kuppiId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewRating, setReviewRating] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const currentUserReview = useMemo(
    () => reviews.find((review) => review.mine) ?? null,
    [reviews]
  );

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
      const res = user
        ? await authGet(`/api/kuppi/${kuppiId}/reviews`)
        : await fetch(`/api/kuppi/${kuppiId}/reviews`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load ratings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!kuppiId) return;
    fetchReviews();
  }, [kuppiId, user]);

  useEffect(() => {
    setReviewRating(currentUserReview?.rating ?? null);
  }, [currentUserReview]);

  const handleRatingChange = async (_event: unknown, value: number | null) => {
    if (value === null) return;
    setMessage(null);

    if (!user) {
      setMessage("Please log in to rate.");
      return;
    }

    const previous = reviewRating;
    setReviewRating(value);
    setSaving(true);

    try {
      const res = await authPost(`/api/kuppi/${kuppiId}/reviews`, { rating: value });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit rating");
      if (!data.review) throw new Error("Failed to submit rating");
      data.review.mine = true;

      setReviews((prev) => {
        if (data.updated && data.review?._id) {
          const exists = prev.some((r) => r._id === data.review._id);
          if (exists) {
            return prev.map((r) => (r._id === data.review._id ? data.review : r));
          }
        }
        return [data.review, ...prev];
      });
    } catch (error) {
      setReviewRating(previous ?? null);
      setMessage(error instanceof Error ? error.message : "Failed to submit rating");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #dbeafe" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={700}>Rating</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Rating value={averageRating} precision={0.1} readOnly size="small" />
          <Typography variant="body2" color="text.secondary">
            {averageRating || 0} ({reviews.length})
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minHeight: 34 }}>
        <Rating
          value={reviewRating}
          onChange={handleRatingChange}
          max={5}
          precision={1}
          disabled={saving}
          size="medium"
        />
        {saving ? <CircularProgress size={16} /> : null}
      </Stack>

      {!user ? (
        <Typography variant="caption" color="text.secondary">Login required to rate</Typography>
      ) : null}

      {message ? <Alert severity="info" sx={{ mt: 1.5 }}>{message}</Alert> : null}

      {loading ? (
        <Box sx={{ mt: 1.5 }}>
          <CircularProgress size={16} sx={{ color: '#6366f1' }} />
        </Box>
      ) : null}
    </Box>
  );
}
