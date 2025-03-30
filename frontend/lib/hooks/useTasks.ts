// ./frontend/lib/hooks/useTasks.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { TaskListResponse } from '@/types/task';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';

export const fetchTasks = async (
	skip: number = 0,
	limit: number = 20
): Promise<TaskListResponse> => {
	const response = await fetchWithAuth(
		`/api/tasks?skip=${skip}&limit=${limit}`
	);
	if (!response.ok) throw new Error('Failed to fetch tasks');
	return response.json();
};

export const useTasks = (limit: number = 20) => {
	return useInfiniteQuery({
		queryKey: ['tasks', 'infinite'],
		queryFn: ({ pageParam = 0 }) => fetchTasks(pageParam * limit, limit),
		getNextPageParam: (lastPage, allPages) => {
			// Assuming API returns total count, adjust this logic based on your API's response
			const totalFetched = allPages.flatMap((page) => page.items).length;
			return totalFetched < lastPage.total ? allPages.length : undefined;
		},
		initialPageParam: 0,
	});
};
