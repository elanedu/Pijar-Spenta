/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API Backup Database
 * GET /api/admin/backup
 * Mengekspor seluruh 10 lembar sheet Google Sheets ke format JSON
 */

import { checkRole } from '@/lib/session.ts';
import { readSheet } from '@/lib/sheets.ts';
import { STRUKTUR_DATABASE } from '@/lib/constants.ts';
import { apiSuccess, apiError, getTimestamp } from '@/lib/utils.ts';

export async function GET(request: Request) {
  try {
    const auth = await checkRole(request, ['admin']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const sheetNames = Object.keys(STRUKTUR_DATABASE);
    const backupData: Record<string, any[]> = {};
    let totalRecords = 0;

    // Ambil seluruh data dari setiap sheet
    for (const sheetName of sheetNames) {
      const rows = await readSheet<any>(sheetName);
      backupData[sheetName] = rows;
      totalRecords += rows.length;
    }

    const backupPayload = {
      app: 'PIJAR SPENTA',
      version: '1.0.0',
      exportedAt: getTimestamp(),
      spreadsheet: 'EDULOG_DATABASE',
      summary: {
        totalSheets: sheetNames.length,
        totalRecords,
      },
      database: backupData,
    };

    return new Response(
      JSON.stringify(apiSuccess(backupPayload, 'Backup database berhasil diekspor.')),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="pijar-spenta-backup-${Date.now()}.json"`,
        },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal membuat backup: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
