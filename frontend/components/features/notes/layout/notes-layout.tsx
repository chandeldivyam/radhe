'use client';

import { ReactNode, useState, useEffect } from 'react';
import { NotesSidebar } from './notes-sidebar';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

interface NotesLayoutProps {
	children: ReactNode;
}

export function NotesLayout({ children }: NotesLayoutProps) {
	const isMobile = useMediaQuery('(max-width: 768px)');
	const [isCollapsed, setIsCollapsed] = useState(false);

	// Automatically collapse sidebar on mobile
	useEffect(() => {
		if (isMobile) {
			setIsCollapsed(true);
		}
	}, [isMobile]);

	const toggleCollapse = () => {
		setIsCollapsed(!isCollapsed);
	};

	return (
		<div className="flex h-full">
			{/* Sidebar */}
			<div
				className={`
					transition-all duration-300 ease-in-out
					border-r bg-background
					${isCollapsed ? 'w-12' : 'w-64'}
				`}
			>
				<NotesSidebar
					isCollapsed={isCollapsed}
					onToggleCollapse={toggleCollapse}
				/>
			</div>

			{/* Main Content */}
			<div className="flex-1 overflow-auto">{children}</div>
		</div>
	);
}
