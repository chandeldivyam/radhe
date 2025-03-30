// ./frontend/types/task.ts
export interface Task {
	id: string;
	title: string;
	status: 'pending' | 'processing' | 'completed' | 'failed';
	created_at: string;
	updated_at: string;
	created_by: string;
	agent_type: string;
	organization_id: string;
}

export interface TaskListResponse {
	items: Task[];
	total: number;
}
