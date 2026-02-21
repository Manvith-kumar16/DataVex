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

export function debounce(fn: Function, delay: number) {
  let timer: any
  return (...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function memoize(fn: Function) {
  const cache: Record<string, any> = {}
  return (...args: any[]) => {
    const key = JSON.stringify(args)
    if (cache[key]) return cache[key]
    cache[key] = fn(...args)
    return cache[key]
  }
}
