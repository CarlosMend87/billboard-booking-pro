import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTruncatedId(id: string): string {
  return id.slice(-6);
}

export function formatShortId(id: string): string {
  if (id.length < 6) return id;
  return id.slice(-6);
}
