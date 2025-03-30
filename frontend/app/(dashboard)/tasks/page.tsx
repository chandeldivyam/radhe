// ./frontend/app/(dashboard)/tasks/page.tsx
'use client';

import { TasksLayout } from '@/components/features/tasks/layout/tasks-layout';
import { TasksSidebar } from '@/components/features/tasks/layout/tasks-sidebar';
import { useTaskActions, useSelectedTaskId } from '@/lib/store/useTasksStore';
import { useRouter } from 'next/navigation';
import { useTasks } from '@/lib/hooks/useTasks';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

export default function TasksPage() {
	const router = useRouter();
	const selectedTaskId = useSelectedTaskId();
	const { setSelectedTaskId } = useTaskActions();
	const { ref, inView } = useInView();
	const {
		data,
		isLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useTasks();

	const allTasks = data?.pages.flatMap((page) => page.items) || [];
	const handleNewTask = () => router.push('/tasks/new');
	const handleTaskSelect = (taskId: string) => setSelectedTaskId(taskId);

	useEffect(() => {
		if (inView && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

	if (isLoading) {
		return (
			<TasksLayout
				sidebar={
					<TasksSidebar
						tasks={allTasks}
						selectedTaskId={selectedTaskId}
						onNewTask={handleNewTask}
						onTaskSelect={handleTaskSelect}
						footer={
							<div
								ref={ref}
								className="py-4 text-center text-sm text-muted-foreground"
							>
								{isFetchingNextPage
									? 'Loading more tasks...'
									: hasNextPage
										? 'Scroll to load more'
										: 'No more tasks'}
							</div>
						}
					/>
				}
			>
				<div className="p-8">
					<Skeleton className="h-8 w-48" />
				</div>
			</TasksLayout>
		);
	}

	if (error) {
		return (
			<TasksLayout
				sidebar={
					<div className="p-4 text-destructive">
						Error loading tasks: {error.message}
					</div>
				}
			>
				<div className="p-8 text-destructive">Error loading tasks</div>
			</TasksLayout>
		);
	}

	return (
		<TasksLayout
			sidebar={
				<TasksSidebar
					tasks={allTasks}
					selectedTaskId={selectedTaskId}
					onNewTask={handleNewTask}
					onTaskSelect={handleTaskSelect}
					footer={
						<div
							ref={ref}
							className="py-4 text-center text-sm text-muted-foreground"
						>
							{isFetchingNextPage
								? 'Loading more tasks...'
								: hasNextPage
									? 'Scroll to load more'
									: 'No more tasks'}
						</div>
					}
				/>
			}
		>
			<div className="p-8">
				{selectedTaskId ? (
					<div>Selected Task Content</div>
				) : (
					<div className="flex h-full items-center justify-center text-muted-foreground">
						Select a task to view details
					</div>
				)}
			</div>
		</TasksLayout>
	);
}
