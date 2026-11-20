"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { updateDisplayName } from "@/app/profile-actions";
import Avatar from "@/components/Avatar";
import { primaryButton, secondaryButton, smallButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";
import { AVATAR_MAX_BYTES, AVATAR_TYPES, checkAvatar, type AvatarError } from "@/lib/avatar";
import { cleanGuestName, DISPLAY_NAME_MAX, DISPLAY_NAME_MIN } from "@/lib/username";

type Props = {
  name: string;
  image: string | null;
  t: Dict["settings"]["profile"];
};

export default function ProfileForm({ name, image, t }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(name);
  const [nameState, setNameState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [photoState, setPhotoState] = useState<"idle" | "uploading" | "saved">("idle");
  const [photoError, setPhotoError] = useState<AvatarError | "generic" | null>(null);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!cleanGuestName(draft)) {
      setNameState("error");
      return;
    }
    setNameState("saving");
    const res = await updateDisplayName(draft);
    setNameState(res.ok ? "saved" : "error");
    if (res.ok) router.refresh();
  }

  async function upload(file: File) {
    setPhotoError(null);
    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (file.size > AVATAR_MAX_BYTES) return setPhotoError("too_big");
    if (checkAvatar(bytes)) return setPhotoError("bad_type");
    setPhotoState("uploading");
    const body = new FormData();
    body.set("photo", file);
    try {
      const res = await fetch("/api/avatar", { method: "POST", body });
      const data = (await res.json()) as { error?: AvatarError };
      if (!res.ok) {
        setPhotoError(data.error ?? "generic");
        setPhotoState("idle");
        return;
      }
      setPhotoState("saved");
      router.refresh();
    } catch {
      setPhotoError("generic");
      setPhotoState("idle");
    }
  }

  async function remove() {
    setPhotoError(null);
    const res = await fetch("/api/avatar", { method: "DELETE" });
    if (!res.ok) return setPhotoError("generic");
    setPhotoState("idle");
    router.refresh();
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <form onSubmit={saveName} className="flex max-w-sm flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-muted">{t.nameLabel}</span>
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setNameState("idle");
            }}
            minLength={DISPLAY_NAME_MIN}
            maxLength={DISPLAY_NAME_MAX}
            required
            aria-describedby="name-hint"
            className="rounded-lg border border-line bg-bg/70 px-4 py-3 text-ink focus:border-teal focus:outline-none"
          />
        </label>
        <p id="name-hint" className="text-xs text-muted">
          {t.nameHint}
        </p>
        <button
          type="submit"
          disabled={nameState === "saving" || draft.trim() === name}
          className={`self-start ${primaryButton}`}
        >
          {nameState === "saving" ? t.saving : t.saveName}
        </button>
        <p role="status" className="text-sm">
          {nameState === "saved" && <span className="text-teal">{t.nameSaved}</span>}
          {nameState === "error" && <span className="text-danger">{t.nameError}</span>}
        </p>
      </form>

      <div className="flex flex-col gap-3">
        <span className="text-sm text-muted">{t.photoLabel}</span>
        <div className="flex items-center gap-4">
          <Avatar name={name} image={image} size={72} alt={t.photoAlt.replace("{name}", name)} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={photoState === "uploading"}
              className={secondaryButton}
            >
              {photoState === "uploading" ? t.uploading : t.choosePhoto}
            </button>
            {image && (
              <button type="button" onClick={remove} className={smallButton}>
                {t.removePhoto}
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={AVATAR_TYPES.join(",")}
          aria-label={t.choosePhoto}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void upload(file);
          }}
        />
        <p className="text-xs text-muted">{t.photoHint}</p>
        <p role="status" className="text-sm">
          {photoState === "saved" && <span className="text-teal">{t.photoSaved}</span>}
          {photoError && <span className="text-danger">{t.photoErrors[photoError]}</span>}
        </p>
      </div>
    </div>
  );
}
