'use client';

import { useAuth } from '@/lib/auth/authContext';
import { Navbar } from '@/components/features/navigation/navbar';
import { SideNav } from '@/components/features/navigation/side-nav';
import { CommandDialog } from '@/components/features/command/command';
import { ChatPanel } from '@/components/features/chat/chat-panel';
import { useState, useEffect, useRef } from 'react';

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user } = useAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [chatOpen, setChatOpen] = useState(false);
	const [chatWidth, setChatWidth] = useState(320);
	const [isResizing, setIsResizing] = useState(false);
	const resizeRef = useRef<HTMLDivElement>(null);
	const minChatWidth = 240;
	const maxChatWidth = 480;

	useEffect(() => {
		const savedState = localStorage.getItem('sidebarOpen');
		setSidebarOpen(savedState === 'true');

		// Load saved chat width from localStorage
		const savedChatWidth = localStorage.getItem('chatWidth');
		if (savedChatWidth) {
			setChatWidth(parseInt(savedChatWidth, 10));
		}
	}, []);

	useEffect(() => {
		localStorage.setItem('sidebarOpen', String(sidebarOpen));
	}, [sidebarOpen]);

	useEffect(() => {
		localStorage.setItem('chatWidth', String(chatWidth));
	}, [chatWidth]);

	const handleSidebarClose = () => {
		setSidebarOpen(false);
	};

	const handleChatToggle = () => {
		setChatOpen(!chatOpen);
	};

	// Resize handlers
	const startResizing = (e: React.MouseEvent) => {
		setIsResizing(true);
		e.preventDefault();
	};

	const stopResizing = () => {
		setIsResizing(false);
	};

	const handleResize = (e: MouseEvent) => {
		if (isResizing) {
			const containerRect = document
				.getElementById('main-container')
				?.getBoundingClientRect();
			if (containerRect) {
				const mouseX = e.clientX;
				const rightEdge = containerRect.right;
				const newWidth = rightEdge - mouseX;

				if (newWidth >= minChatWidth && newWidth <= maxChatWidth) {
					setChatWidth(newWidth);
				}
			}
		}
	};

	// Add and remove event listeners for mouse movement and mouse up
	useEffect(() => {
		if (isResizing) {
			window.addEventListener('mousemove', handleResize);
			window.addEventListener('mouseup', stopResizing);
		}

		return () => {
			window.removeEventListener('mousemove', handleResize);
			window.removeEventListener('mouseup', stopResizing);
		};
	}, [isResizing]);

	return (
		<div className="h-screen flex flex-col bg-background">
			<CommandDialog />
			<Navbar
				user={user}
				onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
				onChatToggle={handleChatToggle}
				chatOpen={chatOpen}
			/>
			<div id="main-container" className="flex-1 flex overflow-hidden">
				<SideNav open={sidebarOpen} onClose={handleSidebarClose} />
				<main className="flex-1">{children}</main>

				{chatOpen && (
					<div
						className="relative flex h-full"
						style={{ width: `${chatWidth}px` }}
					>
						{/* Resize handle */}
						<div
							ref={resizeRef}
							className={`absolute left-0 top-0 w-1 h-full cursor-ew-resize hover:bg-primary/20 ${isResizing ? 'bg-primary/40' : ''}`}
							onMouseDown={startResizing}
						/>
						<ChatPanel />
					</div>
				)}
			</div>
		</div>
	);
}
