import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Home",
  description: "RydeGo – Share rides, save money. Find or offer rides.",
};

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/search");
  } else {
    redirect("/login");
  }
}
