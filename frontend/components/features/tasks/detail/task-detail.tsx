// ./frontend/components/features/tasks/detail/task-detail.tsx
'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Task } from '@/types/task';
import { format } from 'date-fns';
import Link from 'next/link';
import { VideoPreview } from './video-preview';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/lib/hooks/use-toast';

interface TaskDetailProps {
	task: Task;
}

const StatusBadge = ({ status }: { status: string }) => {
	const variantMap = {
		pending: 'secondary',
		in_progress: 'default',
		completed: 'default',
		failed: 'destructive',
	} as const;

	return (
		<Badge
			variant={
				variantMap[status as keyof typeof variantMap] || 'secondary'
			}
		>
			{status.replace('_', ' ')}
		</Badge>
	);
};

export const TaskDetail = ({ task }: TaskDetailProps) => {
	const { toast } = useToast();

	if (!task) {
		toast({
			variant: 'destructive',
			title: 'Error',
			description: 'Task data is not available',
		});
		return null;
	}

	return (
		<div className="space-y-8 p-6">
			{/* Header Section */}
			<div className="space-y-2">
				<h1 className="text-2xl font-bold tracking-tight">
					{task.title}
				</h1>
				<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
					<div className="flex items-center gap-2">
						<span>Status:</span>
						<StatusBadge status={task.status} />
					</div>
					<span className="hidden md:inline">•</span>
					<span>
						Created:{' '}
						{format(
							new Date(task.created_at),
							'MMM dd, yyyy HH:mm'
						)}
					</span>
				</div>
			</div>

			{/* Videos Section */}
			{task.video_urls && task.video_urls.length > 0 && (
				<section className="space-y-4">
					<h2 className="text-lg font-semibold">Videos</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{task.video_urls.map((url, index) => (
							<VideoPreview key={`${url}-${index}`} url={url} />
						))}
					</div>
				</section>
			)}

			{/* Instructions Section */}
			{task.instructions && (
				<section className="space-y-4">
					<h2 className="text-lg font-semibold">Instructions</h2>
					<div className="rounded-md border bg-muted/50 p-4">
						<pre className="whitespace-pre-wrap font-sans text-sm">
							{task.instructions}
						</pre>
					</div>
				</section>
			)}

			{/* Created Notes Section */}
			{task.modified_notes && task.modified_notes.length > 0 && (
				<section className="space-y-4">
					<h2 className="text-lg font-semibold">Created Notes</h2>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{task.modified_notes.map((note) => (
							<Link
								key={note.id}
								href={`/notes/${note.id}`}
								className="rounded-lg border p-4 transition-colors hover:bg-accent/50"
							>
								<h3 className="truncate font-medium">
									{note.title}
								</h3>
								<p className="mt-1 truncate text-sm text-muted-foreground">
									{format(
										new Date(note.created_at),
										'MMM dd, yyyy HH:mm'
									)}
								</p>
							</Link>
						))}
					</div>
				</section>
			)}
		</div>
	);
};

export const TaskDetailSkeleton = () => (
	<div className="space-y-8 p-6">
		<div className="space-y-2">
			<Skeleton className="h-8 w-3/4" />
			<div className="flex flex-wrap gap-2">
				<Skeleton className="h-5 w-24" />
				<Skeleton className="hidden h-5 w-2 md:block" />
				<Skeleton className="h-5 w-36" />
			</div>
		</div>
		<div className="space-y-4">
			<Skeleton className="h-6 w-32" />
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{[...Array(3)].map((_, i) => (
					<Skeleton key={i} className="aspect-video" />
				))}
			</div>
		</div>
		<div className="space-y-4">
			<Skeleton className="h-6 w-32" />
			<Skeleton className="h-32 w-full" />
		</div>
		<div className="space-y-4">
			<Skeleton className="h-6 w-32" />
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{[...Array(3)].map((_, i) => (
					<Skeleton key={i} className="h-20" />
				))}
			</div>
		</div>
	</div>
);
