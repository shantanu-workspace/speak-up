import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();
  
  if (userId) {
    const dashboardUrl = process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL;
    redirect(dashboardUrl || "/dashboard");
  } else {
    const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL;
    redirect(signInUrl || "/sign-in");
  }
}