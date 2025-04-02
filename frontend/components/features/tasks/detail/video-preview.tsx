// ./frontend/components/features/tasks/detail/video-preview.tsx
'use client';

import { Video } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/hooks/use-toast';

interface VideoPreviewProps {
	url: string;
	className?: string;
}

export const VideoPreview = ({ url, className }: VideoPreviewProps) => {
	const { toast } = useToast();
	const [hasError, setHasError] = useState(false);
	const filename = url.split('/').pop()?.split('?')[0] || 'video'; // Remove query params if any

	const handleError = () => {
		setHasError(true);
		toast({
			variant: 'destructive',
			title: 'Video Preview Error',
			description: 'Could not load video preview',
		});
	};

	return (
		<div
			className={cn(
				'group relative aspect-video overflow-hidden rounded-lg border bg-muted transition-all hover:shadow-md',
				className
			)}
		>
			{!hasError ? (
				<video
					src={url}
					className="h-full w-full object-cover"
					onError={handleError}
					muted
					playsInline
					preload="metadata"
				>
					{/* Adding a track element for accessibility, even if empty */}
					<track kind="captions" />
				</video>
			) : (
				<div className="flex h-full items-center justify-center bg-muted/50">
					<Video className="h-8 w-8 text-muted-foreground" />
				</div>
			)}

			{/* Hover Overlay for Fullscreen Button */}
			<div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
				<a
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					// Use card background for better theme adaptability
					className="flex flex-col items-center gap-2 rounded-full bg-card/90 p-3 text-center text-xs font-medium text-card-foreground shadow-sm transition hover:bg-card hover:text-primary"
					onClick={(e) => e.stopPropagation()} // Prevent triggering other clicks on the parent
				>
					<Video className="h-4 w-4" />
					<span>View Fullscreen</span>
				</a>
			</div>

			{/* Bottom Gradient with Filename */}
			<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
				{/* Use primary-foreground for better contrast consistency across themes on dark overlay */}
				<p className="truncate text-xs text-primary-foreground">
					{filename}
				</p>
			</div>
		</div>
	);
};
