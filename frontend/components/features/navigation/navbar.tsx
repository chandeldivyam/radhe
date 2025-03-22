'use client';

import { Menu, PanelRight, PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserNav } from './user-nav';
import { ThemeToggle } from './theme-toggle';
import { UserResponse } from '@/types/auth';
import { usePathname } from 'next/navigation';
import { navigationConfig } from './navigation';

interface NavbarProps {
	user: UserResponse | null;
	onSidebarToggle: () => void;
	onChatToggle: () => void;
	chatOpen: boolean;
}

export function Navbar({
	user,
	onSidebarToggle,
	onChatToggle,
	chatOpen,
}: NavbarProps) {
	const pathname = usePathname();
	// Find the current page title from navigation config
	const currentPage = navigationConfig.find((item) => item.href === pathname);
	const pageTitle = currentPage?.title || 'Dashboard';

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="flex h-16 items-center px-6">
				<Button
					variant="ghost"
					size="icon"
					className="mr-4"
					onClick={onSidebarToggle}
				>
					<Menu className="h-5 w-5" />
					<span className="sr-only">Toggle sidebar</span>
				</Button>

				<div className="flex flex-1 items-center justify-between">
					<h2 className="text-lg font-semibold">{pageTitle}</h2>

					<div className="flex items-center space-x-2">
						<ThemeToggle />
						{user && <UserNav user={user} />}
						<Button
							variant="ghost"
							size="icon"
							onClick={onChatToggle}
						>
							{chatOpen ? <PanelRightClose /> : <PanelRight />}
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
}
