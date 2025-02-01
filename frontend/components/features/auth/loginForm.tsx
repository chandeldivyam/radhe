'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/schemas/auth';
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

export function LoginForm() {
	const { login } = useAuth();
	const [error, setError] = useState<string | null>(null);

	const form = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	});

	const onSubmit = async (data: LoginFormData) => {
		try {
			setError(null);
			await login(data.email, data.password);
		} catch (err) {
			console.error('Error logging in:', err);
			setError('Invalid email or password');
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="email"
					render={({
						field,
					}: {
						field: import('react-hook-form').ControllerRenderProps<
							LoginFormData,
							'email'
						>;
					}) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter your email"
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
					name="password"
					render={({
						field,
					}: {
						field: import('react-hook-form').ControllerRenderProps<
							LoginFormData,
							'password'
						>;
					}) => (
						<FormItem>
							<FormLabel>Password</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter your password"
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
					{form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
				</Button>
			</form>
		</Form>
	);
}
