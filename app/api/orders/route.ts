import { NextResponse } from 'next/server';
import { readOrders, writeOrders } from '../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const orders = readOrders();
    return NextResponse.json(orders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const order = await req.json();
    if (!order || !order.id) {
      return NextResponse.json({ error: 'Order data required' }, { status: 400 });
    }
    const orders = readOrders();
    const idx = orders.findIndex((o: any) => o.id === order.id);
    if (idx !== -1) {
      orders[idx] = { ...orders[idx], ...order };
    } else {
      orders.unshift(order);
    }
    writeOrders(orders);
    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
