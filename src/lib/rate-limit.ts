import clientPromise from "@/lib/mongodb";

type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
};

const getDb = async () => {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || "kuppihub");
};

export async function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const db = await getDb();
    const col = db.collection("rate_limits");
    const now = new Date();
    const threshold = new Date(now.getTime() - windowMs);

    const updated = await col.findOneAndUpdate(
      { _id: key, windowStart: { $gte: threshold }, count: { $lt: limit } },
      { $inc: { count: 1 }, $set: { updatedAt: now } },
      { returnDocument: "after" }
    );

    if (updated && updated.value) {
      return { allowed: true, remaining: Math.max(0, limit - updated.value.count) };
    }

    const existing = await col.findOne({ _id: key });
    if (
      !existing ||
      !(existing.windowStart instanceof Date) ||
      typeof existing.count !== "number" ||
      existing.windowStart < threshold
    ) {
      await col.updateOne(
        { _id: key },
        {
          $set: {
            windowStart: now,
            count: 1,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
          },
        },
        { upsert: true }
      );

      return { allowed: true, remaining: Math.max(0, limit - 1) };
    }

    if (existing.count < limit) {
      const inc = await col.updateOne(
        { _id: key, count: existing.count },
        { $inc: { count: 1 }, $set: { updatedAt: now } }
      );
      if (inc.modifiedCount > 0) {
        return { allowed: true, remaining: Math.max(0, limit - (existing.count + 1)) };
      }
    }

    const retryAfterMs =
      existing.windowStart.getTime() + windowMs - now.getTime();

    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, retryAfterMs) };
  } catch (error) {
    console.error("Rate limit error:", error);
    return { allowed: false, remaining: 0, retryAfterMs: windowMs };
  }
}
