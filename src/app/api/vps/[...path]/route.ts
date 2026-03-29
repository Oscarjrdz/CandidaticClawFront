import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Use nodejs to prevent fetch streaming limits from Vercel Edge on free tiers (which sometimes timeout), or we can use Node stream
// But actually edge runtime handles SSE the best natively on Nextjs 15
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const vpsUrl = `http://64.23.180.202:3000/api/${resolvedParams.path.join('/')}`;
  const url = new URL(req.url);
  const targetUrl = new URL(vpsUrl);
  targetUrl.search = url.search;

  try {
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'x-api-key': req.headers.get('x-api-key') || 'super_secret_key_123',
        'Accept': 'text/event-stream'
      }
    });

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Proxy fail' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const vpsUrl = `http://64.23.180.202:3000/api/${resolvedParams.path.join('/')}`;
  try {
    const body = await req.text();
    const response = await fetch(vpsUrl, {
      method: 'POST',
      body: body || undefined,
      headers: {
        'Content-Type': req.headers.get('content-type') || 'application/json',
        'x-api-key': req.headers.get('x-api-key') || 'super_secret_key_123'
      }
    });
    return new NextResponse(response.body, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Proxy fail' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const vpsUrl = `http://64.23.180.202:3000/api/${resolvedParams.path.join('/')}`;
  try {
    const body = await req.text();
    const response = await fetch(vpsUrl, {
      method: 'PUT',
      body: body || undefined,
      headers: {
        'Content-Type': req.headers.get('content-type') || 'application/json',
        'x-api-key': req.headers.get('x-api-key') || 'super_secret_key_123'
      }
    });
    return new NextResponse(response.body, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Proxy fail' }, { status: 500 });
  }
}
