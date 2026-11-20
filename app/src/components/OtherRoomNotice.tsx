import Link from "next/link";
import { smallButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";

type Props = {
  code: string;
  t: Dict["room"]["otherRoom"];
  onLeave: () => void;
};

export default function OtherRoomNotice({ code, t, onLeave }: Props) {
  return (
    <div role="alert" className="mt-3 max-w-sm text-sm">
      <p className="text-ink">{t.text.replace("{code}", code)}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={onLeave} className={smallButton}>
          {t.leave}
        </button>
        {code && (
          <Link href={`/room/${code}`} className={smallButton}>
            {t.back.replace("{code}", code)}
          </Link>
        )}
      </div>
    </div>
  );
}
