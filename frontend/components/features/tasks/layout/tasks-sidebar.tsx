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
	footerContent?: React.ReactNode;
	isLoading?: boolean;
	loadMoreRef?: React.Ref<HTMLDivElement>;
}

export const TasksSidebar = ({
	tasks,
	selectedTaskId,
	onNewTask,
	footerContent,
	isLoading = false,
	loadMoreRef,
}: TasksSidebarProps) => {
	return (
		<aside className="flex w-80 flex-col border-r bg-background">
			<div className="flex items-center justify-between p-4">
				<h2 className="text-lg font-semibold">Tasks</h2>
				<Button
					variant="ghost"
					size="icon"
					onClick={onNewTask}
					aria-label="Create new task"
				>
					<Plus className="h-4 w-4" />
				</Button>
			</div>

			<ScrollArea className="flex-1 h-[calc(100vh-57px)]">
				<div className="space-y-1 p-2">
					{isLoading ? (
						<TaskListSkeleton count={5} />
					) : (
						<>
							{tasks.map((task) => (
								<TaskListItem
									key={task.id}
									task={task}
									isSelected={selectedTaskId === task.id}
								/>
							))}
							{!isLoading || tasks.length > 0 ? (
								<div
									ref={loadMoreRef}
									className="h-10 flex items-center justify-center"
								>
									{footerContent}
								</div>
							) : null}
						</>
					)}
				</div>
			</ScrollArea>
		</aside>
	);
};

interface TaskListItemProps {
	task: Task;
	isSelected: boolean;
}

const TaskListItem = ({ task, isSelected }: TaskListItemProps) => {
	return (
		<Link
			href={`/tasks/${task.id}`}
			className={cn(
				'flex flex-col rounded-lg p-3 transition-colors hover:bg-accent',
				isSelected && 'bg-accent'
			)}
		>
			<div className="font-medium">{task.title}</div>
			<div className="text-sm text-muted-foreground">
				{new Date(task.created_at).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
				})}
			</div>
			<div className="text-xs text-muted-foreground mt-1">
				Status: {task.status}
			</div>
		</Link>
	);
};

const TaskListSkeleton = ({ count }: { count: number }) => {
	return (
		<>
			{Array.from({ length: count }).map((_, index) => (
				<div key={index} className="rounded-lg p-3 space-y-2">
					<div className="h-4 w-3/4 bg-muted rounded" />
					<div className="h-3 w-1/2 bg-muted rounded" />
				</div>
			))}
		</>
	);
};
