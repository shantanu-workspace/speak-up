
import { auth, currentUser } from "@clerk/nextjs/server";

import { createAdminClient } from "@/lib/supabase/admin";

import { NextResponse } from "next/server";

export async function POST() {

  try {

    const { userId } = await auth();

    if (!userId) {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    }

    const user = await currentUser();

    if (!user) {

      return NextResponse.json({ error: "User not found" }, { status: 404 });

    }

    const supabase = createAdminClient();

    const email = user.emailAddresses[0]?.emailAddress ?? "";

    const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

    const { data, error } = await supabase

      .from("users")

      .upsert(

        {

          clerk_id: userId,

          email,

          full_name: fullName,

          updated_at: new Date().toISOString(),

        },

        { onConflict: "clerk_id" }

      )

      .select()

      .single();

    if (error) {

      console.error("Supabase sync error:", error);

      return NextResponse.json({ error: error.message }, { status: 500 });

    }

    return NextResponse.json({ user: data });

  } catch (err) {

    console.error("Sync error:", err);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });

  }

}

