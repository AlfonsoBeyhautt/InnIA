import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LandingPage } from "@/components/landing/landing-page";

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect("/app/inicio");
  }
  return <LandingPage />;
}
