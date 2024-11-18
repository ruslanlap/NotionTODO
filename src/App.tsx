import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import TodoApp from '@/components/todo/todo-app';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <TodoApp />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;