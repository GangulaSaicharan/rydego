import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Users, ShieldCheck, Zap, Heart, Leaf } from "lucide-react";

import { APP_NAME } from "@/lib/constants/brand";
import { Card, CardContent, buttonVariants } from "@/components/ui";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn more about ${APP_NAME} – our mission, vision, and why we are building the future of ride-sharing.`,
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  const stats = [
    { label: "Community Members", value: "1,000+" },
    { label: "Safe Rides Completed", value: "500+" },
    { label: "Cities Connected", value: "8+" },
  ];

  const features = [
    {
      title: "Community Driven",
      description: "We believe in the power of community. Our platform connects people going the same way, fostering new connections and shared experiences.",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      title: "Safety First",
      description: "Your safety is our top priority. We implement rigourous verification processes and community ratings to ensure a secure environment for everyone.",
      icon: ShieldCheck,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      title: "Cost Efficient",
      description: "Sharing rides means sharing costs. Save money on your daily commute or long-distance travels while helping others do the same.",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      title: "Eco-Friendly",
      description: "Reduce your carbon footprint by filling empty seats. Together, we can decrease traffic congestion and environmental impact.",
      icon: Leaf,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,var(--background),var(--background),oklch(0.98_0.01_175/0.3))] p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-5%] right-[-5%] w-[40%] aspect-square bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[20%] left-[-10%] w-[50%] aspect-square bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto pt-8 sm:pt-16 pb-20">
        <header className="mb-16 text-center">
          <Link
            href="/search"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Search
          </Link>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground mb-6">
            About <span className="text-primary">{APP_NAME}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Revolutionizing the way we travel by connecting people, reducing costs, and building a more sustainable future, one ride at a time.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <Card className="border-border/60 shadow-xl bg-card/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border-none ring-1 ring-black/5">
            <CardContent className="p-8 sm:p-10">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Heart className="h-6 w-6 text-red-500" />
                Our Mission
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                At {APP_NAME}, our mission is to make transportation more accessible, affordable, and social. We aim to transform every empty car seat into an opportunity for connection and savings, creating a global network of trusted travelers.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-xl bg-card/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border-none ring-1 ring-black/5">
            <CardContent className="p-8 sm:p-10">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
                <Zap className="h-6 w-6" />
                Our Vision
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                We envision a world where sharing a ride is the first choice for everyone. A world with fewer cars on the road, cleaner air, and communities that are more connected than ever before.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose {APP_NAME}?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="group p-8 rounded-[2rem] bg-white border border-border/40 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-7 w-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-primary rounded-[3rem] p-10 sm:p-16 text-primary-foreground text-center relative overflow-hidden shadow-2xl shadow-primary/30">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 relative z-10">Our Impact So Far</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
            {stats.map((stat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-4xl sm:text-5xl font-extrabold">{stat.value}</div>
                <div className="text-primary-foreground/80 font-medium uppercase tracking-wider text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 text-center">
          <h2 className="text-2xl font-bold mb-6">Ready to join the movement?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/search"
              className={buttonVariants({ size: "lg", className: "rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-primary/20" })}
            >
              Find a Ride
            </Link>
            <Link
              href="/contact"
              className={buttonVariants({ size: "lg", variant: "outline", className: "rounded-full px-8 h-12 text-base font-semibold bg-white/50 backdrop-blur-sm" })}
            >
              Contact Support
            </Link>
          </div>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
