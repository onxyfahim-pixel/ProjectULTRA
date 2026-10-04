import { NextRequest, NextResponse } from 'next/server';
import { erpStore } from '@/lib/db/store';
import { mysqlManager } from '@/lib/db/mysql-client';
import { verifyToken, DEMO_USERS } from '@/lib/auth/jwt';
import { BuyerOrder } from '@/lib/types/modules';

function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    token = req.cookies.get('erp_token')?.value || '';
  }
  return (token ? verifyToken(token) : null) || DEMO_USERS[0];
}

// GET: Load all buyer orders from MySQL (with cache fallback)
export async function GET() {
  try {
    let orders: BuyerOrder[] = [];
    if (mysqlManager.getConnectedStatus()) {
      orders = await mysqlManager.loadBuyerOrders();
    }
    if (!orders || orders.length === 0) {
      orders = erpStore.getBuyerOrders();
    }

    return NextResponse.json({
      success: true,
      orders,
      isMysqlConnected: mysqlManager.getConnectedStatus(),
      count: orders.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Create or Update Buyer Order (with 9-Stage WIP Record)
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const orderData: BuyerOrder = body.order || body;

    if (!orderData.orderNumber || !orderData.buyerName) {
      return NextResponse.json(
        { success: false, error: 'Order Number and Buyer Name are required' },
        { status: 400 }
      );
    }

    const saved = erpStore.upsertBuyerOrder(orderData, user);

    return NextResponse.json({
      success: true,
      order: saved,
      isMysqlConnected: mysqlManager.getConnectedStatus(),
      message: `Order ${saved.orderNumber} persisted to database with WIP Record.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

// DELETE: Remove Buyer Order
export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const url = new URL(req.url);
    const id = url.searchParams.get('id') || '';

    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const deleted = erpStore.deleteBuyerOrder(id, user);

    return NextResponse.json({
      success: deleted,
      message: deleted ? `Order ${id} removed successfully.` : `Order ${id} not found.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
