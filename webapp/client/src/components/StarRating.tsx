interface Props {
  value: number;
  size?: number;
}

/** Five-star display supporting fractional fill via a clipped overlay. */
export function StarRating({ value, size = 16 }: Props) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span className="relative inline-block leading-none" style={{ fontSize: size }} aria-label={`${value} out of 5`}>
      <span className="text-parchment-300">★★★★★</span>
      <span
        className="absolute left-0 top-0 overflow-hidden whitespace-nowrap text-gold-400"
        style={{ width: `${pct}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}
