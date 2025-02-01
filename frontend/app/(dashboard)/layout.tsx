'use client';

import { useAuth } from '@/lib/auth/authContext';
import { Navbar } from '@/components/features/navigation/navbar';
import { SideNav } from '@/components/features/navigation/side-nav';
import { CommandDialog } from '@/components/features/command/command';
import { useState, useEffect } from 'react';

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user } = useAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	useEffect(() => {
		const savedState = localStorage.getItem('sidebarOpen');
		setSidebarOpen(savedState === 'true');
	}, []);

	useEffect(() => {
		localStorage.setItem('sidebarOpen', String(sidebarOpen));
	}, [sidebarOpen]);

	const handleSidebarClose = () => {
		setSidebarOpen(false);
	};

	return (
		<div className="min-h-screen bg-background">
			<CommandDialog />
			<Navbar
				user={user}
				onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
			/>
			<div className="flex h-[calc(100vh-4rem)]">
				<SideNav open={sidebarOpen} onClose={handleSidebarClose} />
				<main className="flex-1 overflow-y-auto p-6">{children}</main>
			</div>
		</div>
	);
}
