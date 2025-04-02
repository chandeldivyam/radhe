// ./frontend/components/features/tasks/form/task-form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { Task } from '@/types/task';
import { FileUpload } from './file-upload';

const formSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	video_urls: z
		.array(z.string().url())
		.min(1, 'At least one video is required'),
	instructions: z.string().optional(),
	agent_type: z.literal('saas_wiki_agent'),
});

export const TaskForm = () => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: '',
			video_urls: [],
			instructions: '',
			agent_type: 'saas_wiki_agent',
		},
	});

	const mutation = useMutation({
		mutationFn: async (formData: z.infer<typeof formSchema>) => {
			const response = await fetchWithAuth('/api/tasks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					reference_notes_ids: [],
					destination_note_id: null,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to create task');
			}
			return response.json() as Promise<Task>;
		},
		onSuccess: (createdTask) => {
			queryClient.invalidateQueries({ queryKey: ['tasks', 'infinite'] });
			router.push(`/tasks/${createdTask.id}`);
		},
	});

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
				className="max-w-2xl space-y-6 p-8"
			>
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Task Title</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter task title"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="video_urls"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Video Files</FormLabel>
							<FormControl>
								<FileUpload
									value={field.value}
									onChange={(urls) => field.onChange(urls)}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="instructions"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Instructions</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Provide task instructions..."
									className="min-h-[120px]"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<input type="hidden" {...form.register('agent_type')} />

				<div className="flex gap-4">
					<Button
						type="submit"
						disabled={mutation.isPending || !form.formState.isValid}
					>
						{mutation.isPending ? 'Creating...' : 'Create Task'}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push('/tasks')}
						disabled={mutation.isPending}
					>
						Cancel
					</Button>
				</div>

				{mutation.isError && (
					<p className="text-destructive">
						Error: {mutation.error.message}
					</p>
				)}
			</form>
		</Form>
	);
};
