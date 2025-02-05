import { NotesLayout } from '@/components/features/notes/layout/notes-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <NotesLayout>{children}</NotesLayout>;
}
