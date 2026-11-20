import Image from "next/image";

type Props = {
  name: string;
  image: string | null;
  size?: number;
  alt: string;
  className?: string;
};

function hue(name: string): number {
  let h = 0;
  for (const c of name) h = (h * 31 + c.codePointAt(0)!) % 360;
  return h;
}

export function initials(name: string): string {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

export default function Avatar({ name, image, size = 32, alt, className = "" }: Props) {
  if (image) {
    return (
      <Image
        src={image}
        alt={alt}
        width={size}
        height={size}
        unoptimized
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={alt}
      className={`grid shrink-0 place-items-center rounded-full font-mono font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.38),
        background: `hsl(${hue(name)} 45% 32%)`,
      }}
    >
      {initials(name)}
    </span>
  );
}
