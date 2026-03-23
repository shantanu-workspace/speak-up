import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL;
    redirect(signInUrl || "/sign-in");
  }

  const user = await currentUser();
  if (user) {
    const supabase = createAdminClient();
    const email = user.emailAddresses[0]?.emailAddress ?? "";
    const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

    await supabase.from("users").upsert(
      {
        clerk_id: userId,
        email,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clerk_id" }
    );
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <h1 className="text-xl font-semibold text-indigo-700">SpeakUp</h1>
        <UserButton afterSignOutUrl="/" />
      </nav>
      <div className="flex flex-col items-center justify-center mt-24 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Welcome to SpeakUp! 🎙️</h2>
        <p className="text-gray-500 text-lg">Your English fluency journey starts here.</p>
      </div>
    </main>
  );
}
