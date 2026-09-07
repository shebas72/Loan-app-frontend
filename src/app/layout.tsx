import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@/styles/admin.css';

import { AuthProvider } from '@/contexts/AuthContext';
import BootstrapClient from '@/components/BootstrapClient';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <BootstrapClient />
        </AuthProvider>
      </body>
    </html>
  );
}