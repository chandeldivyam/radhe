'use client';

import { useTaskSelection } from '@/lib/store/useTasksStore';

export default function NewTaskPage() {
	useTaskSelection(); // This will handle clearing the selection

	return <div>New Task Form</div>;
}
