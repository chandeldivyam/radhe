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
		<div className="h-screen flex flex-col bg-background">
			<CommandDialog />
			<Navbar
				user={user}
				onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
			/>
			<div className="flex-1 flex overflow-hidden">
				<SideNav open={sidebarOpen} onClose={handleSidebarClose} />
				<main className="flex-1">{children}</main>
			</div>
		</div>
	);
}
