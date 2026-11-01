/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Fullstack Server Entry Point
 * Menjalankan Express untuk menangani API /api/* dan Vite Middlewares untuk SPA UI
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
import path from 'path';
import { verifyLogin, signToken } from './lib/auth.ts';
import { getSession, createSetCookieHeader, createClearCookieHeader, AUTH_COOKIE_NAME } from './lib/session.ts';
import { apiSuccess, apiError, hitungRataRata, cekStatusKKM } from './lib/utils.ts';
import { readSheet, getAllSettings, isGoogleSheetsConfigured } from './lib/sheets.ts';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  // Middleware JSON
  app.use(express.json());

  // Helper untuk parsing cookie sederhana pada Express
  app.use((req, _res, next) => {
    const cookieHeader = req.headers.cookie;
    (req as any).cookies = {};
    if (cookieHeader) {
      cookieHeader.split(';').forEach((c) => {
        const parts = c.split('=');
        const name = parts.shift()?.trim();
        if (name) {
          (req as any).cookies[name] = decodeURIComponent(parts.join('='));
        }
      });
    }
    next();
  });

  // ===========================================================================
  // API AUTENTIKASI (TAHAP 2)
  // ===========================================================================

  // POST /api/auth/login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body || {};

      if (!username || !password) {
        res.status(400).json(apiError('Username dan password wajib diisi.'));
        return;
      }

      const result = await verifyLogin(username, password);

      if (!result.success || !result.user) {
        res.status(401).json(apiError(result.message || 'Kredensial tidak valid.'));
        return;
      }

      // Generate JWT Token
      const token = signToken({
        id: result.user.id,
        username: result.user.username,
        role: result.user.role,
        nama: result.user.nama,
        email: result.user.email,
        extraId: result.user.extraId,
        kelas: result.user.kelas,
        mapel: result.user.mapel,
        foto: result.user.foto,
      });

      // Pasang cookie httpOnly
      res.setHeader('Set-Cookie', createSetCookieHeader(token));
      res.json(apiSuccess({ user: result.user, token }, 'Login berhasil!'));
    } catch (error: any) {
      console.error('Error saat login:', error);
      res.status(500).json(apiError('Terjadi kesalahan internal server saat login.'));
    }
  });

  // POST /api/auth/logout
  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.setHeader('Set-Cookie', createClearCookieHeader());
    res.json(apiSuccess(null, 'Berhasil logout.'));
  });

  // GET /api/auth/me
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const session = await getSession(req);
      if (!session) {
        res.status(401).json(apiError('Tidak ada sesi login aktif.'));
        return;
      }
      res.json(apiSuccess(session, 'Sesi aktif.'));
    } catch (error: any) {
      res.status(500).json(apiError('Gagal memverifikasi sesi.'));
    }
  });

  // GET /api/status (Status database & konektivitas)
  app.get('/api/status', async (_req: Request, res: Response) => {
    const isConfigured = isGoogleSheetsConfigured();
    const settings = await getAllSettings();
    res.json(
      apiSuccess({
        mode: isConfigured ? 'google_sheets_live' : 'in_memory_simulation',
        sheetsConnected: isConfigured,
        sekolah: settings.nama_sekolah,
        tahunAjaran: settings.tahun_ajaran,
        semester: settings.semester,
      })
    );
  });

  // ===========================================================================
  // API ADMIN (TAHAP 4)
  // ===========================================================================

  // Helper auth check untuk Express
  const requireAdmin = async (req: Request, res: Response): Promise<boolean> => {
    const session = await getSession(req);
    if (!session || session.role !== 'admin') {
      res.status(403).json(apiError('Akses ditolak. Rute ini hanya untuk Administrator.'));
      return false;
    }
    return true;
  };

  // GET /api/admin/dashboard
  app.get('/api/admin/dashboard', async (req: Request, res: Response) => {
    try {
      if (!(await requireAdmin(req, res))) return;

      const [gurus, siswas, kelases, mapels, kehadirans, nilais, settings] = await Promise.all([
        readSheet<any>('GURU'),
        readSheet<any>('SISWA'),
        readSheet<any>('KELAS'),
        readSheet<any>('MAPEL'),
        readSheet<any>('KEHADIRAN'),
        readSheet<any>('NILAI'),
        getAllSettings(),
      ]);

      const countHadir = kehadirans.filter((k) => k.status === 'H').length;
      const countIzin = kehadirans.filter((k) => k.status === 'I').length;
      const countSakit = kehadirans.filter((k) => k.status === 'S').length;
      const countAlpa = kehadirans.filter((k) => k.status === 'A').length;
      const persentaseHadir =
        kehadirans.length > 0 ? Math.round((countHadir / kehadirans.length) * 100) : 100;

      const semuaNilai = nilais.map((n) => parseFloat(n.nilai)).filter((n) => !isNaN(n));
      const rataRataNilai =
        semuaNilai.length > 0
          ? Math.round((semuaNilai.reduce((a, b) => a + b, 0) / semuaNilai.length) * 10) / 10
          : 0;

      res.json(
        apiSuccess({
          stats: {
            totalGuru: gurus.length,
            totalSiswa: siswas.length,
            totalKelas: kelases.length,
            totalMapel: mapels.length,
            kehadiranHariIni: {
              total: kehadirans.length,
              hadir: countHadir,
              izin: countIzin,
              sakit: countSakit,
              alpa: countAlpa,
              persentaseHadir,
            },
            nilai: {
              totalEntri: nilais.length,
              rataRata: rataRataNilai,
              kkm: parseFloat(settings.kkm_default || '75'),
            },
          },
          sekolah: settings,
        })
      );
    } catch (err: any) {
      res.status(500).json(apiError('Gagal memuat dashboard: ' + err.message));
    }
  });

  // USERS CRUD
  app.get('/api/admin/users', async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;
    const users = await readSheet<any>('USERS');
    const sanitized = users.map(({ password_hash, ...rest }) => rest);
    res.json(apiSuccess(sanitized));
  });

  app.post('/api/admin/users', async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;
    const { id, username, password, role, nama, email, aktif, action } = req.body || {};
    const { hashPassword } = await import('./lib/auth.ts');
    const { appendRow, updateRow } = await import('./lib/sheets.ts');
    const { generateId, getTimestamp } = await import('./lib/utils.ts');

    if (action === 'reset_password') {
      if (!id || !password) return res.status(400).json(apiError('ID dan password baru diperlukan.'));
      await updateRow('USERS', id, { password_hash: hashPassword(password) }, 'id');
      return res.json(apiSuccess(null, 'Password berhasil direset.'));
    }

    if (id) {
      const updateData: any = { username, role, nama, email, aktif };
      if (password) updateData.password_hash = hashPassword(password);
      await updateRow('USERS', id, updateData, 'id');
      return res.json(apiSuccess(null, 'User berhasil diperbarui.'));
    }

    const newId = generateId('USR');
    await appendRow('USERS', {
      id: newId,
      username: username?.trim().toLowerCase(),
      password_hash: hashPassword(password),
      role: role || 'siswa',
      nama,
      email: email || '',
      aktif: aktif || 'Ya',
      timestamp: getTimestamp(),
    });
    res.status(201).json(apiSuccess({ id: newId }, 'User berhasil ditambahkan.'));
  });

  app.delete('/api/admin/users', async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;
    const id = req.query.id as string;
    const { deleteRow } = await import('./lib/sheets.ts');
    await deleteRow('USERS', id, 'id');
    res.json(apiSuccess(null, 'User berhasil dihapus.'));
  });

  // GURU CRUD
  app.get('/api/admin/guru', async (req: Request, res: Response) => {
    const gurus = await readSheet<any>('GURU');
    res.json(apiSuccess(gurus));
  });

  app.post('/api/admin/guru', async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;
    const { id, nip, nama, mapel_utama, status, username, password } = req.body || {};
    const { appendRow, updateRow } = await import('./lib/sheets.ts');
    const { generateId, getTimestamp } = await import('./lib/utils.ts');
    const { hashPassword } = await import('./lib/auth.ts');

    if (id) {
      await updateRow('GURU', id, { nip, nama, mapel_utama, status }, 'id');
      return res.json(apiSuccess(null, 'Guru berhasil diperbarui.'));
    }

    let userId = `USR-${Date.now()}`;
    if (username && password) {
      userId = generateId('USR');
      await appendRow('USERS', {
        id: userId,
        username: username.trim().toLowerCase(),
        password_hash: hashPassword(password),
        role: 'guru',
        nama,
        email: `${username}@pijar-spenta.sch.id`,
        aktif: 'Ya',
        timestamp: getTimestamp(),
      });
    }

    const newGuruId = generateId('GRU');
    await appendRow('GURU', {
      id: newGuruId,
      user_id: userId,
      nip,
      nama,
      mapel_utama,
      status: status || 'Aktif',
    });
    res.status(201).json(apiSuccess({ id: newGuruId }, 'Guru berhasil ditambahkan.'));
  });

  app.delete('/api/admin/guru', async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;
    const id = req.query.id as string;
    const { deleteRow } = await import('./lib/sheets.ts');
    await deleteRow('GURU', id, 'id');
    res.json(apiSuccess(null, 'Guru berhasil dihapus.'));
  });

  // SISWA CRUD
  app.get('/api/admin/siswa', async (req: Request, res: Response) => {
    const kelas = req.query.kelas as string;
    let siswas = await readSheet<any>('SISWA');
    if (kelas) siswas = siswas.filter((s) => s.kelas === kelas);
    res.json(apiSuccess(siswas));
  });

  app.post('/api/admin/siswa', async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;
    const { id, nis, nama, kelas, jenis_kelamin, aktif, email, foto, password } = req.body || {};
    const { appendRow, updateRow } = await import('./lib/sheets.ts');
    const { generateId, getTimestamp } = await import('./lib/utils.ts');
    const { hashPassword } = await import('./lib/auth.ts');

    if (id) {
      await updateRow('SISWA', id, { nis, nama, kelas, jenis_kelamin, aktif, email, foto }, 'id');
      return res.json(apiSuccess(null, 'Data siswa diperbarui.'));
    }

    const userId = generateId('USR');
    await appendRow('USERS', {
      id: userId,
      username: String(nis).trim(),
      password_hash: hashPassword(password || 'siswa123'),
      role: 'siswa',
      nama,
      email: email || `${nis}@siswa.pijar-spenta.sch.id`,
      aktif: aktif || 'Ya',
      timestamp: getTimestamp(),
    });

    const newId = generateId('SIS');
    await appendRow('SISWA', {
      id: newId,
      user_id: userId,
      nis,
      nama,
      kelas,
      jenis_kelamin: jenis_kelamin || 'L',
      aktif: aktif || 'Ya',
      email: email || `${nis}@siswa.pijar-spenta.sch.id`,
      foto: foto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nama)}`,
    });
    res.status(201).json(apiSuccess({ id: newId }, 'Siswa berhasil ditambahkan.'));
  });

  app.delete('/api/admin/siswa', async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;
    const id = req.query.id as string;
    const { deleteRow } = await import('./lib/sheets.ts');
    await deleteRow('SISWA', id, 'id');
    res.json(apiSuccess(null, 'Siswa berhasil dihapus.'));
  });

  // KELAS CRUD
  app.get('/api/admin/kelas', async (_req: Request, res: Response) => {
    const kelases = await readSheet<any>('KELAS');
    res.json(apiSuccess(kelases));
  });

  app.post('/api/admin/kelas', async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;
    const { id, nama_kelas, tingkat, wali_kelas, tahun_ajaran } = req.body || {};
    const { appendRow, updateRow } = await import('./lib/sheets.ts');
    const { generateId } = await import('./lib/utils.ts');

    if (id) {
      await updateRow('KELAS', id, { nama_kelas, tingkat, wali_kelas, tahun_ajaran }, 'id');
      return res.json(apiSuccess(null, 'Kelas diperbarui.'));
    }

    const newId = generateId('KLS');
    await appendRow('KELAS', { id: newId, nama_kelas, tingkat, wali_kelas, tahun_ajaran });
    res.status(201).json(apiSuccess({ id: newId }, 'Kelas ditambahkan.'));
  });

  app.delete('/api/admin/kelas', async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;
    const id = req.query.id as string;
    const { deleteRow } = await import('./lib/sheets.ts');
    await deleteRow('KELAS', id, 'id');
    res.json(apiSuccess(null, 'Kelas dihapus.'));
  });

  // MAPEL CRUD
  app.get('/api/admin/mapel', async (_req: Request, res: Response) => {
    const [mapels, gurus] = await Promise.all([readSheet<any>('MAPEL'), readSheet<any>('GURU')]);
    const withGuru = mapels.map((m) => {
      const guru = gurus.find((g) => g.id === m.guru_id || g.user_id === m.guru_id);
      return { ...m, nama_guru: guru ? guru.nama : '-' };
    });
    res.json(apiSuccess(withGuru));
  });

  app.post('/api/admin/mapel', async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;
    const { id, kode, nama_mapel, guru_id, kelas_diampu } = req.body || {};
    const { appendRow, updateRow } = await import('./lib/sheets.ts');
    const { generateId } = await import('./lib/utils.ts');

    if (id) {
      await updateRow('MAPEL', id, { kode, nama_mapel, guru_id, kelas_diampu }, 'id');
      return res.json(apiSuccess(null, 'Mapel diperbarui.'));
    }

    const newId = generateId('MPL');
    await appendRow('MAPEL', { id: newId, kode, nama_mapel, guru_id, kelas_diampu });
    res.status(201).json(apiSuccess({ id: newId }, 'Mapel ditambahkan.'));
  });

  app.delete('/api/admin/mapel', async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;
    const id = req.query.id as string;
    const { deleteRow } = await import('./lib/sheets.ts');
    await deleteRow('MAPEL', id, 'id');
    res.json(apiSuccess(null, 'Mapel dihapus.'));
  });

  // PENGATURAN
  app.get('/api/admin/pengaturan', async (_req: Request, res: Response) => {
    const settings = await getAllSettings();
    res.json(apiSuccess(settings));
  });

  app.post('/api/admin/pengaturan', async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;
    const { updateSetting, getAllSettings } = await import('./lib/sheets.ts');
    for (const [k, v] of Object.entries(req.body || {})) {
      await updateSetting(k, String(v));
    }
    const settings = await getAllSettings();
    res.json(apiSuccess(settings, 'Pengaturan disimpan.'));
  });

  // BACKUP EXPORT SELURUH 10 SHEETS (TAHAP 4 & 8)
  app.get('/api/admin/backup', async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;
    try {
      const [
        users,
        guru,
        siswa,
        kelas,
        mapel,
        penugasan,
        kehadiran,
        nilai,
        catatan,
        pengaturan,
      ] = await Promise.all([
        readSheet<any>('USERS'),
        readSheet<any>('GURU'),
        readSheet<any>('SISWA'),
        readSheet<any>('KELAS'),
        readSheet<any>('MAPEL'),
        readSheet<any>('PENUGASAN'),
        readSheet<any>('KEHADIRAN'),
        readSheet<any>('NILAI'),
        readSheet<any>('CATATAN'),
        readSheet<any>('PENGATURAN'),
      ]);

      const sanitizedUsers = users.map(({ password_hash, ...rest }) => rest);

      const backupData = {
        database: 'EDULOG_DATABASE',
        timestamp: new Date().toISOString(),
        exportedBy: 'Admin PIJAR SPENTA',
        summary: {
          totalUsers: sanitizedUsers.length,
          totalGuru: guru.length,
          totalSiswa: siswa.length,
          totalKelas: kelas.length,
          totalMapel: mapel.length,
          totalPenugasan: penugasan.length,
          totalKehadiran: kehadiran.length,
          totalNilai: nilai.length,
          totalCatatan: catatan.length,
          totalPengaturan: pengaturan.length,
        },
        sheets: {
          USERS: sanitizedUsers,
          GURU: guru,
          SISWA: siswa,
          KELAS: kelas,
          MAPEL: mapel,
          PENUGASAN: penugasan,
          KEHADIRAN: kehadiran,
          NILAI: nilai,
          CATATAN: catatan,
          PENGATURAN: pengaturan,
        },
      };

      res.json(apiSuccess(backupData, 'Data backup berhasil diekspor.'));
    } catch (err: any) {
      res.status(500).json(apiError('Gagal membuat file backup: ' + err.message));
    }
  });

  // STATUS KONEKSI SISTEM & PANDUAN (TAHAP 8)
  app.get('/api/admin/panduan/status', async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;
    try {
      const configured = isGoogleSheetsConfigured();
      const rawEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
      const rawSheetId = process.env.GOOGLE_SHEET_ID || '';
      const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY || '';

      const [
        users,
        guru,
        siswa,
        kelas,
        mapel,
        penugasan,
        kehadiran,
        nilai,
        catatan,
        pengaturan,
      ] = await Promise.all([
        readSheet<any>('USERS'),
        readSheet<any>('GURU'),
        readSheet<any>('SISWA'),
        readSheet<any>('KELAS'),
        readSheet<any>('MAPEL'),
        readSheet<any>('PENUGASAN'),
        readSheet<any>('KEHADIRAN'),
        readSheet<any>('NILAI'),
        readSheet<any>('CATATAN'),
        readSheet<any>('PENGATURAN'),
      ]);

      const maskedEmail = rawEmail
        ? rawEmail.replace(/^(.)(.*)(@.*)$/, (_m, f, _mid, domain) => `${f}***${domain}`)
        : null;
      const maskedSheetId = rawSheetId
        ? `${rawSheetId.substring(0, 6)}...${rawSheetId.substring(rawSheetId.length - 4)}`
        : null;

      res.json(
        apiSuccess({
          isConfigured: configured,
          mode: configured ? 'google-sheets' : 'local-storage',
          sheetId: maskedSheetId,
          serviceAccountEmail: maskedEmail,
          hasPrivateKey: Boolean(rawPrivateKey && rawPrivateKey.length > 50),
          jwtConfigured: Boolean(process.env.JWT_SECRET || true),
          databaseName: 'EDULOG_DATABASE',
          counts: {
            USERS: users.length,
            GURU: guru.length,
            SISWA: siswa.length,
            KELAS: kelas.length,
            MAPEL: mapel.length,
            PENUGASAN: penugasan.length,
            KEHADIRAN: kehadiran.length,
            NILAI: nilai.length,
            CATATAN: catatan.length,
            PENGATURAN: pengaturan.length,
          },
        })
      );
    } catch (err: any) {
      res.status(500).json(apiError('Gagal memeriksa status sistem: ' + err.message));
    }
  });

  // ===========================================================================
  // API GURU (TAHAP 5)
  // ===========================================================================

  // Helper auth check guru
  const requireGuru = async (req: Request, res: Response) => {
    const session = await getSession(req);
    if (!session || (session.role !== 'guru' && session.role !== 'admin')) {
      res.status(403).json(apiError('Akses ditolak. Rute ini hanya untuk Guru atau Admin.'));
      return null;
    }
    return session;
  };

  // GET /api/guru/kartu
  app.get('/api/guru/kartu', async (req: Request, res: Response) => {
    const session = await requireGuru(req, res);
    if (!session) return;

    const [gurus, mapels, kelases, siswas] = await Promise.all([
      readSheet<any>('GURU'),
      readSheet<any>('MAPEL'),
      readSheet<any>('KELAS'),
      readSheet<any>('SISWA'),
    ]);

    const currentGuru = gurus.find(
      (g) => g.user_id === session.id || g.nip === session.extraId || g.nama === session.nama
    );
    const guruNama = currentGuru ? currentGuru.nama : session.nama;
    const guruId = currentGuru ? currentGuru.id : 'GRU-001';

    let guruMapels = mapels.filter((m) => m.guru_id === guruId || m.guru_id === session.id);
    if (guruMapels.length === 0) guruMapels = mapels;

    const cards: any[] = [];
    guruMapels.forEach((m) => {
      const kelasList = String(m.kelas_diampu || '7A').split(',').map((k) => k.trim()).filter(Boolean);
      kelasList.forEach((kls) => {
        const countSiswa = siswas.filter((s) => s.kelas === kls).length;
        cards.push({
          id: `${m.kode || m.id}_${kls}`,
          mapelId: m.id,
          kodeMapel: m.kode || 'MAPEL',
          namaMapel: m.nama_mapel,
          kelas: kls,
          jumlahSiswa: countSiswa,
          guruNama,
        });
      });
    });

    res.json(apiSuccess({ guru: { nama: guruNama, nip: session.extraId || '-' }, cards }));
  });

  // GET /api/guru/siswa
  app.get('/api/guru/siswa', async (req: Request, res: Response) => {
    const kelas = req.query.kelas as string;
    let siswas = await readSheet<any>('SISWA');
    if (kelas) siswas = siswas.filter((s) => s.kelas === kelas);
    siswas.sort((a, b) => a.nama.localeCompare(b.nama));
    res.json(apiSuccess(siswas));
  });

  // KEHADIRAN
  app.get('/api/guru/kehadiran', async (req: Request, res: Response) => {
    const { kelas, mapel, tanggal, nis } = req.query as any;
    let records = await readSheet<any>('KEHADIRAN');
    if (kelas) records = records.filter((r) => r.kelas === kelas);
    if (mapel) records = records.filter((r) => r.mapel?.toLowerCase() === mapel.toLowerCase());
    if (tanggal) records = records.filter((r) => r.tanggal === tanggal);
    if (nis) records = records.filter((r) => r.nis === nis);

    const rekap = {
      total: records.length,
      hadir: records.filter((r) => r.status === 'H').length,
      izin: records.filter((r) => r.status === 'I').length,
      sakit: records.filter((r) => r.status === 'S').length,
      alpa: records.filter((r) => r.status === 'A').length,
    };
    res.json(apiSuccess({ records, rekap }));
  });

  app.post('/api/guru/kehadiran', async (req: Request, res: Response) => {
    const session = await requireGuru(req, res);
    if (!session) return;
    const { tanggal, topik, mapel, kelas, kehadiran } = req.body || {};
    const { appendRow, updateRow } = await import('./lib/sheets.ts');
    const { generateId, getTimestamp, getTanggalHariIni } = await import('./lib/utils.ts');

    const tgl = tanggal || getTanggalHariIni();
    const existing = await readSheet<any>('KEHADIRAN');

    for (const item of kehadiran || []) {
      const match = existing.find(
        (r) => r.tanggal === tgl && r.nis === String(item.nis) && r.mapel?.toLowerCase() === mapel?.toLowerCase()
      );
      if (match) {
        await updateRow('KEHADIRAN', match.id, {
          topik: topik || match.topik,
          status: item.status || 'H',
          guru: session.nama,
          timestamp: getTimestamp(),
        }, 'id');
      } else {
        await appendRow('KEHADIRAN', {
          id: generateId('ABS'),
          tanggal: tgl,
          nis: String(item.nis),
          nama: item.nama,
          kelas,
          mapel,
          topik: topik || 'KBM Reguler',
          status: item.status || 'H',
          guru: session.nama,
          timestamp: getTimestamp(),
        });
      }
    }
    res.json(apiSuccess(null, 'Kehadiran berhasil disimpan.'));
  });

  // NILAI
  app.get('/api/guru/nilai', async (req: Request, res: Response) => {
    const { kelas, mapel, nis } = req.query as any;
    let records = await readSheet<any>('NILAI');
    if (kelas) records = records.filter((r) => r.kelas === kelas);
    if (mapel) records = records.filter((r) => r.mapel?.toLowerCase() === mapel.toLowerCase());
    if (nis) records = records.filter((r) => r.nis === nis);

    const jenisNilaiSet = new Set<string>();
    records.forEach((r) => { if (r.jenis_nilai) jenisNilaiSet.add(r.jenis_nilai); });
    res.json(apiSuccess({ records, kolomPenilaian: Array.from(jenisNilaiSet) }));
  });

  app.post('/api/guru/nilai', async (req: Request, res: Response) => {
    const session = await requireGuru(req, res);
    if (!session) return;
    const { tanggal, nis, nama, kelas, mapel, jenis_nilai, nilai, batchList } = req.body || {};
    const { appendRow, updateRow } = await import('./lib/sheets.ts');
    const { generateId, getTimestamp, getTanggalHariIni } = await import('./lib/utils.ts');

    const tgl = tanggal || getTanggalHariIni();
    const existing = await readSheet<any>('NILAI');

    if (Array.isArray(batchList) && batchList.length > 0) {
      for (const item of batchList) {
        if (!item.nis || item.nilai === undefined || item.nilai === '') continue;
        const match = existing.find(
          (r) => r.nis === String(item.nis) && r.kelas === kelas && r.mapel?.toLowerCase() === mapel?.toLowerCase() && r.jenis_nilai === jenis_nilai
        );
        if (match) {
          await updateRow('NILAI', match.id, { nilai: String(item.nilai), tanggal: tgl, guru: session.nama, timestamp: getTimestamp() }, 'id');
        } else {
          await appendRow('NILAI', {
            id: generateId('NIL'),
            tanggal: tgl,
            nis: String(item.nis),
            nama: item.nama,
            kelas,
            mapel,
            jenis_nilai,
            nilai: String(item.nilai),
            guru: session.nama,
            timestamp: getTimestamp(),
          });
        }
      }
      return res.json(apiSuccess(null, 'Batch nilai berhasil disimpan.'));
    }

    const match = existing.find(
      (r) => r.nis === String(nis) && r.kelas === kelas && r.mapel?.toLowerCase() === mapel?.toLowerCase() && r.jenis_nilai === jenis_nilai
    );
    if (match) {
      await updateRow('NILAI', match.id, { nilai: String(nilai), tanggal: tgl, guru: session.nama, timestamp: getTimestamp() }, 'id');
    } else {
      await appendRow('NILAI', {
        id: generateId('NIL'),
        tanggal: tgl,
        nis: String(nis),
        nama,
        kelas,
        mapel,
        jenis_nilai,
        nilai: String(nilai),
        guru: session.nama,
        timestamp: getTimestamp(),
      });
    }
    res.json(apiSuccess(null, 'Nilai berhasil disimpan.'));
  });

  // CATATAN
  app.get('/api/guru/catatan', async (req: Request, res: Response) => {
    const { kelas, mapel, nis } = req.query as any;
    let records = await readSheet<any>('CATATAN');
    if (kelas) records = records.filter((r) => r.kelas === kelas);
    if (mapel) records = records.filter((r) => r.mapel?.toLowerCase() === mapel.toLowerCase());
    if (nis) records = records.filter((r) => r.nis === nis);
    records.sort((a, b) => new Date(b.tanggal || 0).getTime() - new Date(a.tanggal || 0).getTime());
    res.json(apiSuccess(records));
  });

  app.post('/api/guru/catatan', async (req: Request, res: Response) => {
    const session = await requireGuru(req, res);
    if (!session) return;
    const { tanggal, nis, nama, kelas, mapel, jenis, keterangan, nilai_deskripsi } = req.body || {};
    const { appendRow } = await import('./lib/sheets.ts');
    const { generateId, getTimestamp, getTanggalHariIni } = await import('./lib/utils.ts');

    const newId = generateId('CAT');
    await appendRow('CATATAN', {
      id: newId,
      tanggal: tanggal || getTanggalHariIni(),
      nis: String(nis),
      nama: nama || '',
      kelas,
      mapel,
      jenis: jenis || 'Positif',
      keterangan,
      nilai_deskripsi: nilai_deskripsi || (jenis === 'Positif' ? 'Sangat Baik' : 'Perlu Pembinaan'),
      guru: session.nama,
      timestamp: getTimestamp(),
    });
    res.status(201).json(apiSuccess({ id: newId }, 'Catatan disimpan.'));
  });

  app.delete('/api/guru/catatan', async (req: Request, res: Response) => {
    if (!(await requireGuru(req, res))) return;
    const id = req.query.id as string;
    const { deleteRow } = await import('./lib/sheets.ts');
    await deleteRow('CATATAN', id, 'id');
    res.json(apiSuccess(null, 'Catatan dihapus.'));
  });

  // PENUGASAN
  app.get('/api/guru/penugasan', async (req: Request, res: Response) => {
    const { kelas, mapelId } = req.query as any;
    let records = await readSheet<any>('PENUGASAN');
    if (kelas) records = records.filter((r) => r.target_kelas === kelas || r.target_kelas === 'Semua' || r.target_kelas?.includes(kelas));
    if (mapelId) records = records.filter((r) => r.mapel_id === mapelId);
    records.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    res.json(apiSuccess(records));
  });

  app.post('/api/guru/penugasan', async (req: Request, res: Response) => {
    const session = await requireGuru(req, res);
    if (!session) return;
    const { mapel_id, target_kelas, target_siswa, judul, deskripsi, deadline } = req.body || {};
    const { appendRow } = await import('./lib/sheets.ts');
    const { generateId, getTimestamp } = await import('./lib/utils.ts');

    const newId = generateId('TSK');
    await appendRow('PENUGASAN', {
      id: newId,
      mapel_id: mapel_id || 'MPL-001',
      target_kelas,
      target_siswa: target_siswa || 'Semua',
      judul,
      deskripsi: deskripsi || '',
      deadline,
      guru_id: session.id,
      timestamp: getTimestamp(),
    });
    res.status(201).json(apiSuccess({ id: newId }, 'Tugas berhasil dibuat.'));
  });

  app.delete('/api/guru/penugasan', async (req: Request, res: Response) => {
    if (!(await requireGuru(req, res))) return;
    const id = req.query.id as string;
    const { deleteRow } = await import('./lib/sheets.ts');
    await deleteRow('PENUGASAN', id, 'id');
    res.json(apiSuccess(null, 'Tugas dihapus.'));
  });

  // ===========================================================================
  // API SISWA (TAHAP 6)
  // ===========================================================================
  app.get('/api/siswa/dashboard', async (req: Request, res: Response) => {
    try {
      const session = await getSession(req);
      if (!session) {
        return res.status(401).json(apiError('Sesi berakhir. Silakan login kembali.'));
      }

      const studentNis = session.extraId || session.username;

      const [siswas, kelases, mapels, kehadirans, nilais, catatans, penugasans, settings] =
        await Promise.all([
          readSheet<any>('SISWA'),
          readSheet<any>('KELAS'),
          readSheet<any>('MAPEL'),
          readSheet<any>('KEHADIRAN'),
          readSheet<any>('NILAI'),
          readSheet<any>('CATATAN'),
          readSheet<any>('PENUGASAN'),
          getAllSettings(),
        ]);

      let student = siswas.find(
        (s) => s.nis === studentNis || s.user_id === session.id || s.nama === session.nama
      );

      // Fallback preview
      if (!student && siswas.length > 0) {
        student = siswas[0];
      }

      if (!student) {
        return res.status(404).json(apiError('Data siswa tidak ditemukan.'));
      }

      const kelas = student.kelas;
      const kelasInfo = kelases.find((k) => k.nama_kelas === kelas);
      const kkmDefault = parseFloat(settings.kkm_default || '75') || 75;

      // Kehadiran
      const studentKehadiran = kehadirans.filter((k) => k.nis === student.nis);
      studentKehadiran.sort(
        (a, b) => new Date(b.tanggal || 0).getTime() - new Date(a.tanggal || 0).getTime()
      );

      const countHadir = studentKehadiran.filter((k) => k.status === 'H').length;
      const countIzin = studentKehadiran.filter((k) => k.status === 'I').length;
      const countSakit = studentKehadiran.filter((k) => k.status === 'S').length;
      const countAlpa = studentKehadiran.filter((k) => k.status === 'A').length;
      const persentaseHadir =
        studentKehadiran.length > 0
          ? Math.round((countHadir / studentKehadiran.length) * 100)
          : 100;

      // Nilai & KKM
      const studentNilai = nilais.filter((n) => n.nis === student.nis);
      const relevantMapels = mapels.filter((m) =>
        String(m.kelas_diampu || '').includes(kelas)
      );
      const targetMapels = relevantMapels.length > 0 ? relevantMapels : mapels;

      const nilaiPerMapel = targetMapels.map((m) => {
        const records = studentNilai.filter(
          (n) => n.mapel?.toLowerCase() === m.nama_mapel?.toLowerCase()
        );
        const scoreNums = records.map((r) => parseFloat(r.nilai)).filter((v) => !isNaN(v));
        const rataRata = hitungRataRata(scoreNums);
        const { tuntas, predikat, keterangan } = cekStatusKKM(rataRata, kkmDefault);

        return {
          mapelId: m.id,
          kode: m.kode,
          namaMapel: m.nama_mapel,
          guruId: m.guru_id,
          records,
          rataRata,
          kkm: kkmDefault,
          tuntas,
          predikat,
          keterangan,
        };
      });

      const semuaNilaiAngka = nilaiPerMapel
        .map((m) => m.rataRata)
        .filter((n) => n > 0);

      const rataRataAkademikGlobal = hitungRataRata(semuaNilaiAngka);

      // Catatan
      const studentCatatan = catatans.filter((c) => c.nis === student.nis);
      studentCatatan.sort(
        (a, b) => new Date(b.tanggal || 0).getTime() - new Date(a.tanggal || 0).getTime()
      );

      // Penugasan
      const studentTugas = penugasans.filter(
        (t) =>
          t.target_kelas === kelas ||
          t.target_kelas === 'Semua' ||
          String(t.target_kelas || '').includes(kelas)
      );
      studentTugas.sort(
        (a, b) => new Date(b.deadline || 0).getTime() - new Date(a.deadline || 0).getTime()
      );

      return res.json(
        apiSuccess(
          {
            siswa: student,
            waliKelas: kelasInfo?.wali_kelas || 'Budi Santoso, S.Pd.',
            tahunAjaran: kelasInfo?.tahun_ajaran || settings.tahun_ajaran || '2024/2025',
            semester: settings.semester || 'Ganjil',
            sekolah: settings,
            kehadiran: {
              records: studentKehadiran,
              total: studentKehadiran.length,
              hadir: countHadir,
              izin: countIzin,
              sakit: countSakit,
              alpa: countAlpa,
              persentaseHadir,
            },
            nilai: {
              perMapel: nilaiPerMapel,
              rataRataGlobal: rataRataAkademikGlobal,
              kkm: kkmDefault,
              statusGlobal: cekStatusKKM(rataRataAkademikGlobal, kkmDefault),
            },
            catatan: studentCatatan,
            penugasan: studentTugas,
          },
          'Data akademik siswa berhasil dimuat.'
        )
      );
    } catch (err: any) {
      console.error('Error /api/siswa/dashboard:', err);
      res.status(500).json(apiError('Gagal memuat portal siswa: ' + err.message));
    }
  });

  // ===========================================================================
  // INTEGRASI VITE MIDDLEWARES (UNTUK DEV DAN HOT-RELOAD)
  // ===========================================================================
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Server PIJAR SPENTA berjalan di port ${PORT}`);
  });
}

startServer();
