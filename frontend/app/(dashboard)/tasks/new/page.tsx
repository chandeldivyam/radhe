// ./frontend/app/(dashboard)/tasks/new/page.tsx
'use client';

import { useTaskSelection } from '@/lib/store/useTasksStore';
import { TaskForm } from '@/components/features/tasks/form/task-form';

export default function NewTaskPage() {
	useTaskSelection();

	return (
		<div className="h-full">
			<TaskForm />
		</div>
	);
}
