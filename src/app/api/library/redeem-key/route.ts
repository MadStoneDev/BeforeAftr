import { NextRequest, NextResponse } from "next/server";
import { getPocketBase } from "@/lib/library/pocketbase";

export async function POST(request: NextRequest) {
  try {
    const { key } = (await request.json()) as { key: string };

    if (!key?.trim()) {
      return NextResponse.json(
        { error: "Key is required" },
        { status: 400 },
      );
    }

    const pb = getPocketBase();

    const records = await pb
      .collection("ai_credit_keys")
      .getList(1, 1, { filter: `key = "${key.trim()}"` });

    if (records.items.length === 0) {
      return NextResponse.json(
        { error: "Invalid credit key" },
        { status: 404 },
      );
    }

    const record = records.items[0];

    if (record.redeemed_at) {
      return NextResponse.json(
        { error: "Key has already been redeemed" },
        { status: 409 },
      );
    }

    await pb.collection("ai_credit_keys").update(record.id, {
      redeemed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      credits: record.credits_total as number,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Redemption failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
