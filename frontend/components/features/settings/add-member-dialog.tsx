'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addMemberSchema } from '@/lib/schemas/member';
import type { AddMemberFormData } from '@/lib/schemas/member';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/hooks/use-toast';

interface AddMemberDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAdd: (data: AddMemberFormData) => Promise<void>;
}

export function AddMemberDialog({
	open,
	onOpenChange,
	onAdd,
}: AddMemberDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<AddMemberFormData>({
		resolver: zodResolver(addMemberSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	});

	const onSubmit = async (data: AddMemberFormData) => {
		try {
			setIsSubmitting(true);
			await onAdd(data);
			form.reset();
			onOpenChange(false);
			toast({
				title: 'Success',
				description: 'Member added successfully',
			});
		} catch (error) {
			toast({
				title: 'Error',
				description:
					error instanceof Error
						? error.message
						: 'Failed to add member',
				variant: 'destructive',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add New Member</DialogTitle>
				</DialogHeader>
				<DialogDescription className="sr-only">
					Add a new member to the team
				</DialogDescription>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter member's email"
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
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="Enter member's password"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end space-x-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? 'Adding...' : 'Add Member'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
