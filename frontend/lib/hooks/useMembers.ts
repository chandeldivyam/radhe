import useSWR from 'swr';
import type { UserResponse } from '@/types/auth';
import type { AddMemberFormData } from '@/lib/schemas/member';
import { toast } from '@/lib/hooks/use-toast';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { useRouter } from 'next/navigation';

const fetcher = async (url: string) => {
	const response = await fetch(url);
	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to fetch members');
	}
	return response.json();
};

export function useMembers() {
	const router = useRouter();
	const {
		data: members,
		error,
		mutate,
	} = useSWR<UserResponse[]>('/api/users/all', fetcher, {
		revalidateOnFocus: false,
		dedupingInterval: 5000,
	});

	const addMember = async (data: AddMemberFormData) => {
		try {
			const response = await fetchWithAuth('/api/users/add', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const error = await response.json();
				if (error.requiresLogin) {
					router.push('/login');
				}
				throw new Error(error.error || 'Failed to add member');
			}

			// Optimistically update the cache
			await mutate();

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
			throw error;
		}
	};

	const deleteMember = async (userId: string) => {
		try {
			// Optimistically remove the member from the cache
			const currentMembers = members || [];
			mutate(
				currentMembers.filter((member) => member.id !== userId),
				false
			);

			const response = await fetchWithAuth(`/api/users/${userId}/delete`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				// Revert the optimistic update if the deletion failed
				await mutate();
				const error = await response.json();
				if (error.requiresLogin) {
					router.push('/login');
				}
				throw new Error(error.error || 'Failed to delete member');
			}

			// Confirm the cache update
			await mutate();

			toast({
				title: 'Success',
				description: 'Member deleted successfully',
			});
		} catch (error) {
			toast({
				title: 'Error',
				description:
					error instanceof Error
						? error.message
						: 'Failed to delete member',
				variant: 'destructive',
			});
			throw error;
		}
	};

	return {
		members,
		isLoading: !error && !members,
		isError: error,
		addMember,
		deleteMember,
	};
}
