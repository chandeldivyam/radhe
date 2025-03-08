'use client';

import { useState } from 'react';
import { NoteTree } from '../tree/note-tree';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { CreateNoteDialog } from '../dialogs/create-note-dialog';

interface NotesSidebarProps {
	isCollapsed: boolean;
	onToggleCollapse: () => void;
}

export function NotesSidebar({
	isCollapsed,
	onToggleCollapse,
}: NotesSidebarProps) {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

	return (
		<div className="flex h-full flex-col relative">
			{/* Sidebar header */}
			<div className="flex items-center justify-between p-4 border-b">
				{!isCollapsed && (
					<h2 className="text-lg font-semibold">Notes</h2>
				)}
				<div className="flex items-center gap-2">
					{!isCollapsed && (
						<Button
							size="icon"
							variant="ghost"
							onClick={() => setIsCreateDialogOpen(true)}
							className="h-8 w-8"
						>
							<Plus className="h-4 w-4" />
						</Button>
					)}
					<Button
						size="icon"
						variant="ghost"
						onClick={onToggleCollapse}
						className="h-8 w-8 ml-auto"
						aria-label={
							isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
						}
					>
						{isCollapsed ? (
							<ChevronRight className="h-4 w-4" />
						) : (
							<ChevronLeft className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>

			{/* Sidebar content */}
			{!isCollapsed && (
				<div className="pl-5">
					<NoteTree width={232} />
				</div>
			)}

			<CreateNoteDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
			/>
		</div>
	);
}
