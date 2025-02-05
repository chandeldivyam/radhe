import { ReactNode } from 'react';
import { NotesSidebar } from './notes-sidebar';

interface NotesLayoutProps {
  children: ReactNode;
}

export function NotesLayout({ children }: NotesLayoutProps) {
  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r bg-background">
        <NotesSidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
