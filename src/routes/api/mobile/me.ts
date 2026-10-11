import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import type { Plan } from "@/lib/qr/types";

/**
 * The signed-in mobile user + plan. Auth is ONLY `Authorization: Bearer
 * <session token>` (Better Auth `bearer` plugin, token returned by sign-in in
 * the `set-auth-token` header). Cookies are ignored here on purpose, so a
 * cross-site page can't ride a browser session through this endpoint, and no
 * CORS headers are sent: the native app calls it through the native HTTP layer.
 */
export const Route = createFileRoute("/api/mobile/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const header = request.headers.get("authorization") ?? "";
        const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
        if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

        const { auth } = await import("@/lib/auth/server");
        const session = await auth.api.getSession({
          headers: new Headers({ authorization: `Bearer ${token}` }),
        });
        const user = session?.user;
        if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

        const sql = await getSql();
        await sql`
          insert into profiles (user_id, plan) values (${user.id}, 'free')
          on conflict (user_id) do nothing
        `;
        const rows = await sql<{ plan: string }>`
          select plan from profiles where user_id = ${user.id}
        `;
        const raw = rows[0]?.plan;
        const plan: Plan = raw === "premium" || raw === "business" ? raw : "free";
        return Response.json(
          {
            user: {
              id: user.id,
              name: user.name ?? null,
              email: user.email ?? null,
              image: user.image ?? null,
            },
            plan,
          },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
