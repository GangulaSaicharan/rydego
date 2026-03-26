import type { Metadata } from "next";
import Link from "next/link";
import { Mail, ArrowLeft, Globe, Shield } from "lucide-react";

import { APP_NAME } from "@/lib/constants/brand";
import { buttonVariants, } from "@/components/ui";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Contact ${APP_NAME} for support, feedback, or inquiries.`,
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  const contactEmail = "rydixo.ofiifcal@gmail.com";

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,var(--background),var(--background),oklch(0.98_0.01_175/0.3))] p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45%] aspect-square bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto pt-8 sm:pt-12">
        <header className="mb-10 text-center sm:text-left">
          <Link
            href="/search"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Search
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Get in touch
          </h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-lg leading-relaxed">
            Have questions about {APP_NAME}? We&apos;re here to help you make your journey smoother and more affordable.
          </p>
        </header>

        <div className="rounded-[2rem] overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="space-y-10">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm text-primary">
                  <Mail className="h-8 w-8" />
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Email Support
                  </h2>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-2xl sm:text-3xl font-bold text-foreground hover:text-primary transition-colors break-all"
                  >
                    {contactEmail}
                  </a>
                  <p className="text-muted-foreground mt-2">
                    Expect a response within 24-48 hours.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-background/50 border border-border/40">
                  <Globe className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">Community Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with other riders and drivers in our network.
                  </p>
                </div>
                <div className="p-6 rounded-3xl bg-background/50 border border-border/40">
                  <Shield className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">Safety First</h3>
                  <p className="text-sm text-muted-foreground">
                    Report any safety concerns or issues with your rides.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 text-center">
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Looking for information on how we handle your data?
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href="/privacy"
                    className={buttonVariants({ variant: "outline", className: "rounded-full px-6" })}
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/terms"
                    className={buttonVariants({ variant: "outline", className: "rounded-full px-6" })}
                  >
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      <SiteFooter />
    </div>
  );
}
