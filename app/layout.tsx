import './globals.css';

export const metadata = {
  title: 'PIJAR SPENTA - Sistem Manajemen Pembelajaran',
  description: 'Platform manajemen pembelajaran terpadu untuk sekolah (Admin, Guru, Siswa) dengan database Google Sheets.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
