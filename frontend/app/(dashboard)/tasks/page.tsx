'use client';

import { useSelectedTaskId } from '@/lib/store/useTasksStore';

export default function TasksPage() {
	const selectedTaskId = useSelectedTaskId();

	return (
		<div className="p-8">
			{selectedTaskId ? (
				<div>Selected Task Content</div>
			) : (
				<div className="flex h-full items-center justify-center text-muted-foreground">
					Select a task to view details
				</div>
			)}
		</div>
	);
}
