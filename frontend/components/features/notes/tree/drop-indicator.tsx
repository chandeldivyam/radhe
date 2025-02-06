import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DropIndicatorProps {
	id: string;
	level: number;
}

export function DropIndicator({ id, level }: DropIndicatorProps) {
	const { isOver, setNodeRef } = useDroppable({
		id: `${id}-before`,
		data: {
			type: 'before',
			parentId: id,
			level,
		},
	});

	return (
		<div
			ref={setNodeRef}
			className={cn(
				'h-[20px] -my-[10px] relative',
				'group/indicator',
				'ml-[calc(0.75rem_*_var(--level))]'
			)}
			style={
				{ '--level': level } as React.CSSProperties & {
					'--level': number;
				}
			}
		>
			<div
				className={cn(
					'absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2',
					'transition-all duration-200',
					'group-hover/indicator:h-1 group-hover/indicator:bg-primary/30',
					isOver && 'h-1 bg-primary'
				)}
			/>
		</div>
	);
}
