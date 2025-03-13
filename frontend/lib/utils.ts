import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import axios, { AxiosRequestConfig, AxiosProgressEvent } from 'axios';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export interface UploadProgressCallback {
	onProgress?: (progress: number) => void;
	onSuccess?: (url: string) => void;
	onError?: (error: Error) => void;
}

/**
 * Uploads a file to a presigned URL with progress tracking
 *
 * @param presignedUrl - The presigned URL to upload to
 * @param file - The file to upload
 * @param callbacks - Optional callbacks for progress, success, and error
 * @returns Promise with the public URL of the uploaded file
 */
export async function uploadFileWithProgress(
	presignedUrl: string,
	file: File,
	publicUrl: string,
	callbacks?: UploadProgressCallback
): Promise<string> {
	const { onProgress, onSuccess, onError } = callbacks || {};

	try {
		const config: AxiosRequestConfig = {
			headers: {
				'Content-Type': file.type,
			},
			onUploadProgress: (progressEvent: AxiosProgressEvent) => {
				if (progressEvent.total) {
					const percentCompleted = Math.round(
						(progressEvent.loaded * 100) / progressEvent.total
					);
					onProgress?.(percentCompleted);
				}
			},
		};

		// Use axios to PUT the file to the presigned URL
		await axios.put(presignedUrl, file, config);

		// Call success callback with the public URL
		onSuccess?.(publicUrl);

		return publicUrl;
	} catch (error) {
		const err =
			error instanceof Error ? error : new Error('Unknown upload error');
		onError?.(err);
		throw err;
	}
}
