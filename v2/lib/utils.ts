import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Short, display-friendly code for an entity id. Created-project ids are long
// slugs (e.g. "proj-veeva-rim-global-implementation-1-t1"); show just the
// trailing segment ("T1"). Short ids ("t1") pass through unchanged.
export function shortId(id: string): string {
  return (id.split("-").pop() || id).toUpperCase();
}
