import { create } from 'zustand';

interface TasksStore {
	selectedTaskId: string | null;
	actions: {
		setSelectedTaskId: (id: string | null) => void;
	};
}

const useTasksStore = create<TasksStore>((set) => ({
	selectedTaskId: null,
	actions: {
		setSelectedTaskId: (id) => set({ selectedTaskId: id }),
	},
}));

export const useSelectedTaskId = () =>
	useTasksStore((state) => state.selectedTaskId);
export const useTaskActions = () => useTasksStore((state) => state.actions);
