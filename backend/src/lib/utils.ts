import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merges tailwind classes cleanly without duplicates
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Type helpers for Svelte 5 snippets & props
export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, "child"> : T;

export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, "children"> : T;

export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;

export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
	ref?: U | null;
};
