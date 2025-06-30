export interface Task {
  id: string;
  title: string;
  parentId?: string;
  children: Task[];
  deadline?: string;
  completed?: boolean;
  visible?: boolean;
}
