'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { TasksSidebar } from '@/components/features/tasks/layout/tasks-sidebar';
import { TasksLayout } from '@/components/features/tasks/layout/tasks-layout';
import { useTasks } from '@/lib/hooks/useTasks';
import { useTaskActions, useSelectedTaskId } from '@/lib/store/useTasksStore';

export default function TasksLayoutWrapper({
	children,
}: {
	children: ReactNode;
}) {
	const router = useRouter();
	const selectedTaskId = useSelectedTaskId();
	const { clearSelectedTask } = useTaskActions();

	const {
		data,
		isLoading: isInitialLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useTasks();

	const allTasks = data?.pages.flatMap((page) => page.items) || [];

	const { ref: loadMoreRef, inView } = useInView({
		threshold: 1,
		triggerOnce: false,
	});

	const handleNewTask = () => {
		clearSelectedTask();
		router.push('/tasks/new');
	};

	// Improved fetch trigger with debounce effect
	useEffect(() => {
		if (inView && hasNextPage && !isFetchingNextPage && !isInitialLoading) {
			fetchNextPage();
		}
	}, [
		inView,
		hasNextPage,
		isFetchingNextPage,
		isInitialLoading,
		fetchNextPage,
	]);

	const footerContent = (
		<div className="py-4 text-center text-sm text-muted-foreground">
			{
				isFetchingNextPage
					? 'Loading more tasks...'
					: hasNextPage
						? '' // Let the intersection observer handle it implicitly, or show "Scroll to load more" if preferred
						: allTasks.length > 0
							? 'No more tasks'
							: '' // Only show "No more tasks" if tasks exist
			}
		</div>
	);

	return (
		<TasksLayout
			sidebar={
				<TasksSidebar
					tasks={allTasks}
					selectedTaskId={selectedTaskId}
					onNewTask={handleNewTask}
					footerContent={footerContent}
					isLoading={isInitialLoading}
					loadMoreRef={loadMoreRef}
				/>
			}
			isLoading={isInitialLoading && allTasks.length === 0}
			error={error}
		>
			{children}
		</TasksLayout>
	);
}
