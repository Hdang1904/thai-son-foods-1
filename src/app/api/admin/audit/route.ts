import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || !hasPermission(session, 'audit.view')) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền xem nhật ký hoạt động.', code: 'FORBIDDEN' },
        { status: !session ? 401 : 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const storeCode = searchParams.get('storeCode');
    const username = searchParams.get('username');
    const search = searchParams.get('search');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        id, created_at, admin_id, admin_username, role, action,
        entity_type, entity_id, store_code, before_json, after_json, ip, user_agent
      FROM audit_logs
      WHERE 1=1
    `;
    const params: any[] = [];

    if (action) {
      params.push(action);
      sql += ` AND action = $${params.length}`;
    }

    if (entityType) {
      params.push(entityType);
      sql += ` AND entity_type = $${params.length}`;
    }

    if (storeCode) {
      params.push(storeCode);
      sql += ` AND store_code = $${params.length}`;
    }

    if (username) {
      params.push(`%${username.trim().toLowerCase()}%`);
      sql += ` AND LOWER(admin_username) LIKE $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (
        LOWER(admin_username) LIKE $${params.length} 
        OR LOWER(action) LIKE $${params.length} 
        OR LOWER(COALESCE(entity_id, '')) LIKE $${params.length}
        OR LOWER(COALESCE(store_code, '')) LIKE $${params.length}
      )`;
    }

    // Count total matching
    const countSql = `SELECT COUNT(*)::int AS total FROM (${sql}) AS filtered_logs`;
    const countRes = await query(countSql, params);
    const total = countRes.rows[0]?.total || 0;

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2};`;
    params.push(limit, offset);

    const res = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: res.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
