import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@/styles/admin.css';

import { AuthProvider } from '@/contexts/AuthContext';
import { SearchProvider } from '../contexts/SearchContext';
import BootstrapClient from '@/components/BootstrapClient';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Loan Platform</title>
      </head>
      <body>
        <AuthProvider>
          <SearchProvider>{children}</SearchProvider>
          <BootstrapClient />
        </AuthProvider>
      </body>
    </html>
  );
}