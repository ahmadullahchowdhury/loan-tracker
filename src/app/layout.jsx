import './globals.css';
import Providers from '@/providers/Providers';

export const metadata = {
  title: 'Loan Tracker',
  description: 'Manage your family loans and track transactions',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
