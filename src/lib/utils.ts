import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Evidence = {
  claim: string
  sourceUrl: string
  snippet: string
  reliability: number
  type: "VERIFIED" | "INFERRED"
}

export type Signal = {
  category: string
  value: string
  evidence: Evidence[]
}

export function debounce<T extends (...args: never[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function memoize<T extends (...args: never[]) => unknown>(fn: T) {
  const cache: Record<string, ReturnType<T>> = {}
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args)
    if (key in cache) return cache[key]
    const result = fn(...args)
    cache[key] = result
    return result
  }
}
