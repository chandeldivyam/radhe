'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TasksLayoutProps {
	sidebar: ReactNode;
	children: ReactNode;
	className?: string;
	isLoading?: boolean;
	error?: Error | null;
}

export const TasksLayout = ({
	sidebar,
	children,
	className,
	isLoading = false,
	error = null,
}: TasksLayoutProps) => {
	if (error) {
		return (
			<div className={cn('flex h-full bg-background', className)}>
				<div className="p-4 text-destructive">
					Error: {error.message}
				</div>
			</div>
		);
	}

	return (
		<div className={cn('flex h-full bg-background', className)}>
			{sidebar}
			<main className="flex-1 overflow-auto">
				{isLoading ? (
					<div className="p-8 space-y-4">
						<div className="h-8 w-48 bg-muted rounded" />
					</div>
				) : (
					children
				)}
			</main>
		</div>
	);
};
