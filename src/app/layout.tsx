import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@/styles/admin.css';

import { AuthProvider } from '@/contexts/AuthContext';
import { SearchProvider } from '../contexts/SearchContext';
import BootstrapClient from '@/components/BootstrapClient';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SearchProvider>{children}</SearchProvider>
          <BootstrapClient />
        </AuthProvider>
      </body>
    </html>
  );
}