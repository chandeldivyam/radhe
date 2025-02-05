'use client';

import { useNotesStore } from '@/lib/store/useNotesStore';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateNoteDialog } from '@/components/features/notes/dialogs/create-note-dialog';
import { useState } from 'react';

export default function Notes() {
	const { error, isLoadingRoot } = useNotesStore();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

	if (isLoadingRoot) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center space-y-4">
					<div className="animate-pulse text-muted-foreground">Loading your notes...</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center space-y-4 text-destructive">
					<p>Failed to load notes</p>
					<p className="text-sm">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col items-center justify-center p-4 space-y-4">
			<div className="text-center space-y-2">
				<FileText className="h-12 w-12 mx-auto text-muted-foreground" />
				<h1 className="text-2xl font-bold">Welcome to Notes</h1>
				<p className="text-muted-foreground max-w-md">
					Select a note from the sidebar or create a new one to get started.
				</p>
			</div>
			
			<Button onClick={() => setIsCreateDialogOpen(true)}>
				<Plus className="h-4 w-4 mr-2" />
				Create New Note
			</Button>

			<CreateNoteDialog 
				open={isCreateDialogOpen} 
				onOpenChange={setIsCreateDialogOpen} 
			/>
		</div>
	);
}
