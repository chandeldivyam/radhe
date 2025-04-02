import { create } from 'zustand';
import { useEffect } from 'react';

interface TasksStoreState {
	selectedTaskId: string | null;
}

interface TasksStoreActions {
	setSelectedTaskId: (id: string | null) => void;
	clearSelectedTask: () => void;
}

interface TasksStore extends TasksStoreState {
	actions: TasksStoreActions;
}

const useTasksStore = create<TasksStore>((set) => ({
	selectedTaskId: null,
	actions: {
		setSelectedTaskId: (id) => set({ selectedTaskId: id }),
		clearSelectedTask: () => set({ selectedTaskId: null }),
	},
}));

// Selectors
export const useSelectedTaskId = () =>
	useTasksStore((state) => state.selectedTaskId);
export const useTaskActions = () => useTasksStore((state) => state.actions);

// Hook for common task selection pattern
export const useTaskSelection = (taskId?: string) => {
	const { setSelectedTaskId, clearSelectedTask } = useTaskActions();

	useEffect(() => {
		if (taskId) {
			setSelectedTaskId(taskId);
		}
		return () => clearSelectedTask();
	}, [taskId, setSelectedTaskId, clearSelectedTask]);
};
