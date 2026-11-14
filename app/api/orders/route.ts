import { NextResponse } from 'next/server';
import { readOrders } from '../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const orders = readOrders();
    return NextResponse.json(orders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
