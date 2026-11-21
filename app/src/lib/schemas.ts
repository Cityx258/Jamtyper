import { z } from "zod";
import { NOTES } from "./notes";
import { VISIBILITIES } from "./room-protocol";
import { DISPLAY_NAME_MAX, DISPLAY_NAME_MIN } from "./username";

const id = z.string().min(1).max(64);

export const displayNameSchema = z
  .string()
  .transform((v) => v.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim())
  .refine((v) => [...v].length >= DISPLAY_NAME_MIN && [...v].length <= DISPLAY_NAME_MAX);

export const roomCodeInput = z.string().max(16);

export const createRoomSchema = z
  .object({ visibility: z.enum(VISIBILITIES).optional(), leaveOther: z.boolean().optional() })
  .strict();

export const joinRoomSchema = z
  .object({
    code: roomCodeInput,
    invite: z.string().max(64).optional(),
    leaveOther: z.boolean().optional(),
  })
  .strict();

export const visibilitySchema = z.object({ visibility: z.enum(VISIBILITIES) }).strict();
export const watchSchema = z.object({ watching: z.boolean() }).strict();
export const approveSchema = z.object({ memberId: id, approve: z.boolean() }).strict();
export const memberSchema = z.object({ memberId: id }).strict();
export const teamSchema = z.object({ memberId: id, team: z.union([z.literal(0), z.literal(1)]) }).strict();
export const noteSchema = z.object({ note: z.enum(NOTES) }).strict();

const count = z.number().int().min(0).max(1_000_000);

export const progressSchema = z
  .object({
    position: count,
    mistakes: count,
    errors: count.optional(),
    missed: z
      .record(z.string().refine((k) => [...k].length === 1), count)
      .refine((m) => Object.keys(m).length <= 64),
  })
  .strict();

export const localeSchema = z.enum(["en", "fr"]);
export const themeSchema = z.enum(["system", "light", "dark"]);
export const avatarIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
export const raceIdSchema = z.uuid();
export const historyPageSchema = z.coerce.number().int().min(1).max(10_000).catch(1);

export const leaderboardSortSchema = z.enum(["wpm", "wins"]).catch("wpm");

export const usernameSchema = z.string().regex(/^[a-zA-Z0-9_.]{3,20}$/);
export const passwordSchema = z.string().min(8).max(128);

export const resetPasswordSchema = z.object({
  username: z.string().max(64),
  code: z.string().max(64),
  password: z.string().max(1024),
});

export const addPasswordSchema = z.object({
  username: z.string().max(64).optional(),
  password: z.string().max(1024),
});

export const avatarUploadSchema = z.instanceof(File);
