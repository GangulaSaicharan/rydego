import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants/brand";

export const metadata: Metadata = {
  title: `${APP_NAME} - Search for rides`,
  description: APP_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  redirect("/search");
}
