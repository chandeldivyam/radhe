// ./frontend/components/features/tasks/layout/tasks-sidebar.tsx
'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';

interface TasksSidebarProps {
	tasks: Task[];
	selectedTaskId?: string | null;
	onNewTask?: () => void;
	onTaskSelect?: (taskId: string) => void;
	footer?: React.ReactNode;
}

export const TasksSidebar = ({
	tasks,
	selectedTaskId,
	onNewTask,
	onTaskSelect,
	footer,
}: TasksSidebarProps) => {
	return (
		<aside className="flex w-80 flex-col border-r bg-background">
			<div className="flex items-center justify-between p-4">
				<h2 className="text-lg font-semibold">Tasks</h2>
				<Button variant="ghost" size="icon" onClick={onNewTask}>
					<Plus className="h-4 w-4" />
				</Button>
			</div>

			<ScrollArea className="flex-1">
				<div className="space-y-1 p-2">
					{tasks.map((task) => (
						<Link
							key={task.id}
							href={`/tasks/${task.id}`}
							className={cn(
								'flex flex-col rounded-lg p-3 transition-colors hover:bg-accent',
								selectedTaskId === task.id && 'bg-accent'
							)}
							onClick={() => onTaskSelect?.(task.id)}
						>
							<div className="font-medium">{task.title}</div>
							<div className="text-sm text-muted-foreground">
								{new Date(task.created_at).toLocaleDateString(
									'en-US',
									{
										year: 'numeric',
										month: 'short',
										day: 'numeric',
									}
								)}
							</div>
							<div className="text-xs text-muted-foreground mt-1">
								Status: {task.status}
							</div>
						</Link>
					))}
					{footer}
				</div>
			</ScrollArea>
		</aside>
	);
};
