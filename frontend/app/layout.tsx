import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/common/theme-provider';
import { AuthProvider } from '@/lib/auth/authContext';
import { ToastProvider } from '@/components/common/toast-provider';
import { ReactQueryClientProvider } from '@/components/common/query-client-provider';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Radhe',
	description: 'Generate data which LLMs love!',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<AuthProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<ToastProvider />
						<ReactQueryClientProvider>
							{children}
						</ReactQueryClientProvider>
					</ThemeProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
