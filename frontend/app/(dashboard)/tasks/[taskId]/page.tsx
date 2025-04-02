// ./frontend/app/(dashboard)/tasks/[taskId]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useTaskSelection } from '@/lib/store/useTasksStore';
import { useTask } from '@/lib/hooks/useTasks';
import {
	TaskDetail,
	TaskDetailSkeleton,
} from '@/components/features/tasks/detail/task-detail';
import { useToast } from '@/lib/hooks/use-toast';
import { useEffect } from 'react';

export default function TaskDetailPage() {
	const params = useParams();
	const taskId = params.taskId as string;
	const { data: task, isLoading, error } = useTask(taskId);
	const { toast } = useToast();

	useTaskSelection(taskId);

	useEffect(() => {
		if (error) {
			toast({
				variant: 'destructive',
				title: 'Error Loading Task',
				description: error.message || 'Failed to load task details',
			});
		}
	}, [error, toast]);

	if (isLoading || !task) return <TaskDetailSkeleton />;

	return (
		<div className="h-full overflow-auto">
			<TaskDetail task={task} />
		</div>
	);
}
