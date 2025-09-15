import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  
  const url = new URL('/api/shop/items', req.url);
  const upstream = await fetch(url.toString(), { cache: 'no-store' });
  const data = await upstream.json().catch(() => ({ items: [] }));
  return NextResponse.json(data, { status: upstream.status });
}
