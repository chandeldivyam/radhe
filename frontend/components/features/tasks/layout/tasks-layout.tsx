'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const TasksLayout = ({
	sidebar,
	children,
	className,
}: {
	sidebar: ReactNode;
	children: ReactNode;
	className?: string;
}) => {
	return (
		<div className={cn('flex h-full bg-background', className)}>
			{sidebar}
			<main className="flex-1 overflow-auto">{children}</main>
		</div>
	);
};
