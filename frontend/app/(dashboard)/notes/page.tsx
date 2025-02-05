'use client';

import { useNotesStore } from '@/lib/store/useNotesStore';

export default function Notes() {
	const { error, isLoadingRoot } = useNotesStore();

	if (isLoadingRoot) {
		return <div className="p-4">Loading your notes...</div>;
	}

	if (error) {
		return <div className="p-4 text-destructive">{error}</div>;
	}

	return (
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-4">Welcome to Notes</h1>
			<p className="text-muted-foreground">
				Select a note from the sidebar or create a new one to get started.
			</p>
		</div>
	);
}
