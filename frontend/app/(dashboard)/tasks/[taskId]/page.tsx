'use client';

import { useParams } from 'next/navigation';
import { useTaskSelection } from '@/lib/store/useTasksStore';

export default function TaskDetailPage() {
	const params = useParams();
	const taskId = params.taskId as string;

	useTaskSelection(taskId); // This handles the selection logic

	return <div>Task Detail View for {taskId}</div>;
}
