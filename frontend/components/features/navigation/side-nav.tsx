'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navigationConfig } from './navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SideNavProps {
	open: boolean;
	onClose: () => void;
}

export function SideNav({ open, onClose }: SideNavProps) {
	const pathname = usePathname();
	const router = useRouter();

	const handleNavigation = (href: string) => {
		router.push(href);
		onClose();
	};

	return (
		<>
			{/* Backdrop */}
			{open && (
				<div
					className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm"
					onClick={onClose}
				/>
			)}

			<aside
				className={cn(
					'fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 ease-in-out',
					!open && '-translate-x-full'
				)}
			>
				<ScrollArea className="h-full py-6">
					<nav className="space-y-2 px-4">
						{navigationConfig.map((item) => {
							const Icon = item.icon;
							return (
								<Button
									key={item.href}
									variant={
										pathname === item.href
											? 'secondary'
											: 'ghost'
									}
									className={cn(
										'w-full justify-start gap-2',
										pathname === item.href &&
											'bg-secondary',
										item.disabled &&
											'pointer-events-none opacity-60'
									)}
									onClick={() => handleNavigation(item.href)}
									disabled={item.disabled}
								>
									<Icon className="h-4 w-4" />
									{item.title}
								</Button>
							);
						})}
					</nav>
				</ScrollArea>
			</aside>
		</>
	);
}
