'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOrgSchema, type CreateOrgFormData } from '@/lib/schemas/auth';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/authContext';
import { useState } from 'react';

export function CreateOrgForm() {
	const { createOrganization } = useAuth();
	const [error, setError] = useState<string | null>(null);

	const form = useForm<CreateOrgFormData>({
		resolver: zodResolver(createOrgSchema),
		defaultValues: {
			name: '',
			admin_email: '',
			admin_password: '',
		},
	});

	const onSubmit = async (data: CreateOrgFormData) => {
		try {
			setError(null);
			await createOrganization(data);
		} catch (err) {
			console.error('Error creating organization:', err);
			setError('Failed to create organization. Please try again.');
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="name"
					render={({
						field,
					}: {
						field: import('react-hook-form').ControllerRenderProps<
							CreateOrgFormData,
							'name'
						>;
					}) => (
						<FormItem>
							<FormLabel>Organization Name</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter organization name"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="admin_email"
					render={({
						field,
					}: {
						field: import('react-hook-form').ControllerRenderProps<
							CreateOrgFormData,
							'admin_email'
						>;
					}) => (
						<FormItem>
							<FormLabel>Admin Email</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter admin email"
									type="email"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="admin_password"
					render={({
						field,
					}: {
						field: import('react-hook-form').ControllerRenderProps<
							CreateOrgFormData,
							'admin_password'
						>;
					}) => (
						<FormItem>
							<FormLabel>Admin Password</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter admin password"
									type="password"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{error && (
					<div className="text-sm text-destructive text-center">
						{error}
					</div>
				)}

				<Button
					type="submit"
					className="w-full"
					disabled={form.formState.isSubmitting}
				>
					{form.formState.isSubmitting
						? 'Creating...'
						: 'Create Organization'}
				</Button>
			</form>
		</Form>
	);
}
