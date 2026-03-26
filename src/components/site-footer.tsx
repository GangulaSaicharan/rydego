import Link from "next/link";
import { Instagram } from "lucide-react";
import { APP_NAME } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";

interface SiteFooterProps {
  className?: string;
  linkClassName?: string;
  showDividers?: boolean;
}

export function SiteFooter({
  className,
  linkClassName,
  showDividers = true,
}: SiteFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn("w-full py-6 text-center", className)}>
      <div className="flex flex-col items-center gap-y-2 mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Follow us on
        </span>
        <svg width="0" height="0" className="absolute pointer-events-none">
          <defs>
            <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f09433" />
              <stop offset="25%" stopColor="#e6683c" />
              <stop offset="50%" stopColor="#dc2743" />
              <stop offset="75%" stopColor="#cc2366" />
              <stop offset="100%" stopColor="#bc1888" />
            </linearGradient>
          </defs>
        </svg>
        <Link
          href="https://www.instagram.com/rydixo.official/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm hover:shadow-md transition-all hover:scale-110 group relative border border-transparent hover:border-pink-500/20"
          aria-label="Follow us on Instagram"
        >
          <Instagram
            className="relative z-10 size-7"
            style={{ stroke: "url(#instagram-gradient)" }}
          />
        </Link>
      </div>
      <div className="flex flex-col gap-y-2 text-sm text-muted-foreground font-medium mb-6">
        <div className="flex justify-center gap-x-4">
          <Link href="/about" className={cn("hover:text-primary transition-colors", linkClassName)}>
            About Us
          </Link>
          {showDividers && <span className="text-muted-foreground/30">&bull;</span>}
          <Link href="/contact" className={cn("hover:text-primary transition-colors", linkClassName)}>
            Contact Us
          </Link>
        </div>
        <div className="flex justify-center gap-x-4">
          <Link href="/privacy" className={cn("hover:text-primary transition-colors", linkClassName)}>
            Privacy Policy
          </Link>
          {showDividers && <span className="text-muted-foreground/30">&bull;</span>}
          <Link href="/terms" className={cn("hover:text-primary transition-colors", linkClassName)}>
            Terms of Service
          </Link>
        </div>
      </div>
      <p className="text-xs text-muted-foreground/60 leading-relaxed">
        &copy; {currentYear} {APP_NAME}. All rights reserved. <br /> Built for sharing, designed for simplicity.
      </p>
    </footer>
  );
}
