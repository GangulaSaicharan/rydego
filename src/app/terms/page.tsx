import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants/brand";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: `Terms and Conditions for using ${APP_NAME} – ride-sharing platform.`,
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,var(--background),var(--background),oklch(0.98_0.01_175/0.3))] p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45%] aspect-square bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto">
        <header className="mb-8">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            ← Back to sign in
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            Terms and Conditions
          </h1>
          <p className="text-muted-foreground mt-2">
            Last updated: March 2026. Please read these terms before using{" "}
            {APP_NAME}.
          </p>
        </header>

        <article className="p-4 sm:p-6 space-y-8 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using {APP_NAME} (&quot;the Service&quot;), you agree to be
              bound by these Terms and Conditions. If you do not agree, do not
              use the Service. We may update these terms from time to time; your
              continued use after changes constitutes acceptance of the updated
              terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {APP_NAME} is a ride-sharing platform that connects riders with
              drivers for shared trips. We facilitate listing rides, searching
              for rides, booking seats, and communication between users. We do
              not employ drivers or operate vehicles; users offer and request
              rides at their own arrangement.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Rides shown on the platform are listed by users. We display them
              as provided and do not verify, endorse, or guarantee their
              accuracy, safety, timing, or outcome. We are not responsible for
              any ride you see or book through the Service—responsibility for
              the ride lies solely between the driver and the rider(s).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Eligibility and Account</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You must be at least 18 years old and able to form a binding
              contract to use the Service. You sign in using a supported
              provider (e.g. Google); you are responsible for keeping your
              account secure and for all activity under your account.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You must provide accurate profile information. Offering rides as a
              driver or booking as a rider is subject to any additional
              requirements we may specify (e.g. phone number verification).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Use of the Service</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Use the Service only for lawful ride-sharing. Do not use it for
                commercial transport services unless permitted by local law.
              </li>
              <li>
                Do not post false, misleading, or offensive content, or misuse
                other users&apos; data.
              </li>
              <li>
                Drivers are responsible for their vehicle, licence, insurance,
                and compliance with local laws. Riders are responsible for
                their conduct during the trip.
              </li>
              <li>
                Cancellation and no-show policies may apply; repeated abuse may
                result in restriction or termination of your account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Bookings and Payments</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you book a seat, you agree to the price and terms shown for
              that ride. Payment arrangements between driver and rider are as
              agreed between them, unless we explicitly facilitate payment
              through the Service. We are not responsible for disputes over
              payment or fare outside our systems.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              {APP_NAME} is a platform connecting users. We are not a transport
              operator. We are not responsible for the rides we show—they are
              user-generated listings displayed as-is. We do not verify, endorse,
              or guarantee the quality, safety, accuracy, or legality of any
              ride, listing, or user conduct. To the fullest extent permitted
              by law, we exclude liability for indirect, incidental, or
              consequential damages arising from your use of the Service or any
              ride arranged through it. Your use of the Service and any rides is
              at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may suspend or terminate your access to the Service for
              violation of these terms or for any other reason. You may stop
              using the Service at any time. Provisions that by their nature
              should survive (e.g. liability limits, dispute resolution) will
              survive termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. General</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by the laws of India. If any part is
              held unenforceable, the rest remains in effect. Our failure to
              enforce a right does not waive that right. For questions, contact
              us through the channels provided in the app or on our website.
            </p>
          </section>
        </article>
      </div>
      <SiteFooter />
    </div>
  );
}
