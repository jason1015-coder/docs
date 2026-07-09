export const WHITEPAPER_STATUSES = [
  "Draft",
  "In public review",
  "Build approved",
  "Building",
  "Shipped",
  "Paused",
  "Declined",
  "Superseded",
] as const;

export type WhitepaperStatus = (typeof WHITEPAPER_STATUSES)[number];

interface StatusBadgeProps {
  status: string;
  reviewOpens?: string;
  reviewCloses?: string;
}

const STATUS_STYLES: Record<WhitepaperStatus, string> = {
  Draft: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  "In public review": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Build approved": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Building: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Shipped: "bg-green-500/15 text-green-400 border-green-500/30",
  Paused: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Declined: "bg-red-500/15 text-red-400 border-red-500/30",
  Superseded: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

function matchStatus(value: string): WhitepaperStatus | null {
  const normalized = value.trim().toLowerCase();
  return (
    WHITEPAPER_STATUSES.find((s) => s.toLowerCase() === normalized) ?? null
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysUntil(iso: string): number | null {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function StatusBadge({
  status,
  reviewOpens,
  reviewCloses,
}: StatusBadgeProps) {
  const matched = matchStatus(status);
  const style = matched
    ? STATUS_STYLES[matched]
    : "bg-gray-500/15 text-gray-400 border-gray-500/30";

  const reviewText = buildReviewText(matched, reviewOpens, reviewCloses);

  return (
    <span className="not-prose inline-flex items-center gap-2 text-sm">
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
      >
        {status}
      </span>
      {reviewText && (
        <span className="text-[var(--x-color-fg-muted,#888)]">
          {reviewText}
        </span>
      )}
    </span>
  );
}

/**
 * Text for the review window shown next to the status badge. When a paper is
 * actively in review we count down to the close date; for any other status we
 * still surface the window (opens/closes) whenever the dates are present, so a
 * paused, approved, or shipped paper keeps showing when its review ran.
 */
function buildReviewText(
  status: WhitepaperStatus | null,
  reviewOpens?: string,
  reviewCloses?: string,
): string | null {
  if (status === "In public review" && reviewCloses) {
    const remaining = daysUntil(reviewCloses);
    if (remaining !== null && remaining > 0) {
      return `Closes in ${remaining} day${remaining === 1 ? "" : "s"} (${formatDate(reviewCloses)})`;
    }
    if (remaining !== null && remaining <= 0) {
      return `Review window closed ${formatDate(reviewCloses)}`;
    }
    return `Closes ${formatDate(reviewCloses)}`;
  }

  if (reviewOpens && reviewCloses) {
    return `Review: ${formatDate(reviewOpens)} to ${formatDate(reviewCloses)}`;
  }
  if (reviewCloses) return `Review closed ${formatDate(reviewCloses)}`;
  if (reviewOpens) return `Review opened ${formatDate(reviewOpens)}`;
  return null;
}
