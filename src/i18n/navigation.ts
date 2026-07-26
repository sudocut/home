import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware replacements for next/link and next/navigation. Always import Link
// from here — next/link would drop the /ko or /en prefix and 404.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
