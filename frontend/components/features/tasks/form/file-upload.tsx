// ./frontend/components/features/tasks/form/file-upload.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/lib/auth/authContext';
import axios from 'axios';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { XIcon, LoaderIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProgress {
	id: string;
	file: File;
	progress: number;
	status: 'pending' | 'uploading' | 'success' | 'error';
	error?: string;
	url?: string;
}

interface FileUploadProps {
	value: string[];
	onChange: (urls: string[]) => void;
}

export const FileUpload = ({ value, onChange }: FileUploadProps) => {
	const { user } = useAuth();
	const [files, setFiles] = useState<FileUploadProgress[]>([]);

	useEffect(() => {
		const successfulUrls = files
			.filter((f) => f.status === 'success')
			.map((f) => f.url)
			.filter((url): url is string => !!url);

		if (JSON.stringify(successfulUrls) !== JSON.stringify(value)) {
			onChange(successfulUrls);
		}
	}, [files, onChange, value]);

	const uploadFile = useCallback(
		async (fileState: FileUploadProgress) => {
			if (!user) return;

			const formData = new FormData();
			formData.append('file', fileState.file);
			formData.append('userId', user.id);
			formData.append('organizationId', user.organization_id);

			try {
				const response = await axios.post(
					'/api/file/upload',
					formData,
					{
						onUploadProgress: (progressEvent) => {
							const progress = Math.round(
								(progressEvent.loaded * 100) /
									(progressEvent.total || 1)
							);
							setFiles((prev) =>
								prev.map((f) =>
									f.id === fileState.id
										? { ...f, progress }
										: f
								)
							);
						},
					}
				);

				setFiles((prev) =>
					prev.map((f) =>
						f.id === fileState.id
							? {
									...f,
									status: 'success',
									progress: 100,
									url: response.data.public_url,
								}
							: f
					)
				);
			} catch (error) {
				setFiles((prev) =>
					prev.map((f) =>
						f.id === fileState.id
							? {
									...f,
									status: 'error',
									error:
										error instanceof Error
											? error.message
											: 'Upload failed',
								}
							: f
					)
				);
			}
		},
		[user]
	);

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			const newFiles: FileUploadProgress[] = acceptedFiles.map(
				(file) => ({
					id: crypto.randomUUID(),
					file,
					progress: 0,
					status: 'pending', // Now properly typed as the union
				})
			);

			setFiles((prev) => [...prev, ...newFiles]);
			newFiles.forEach(uploadFile);
		},
		[uploadFile]
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: { 'video/*': ['.mp4', '.mov', '.avi'] },
		multiple: true,
	});

	const removeFile = (id: string) => {
		setFiles((prev) => prev.filter((f) => f.id !== id));
	};

	const retryUpload = (id: string) => {
		setFiles((prev) =>
			prev.map((f) =>
				f.id === id ? { ...f, status: 'pending', error: undefined } : f
			)
		);
		const file = files.find((f) => f.id === id);
		if (file) uploadFile(file);
	};

	return (
		<div className="space-y-4">
			<div
				{...getRootProps()}
				className={cn(
					'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
					isDragActive
						? 'border-primary bg-muted'
						: 'border-muted-foreground'
				)}
			>
				<input {...getInputProps()} />
				<p className="text-muted-foreground">
					{isDragActive
						? 'Drop video files here'
						: 'Drag & drop videos, or click to select'}
				</p>
			</div>

			<div className="space-y-2">
				{files.map((file) => (
					<div
						key={file.id}
						className="border rounded-lg p-4 flex flex-col gap-2"
					>
						<div className="flex justify-between items-center">
							<span className="text-sm font-medium truncate">
								{file.file.name}
							</span>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={() => removeFile(file.id)}
							>
								<XIcon className="h-4 w-4" />
							</Button>
						</div>

						{file.status === 'uploading' && (
							<div className="space-y-2">
								<Progress value={file.progress} />
								<span className="text-xs text-muted-foreground">
									Uploading {file.progress}%
								</span>
							</div>
						)}

						{file.status === 'error' && (
							<div className="space-y-2">
								<p className="text-xs text-destructive">
									{file.error}
								</p>
								<Button
									variant="outline"
									size="sm"
									onClick={() => retryUpload(file.id)}
								>
									<LoaderIcon className="mr-2 h-4 w-4" />
									Retry
								</Button>
							</div>
						)}

						{file.status === 'success' && (
							<p className="text-xs text-green-600">
								Upload successful
							</p>
						)}
					</div>
				))}
			</div>
		</div>
	);
};
