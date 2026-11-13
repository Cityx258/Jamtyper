import type { Provider } from "@/lib/auth";

export const METHODS = ["credential", "discord", "github"] as const;
export type Method = (typeof METHODS)[number];

export type MethodView = {
  method: Method;
  accountId: string | null;
  available: boolean;
  canUnlink: boolean;
};

export function methodViews(
  accounts: { id: string; providerId: string }[],
  enabled: readonly Provider[],
): MethodView[] {
  const linked = METHODS.map((m) => accounts.find((a) => a.providerId === m)?.id ?? null);
  const count = linked.filter(Boolean).length;
  return METHODS.map((method, i) => ({
    method,
    accountId: linked[i],
    available: method === "credential" || enabled.includes(method),
    canUnlink: linked[i] !== null && method !== "credential" && count > 1,
  }));
}
