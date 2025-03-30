'use client';

import { useAuth } from '@/lib/auth/authContext';
import { Navbar } from '@/components/features/navigation/navbar';
import { SideNav } from '@/components/features/navigation/side-nav';
import { CommandDialog } from '@/components/features/command/command';
import { ChatPanel } from '@/components/features/chat/chat-panel';
import {
	useState,
	useEffect,
	useRef,
	useCallback, // Import useCallback
} from 'react';

const MIN_CHAT_WIDTH = 240;
const MAX_CHAT_WIDTH = 640;
const DEFAULT_CHAT_WIDTH = 320;

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user } = useAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [chatOpen, setChatOpen] = useState(false);
	const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
	const isResizing = useRef(false);
	const chatContainerRef = useRef<HTMLDivElement>(null);
	const animationFrameRef = useRef<number | null>(null);
	const resizeStartInfo = useRef<{
		startX: number;
		startWidth: number;
	} | null>(null);

	const handleMouseMove = useCallback((event: MouseEvent) => {
		if (
			!isResizing.current ||
			!resizeStartInfo.current ||
			!chatContainerRef.current
		)
			return;

		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
		}

		animationFrameRef.current = requestAnimationFrame(() => {
			if (
				!isResizing.current ||
				!resizeStartInfo.current ||
				!chatContainerRef.current
			)
				return;

			const currentX = event.clientX;
			const deltaX = currentX - resizeStartInfo.current!.startX;
			// Calculate new width (dragging left decreases width)
			let newWidth = resizeStartInfo.current!.startWidth - deltaX;

			// Clamp the width visually during drag
			newWidth = Math.max(
				MIN_CHAT_WIDTH,
				Math.min(newWidth, MAX_CHAT_WIDTH)
			);

			// Apply style directly to the element for smoothness
			// Use percentages or viewport units if the parent container size changes dynamically often
			// but pixels are fine if the parent (#main-container) is stable during resize.
			chatContainerRef.current!.style.width = `${newWidth}px`;

			// Optional: Add a class for visual feedback during resize
			chatContainerRef.current!.classList.add('is-resizing');
		});
	}, []); // Empty dependency array as it uses refs

	const handleMouseUp = useCallback(() => {
		if (!isResizing.current) return;

		// End resizing state
		isResizing.current = false;
		resizeStartInfo.current = null; // Clear start info
		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
			animationFrameRef.current = null;
		}

		// Remove listeners and styles/classes
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
		document.body.style.cursor = ''; // Reset cursor
		document.body.style.userSelect = ''; // Re-enable text selection
		if (chatContainerRef.current) {
			chatContainerRef.current.classList.remove('is-resizing');
		}

		if (chatContainerRef.current) {
			const finalWidth = chatContainerRef.current.offsetWidth; // Use offsetWidth for reliable pixel value

			// Clamp again just in case (though should be clamped already)
			const clampedWidth = Math.max(
				MIN_CHAT_WIDTH,
				Math.min(finalWidth, MAX_CHAT_WIDTH)
			);

			// Update React state *once* at the end
			setChatWidth(clampedWidth);
			// Save the final width to localStorage
			localStorage.setItem('chatWidth', String(clampedWidth));
		}
	}, [handleMouseMove]); // Dependency on handleMouseMove

	const startResizing = useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
			// Prevent default drag behavior (like text selection)
			event.preventDefault();

			// Start resizing state
			isResizing.current = true;
			resizeStartInfo.current = {
				startX: event.clientX,
				startWidth: chatContainerRef.current?.offsetWidth || chatWidth, // Get current width
			};

			// Attach listeners to the window for global tracking
			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);

			// Add styles for better UX during drag
			document.body.style.cursor = 'ew-resize'; // Set cursor globally
			document.body.style.userSelect = 'none'; // Disable text selection globally
		},
		[handleMouseMove, handleMouseUp, chatWidth] // Include chatWidth in case offsetWidth fails initially
	);

	// Cleanup listeners if component unmounts while resizing (edge case)
	useEffect(() => {
		return () => {
			if (isResizing.current) {
				window.removeEventListener('mousemove', handleMouseMove);
				window.removeEventListener('mouseup', handleMouseUp);
				document.body.style.cursor = '';
				document.body.style.userSelect = '';
				if (animationFrameRef.current) {
					cancelAnimationFrame(animationFrameRef.current);
				}
			}
		};
	}, [handleMouseMove, handleMouseUp]);

	const handleSidebarClose = () => {
		setSidebarOpen(false);
	};

	const handleChatToggle = () => {
		setChatOpen((prev) => !prev);
	};

	return (
		<div className="h-screen flex flex-col bg-background overflow-hidden">
			<CommandDialog />
			<Navbar
				user={user}
				onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
				onChatToggle={handleChatToggle}
				chatOpen={chatOpen}
			/>
			<div id="main-container" className="flex-1 flex overflow-hidden">
				{/* SideNav visibility handled by its own internal logic or CSS based on `open` */}
				<SideNav open={sidebarOpen} onClose={handleSidebarClose} />

				{/* Main content area */}
				<main className="flex-1 overflow-y-auto">
					{' '}
					{/* Alolow main content to scroll */}
					{children}
				</main>

				{/* Chat Panel Container - Conditionally Rendered */}
				{chatOpen && (
					<div
						ref={chatContainerRef} // Add ref here
						className="relative flex h-full flex-shrink-0 border-l border-border" // Use flex-shrink-0
						// Set initial width via style using the state
						style={{ width: `${chatWidth}px` }}
					>
						{/* Resize handle */}
						<div
							// Consider making the handle slightly wider for easier grabbing
							className={`absolute left-0 top-0 -ml-1 w-2 h-full cursor-ew-resize z-10 group`} // group for hover effect
							onMouseDown={startResizing}
						>
							{/* Visual indicator line (optional, but nice) */}
							<div className="w-0.5 h-full mx-auto bg-transparent group-hover:bg-primary/40 transition-colors duration-150"></div>
						</div>

						{/* Chat Panel Content */}
						<div className="flex-1 overflow-hidden">
							{' '}
							{/* Ensure ChatPanel content fits */}
							<ChatPanel />
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
