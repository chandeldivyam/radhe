import { useState, useEffect } from 'react';
import type { UserResponse } from '@/types/auth';
import type { AddMemberFormData } from '@/lib/schemas/member';
import { toast } from '@/lib/hooks/use-toast';

export function useMembers() {
	const [members, setMembers] = useState<UserResponse[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchMembers = async () => {
		try {
			const response = await fetch('/api/users/all');
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to fetch members');
			}
			const data = await response.json();
			setMembers(data);
		} catch (error) {
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to fetch members',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchMembers();
	}, []);

	const addMember = async (data: AddMemberFormData) => {
		try {
			const response = await fetch('/api/users/add', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to add member');
			}

			await fetchMembers();
			toast({
				title: 'Success',
				description: 'Member added successfully',
			});
		} catch (error) {
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to add member',
				variant: 'destructive',
			});
			throw error;
		}
	};

	const deleteMember = async (userId: string) => {
		try {
			const response = await fetch(`/api/users/${userId}/delete`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete member');
			}

			await fetchMembers();
			toast({
				title: 'Success',
				description: 'Member deleted successfully',
			});
		} catch (error) {
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to delete member',
				variant: 'destructive',
			});
			throw error;
		}
	};

	return {
		members,
		isLoading,
		addMember,
		deleteMember,
	};
} 