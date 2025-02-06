'use client';

import { useState } from 'react';
import { useNotes } from '@/lib/hooks/useNotes';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CreateNoteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	parentId?: string;
}

export function CreateNoteDialog({
	open,
	onOpenChange,
	parentId,
}: CreateNoteDialogProps) {
	const [title, setTitle] = useState('');
	const [isCreating, setIsCreating] = useState(false);
	const { createNote } = useNotes();

	const handleCreate = async () => {
		if (!title.trim()) return;

		try {
			setIsCreating(true);
			await createNote({
				title: title.trim(),
				content: '',
				parent_id: parentId,
			});
			onOpenChange(false);
			setTitle('');
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New Note</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<Input
						placeholder="Note title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') handleCreate();
						}}
					/>

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreate}
							disabled={!title.trim() || isCreating}
						>
							{isCreating && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Create
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
