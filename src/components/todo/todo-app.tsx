// src/components/todo/TodoApp.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Pencil,
  Plus,
  Trash2,
  Moon,
  Sun,
  RefreshCw,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { notionApi } from "@/lib/notion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

const AUTO_REFRESH_INTERVAL = 30000;

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { theme, setTheme } = useTheme();

  const fetchTodos = useCallback(async () => {
    setIsLoading(true);
    try {
      const notionTodos = await notionApi.fetchTodos();
      setTodos(notionTodos);
      setLastUpdate(new Date());
      toast.success("Todos synced with Notion");
    } catch (error) {
      toast.error("Failed to fetch todos from Notion");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
    const intervalId = setInterval(fetchTodos, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchTodos]);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const todo = await notionApi.createTodo(newTodo);
      setTodos((prev) => [todo, ...prev]);
      setNewTodo("");
      toast.success("Todo added to Notion");
    } catch (error) {
      toast.error("Failed to add todo to Notion");
    }
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    try {
      await notionApi.updateTodo(id, { completed: !todo.completed });
      setTodos((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t
        )
      );
    } catch (error) {
      toast.error("Failed to update todo in Notion");
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await notionApi.deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      toast.success("Todo deleted from Notion");
    } catch (error) {
      toast.error("Failed to delete todo from Notion");
    }
  };

  const updateTodo = async (id: string, newText: string) => {
    if (!newText.trim()) return;
    try {
      await notionApi.updateTodo(id, { text: newText });
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, text: newText } : t))
      );
      setEditingId(null);
      toast.success("Todo updated in Notion");
    } catch (error) {
      toast.error("Failed to update todo in Notion");
    }
  };

  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${format(date, "HH:mm")}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${format(date, "HH:mm")}`;
    } else {
      return format(date, "MMM d, yyyy HH:mm");
    }
  }, []);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === "1" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      document.getElementById("new-todo-input")?.focus();
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  const sortedTodos = useMemo(
    () => todos.sort((a, b) => b.createdAt - a.createdAt),
    [todos]
  );

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <Card className="mx-auto max-w-3xl shadow-lg">
        <Header
          lastUpdate={lastUpdate}
          isLoading={isLoading}
          fetchTodos={fetchTodos}
          theme={theme}
          setTheme={setTheme}
        />
        <div className="p-4 sm:p-6">
          <form onSubmit={addTodo} className="mb-6 flex gap-2">
            <Input
              id="new-todo-input"
              placeholder="Add a new todo (Ctrl/⌘+1)"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              className="flex-1 h-10 text-base"
              disabled={isLoading}
              aria-label="Add new todo"
            />
            <Button type="submit" disabled={isLoading} className="h-10">
              <Plus className="h-5 w-5 mr-2" />
              Add
            </Button>
          </form>
          <div className="space-y-2">
            {sortedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                toggleTodo={toggleTodo}
                deleteTodo={deleteTodo}
                updateTodo={updateTodo}
                editingId={editingId}
                setEditingId={setEditingId}
                formatDate={formatDate}
                isLoading={isLoading}
              />
            ))}
            {!isLoading && todos.length === 0 && (
              <div className="text-center text-base text-muted-foreground">
                No todos yet. Add one to get started!
              </div>
            )}
            {isLoading && (
              <div className="text-center text-base text-muted-foreground">
                Loading todos from Notion...
              </div>
            )}
          </div>
        </div>
        <Footer />
      </Card>
    </div>
  );
}

interface HeaderProps {
  lastUpdate: Date;
  isLoading: boolean;
  fetchTodos: () => void;
  theme: string;
  setTheme: (theme: string) => void;
}

function Header({
  lastUpdate,
  isLoading,
  fetchTodos,
  theme,
  setTheme,
}: HeaderProps) {
  return (
    <div className="border-b">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="text-3xl font-bold">Clear Task</h1>
          </div>
          <div className="flex items-center gap-4">
            <LastUpdate lastUpdate={lastUpdate} />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchTodos}
                disabled={isLoading}
                className="h-10 w-10"
                aria-label="Refresh Todos"
              >
                <RefreshCw
                  className={cn("h-5 w-5", isLoading && "animate-spin")}
                />
              </Button>
              <ThemeSwitcher theme={theme} setTheme={setTheme} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 32 32"
        className="h-8 w-8"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="4"
          width="24"
          height="24"
          rx="6"
          className="fill-primary"
        />
        <path
          d="M11 16L15 20L21 12"
          className="stroke-primary-foreground"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

function LastUpdate({ lastUpdate }: { lastUpdate: Date }) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-2.5 hover:bg-muted/80 hover:text-black transition-all duration-200 cursor-default group">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-foreground/70" />
              <span className="text-sm font-medium tracking-tight text-foreground/70">
                Last update at {format(lastUpdate, "HH:mm:ss")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <span className="absolute h-1.5 w-1.5 bg-green-500 rounded-full animate-ping opacity-75" />
                <span className="h-1.5 w-1.5 bg-green-500 rounded-full block" />
              </div>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-green-500">Live</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          align="center"
          className="bg-popover/95 backdrop-blur-sm border-border/40 shadow-xl"
        >
          <div className="flex flex-col gap-1 p-1">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-base">
                {format(lastUpdate, "HH:mm:ss")}
              </span>
            </div>
            <div className="text-xs text-muted-foreground ml-5">
              {format(lastUpdate, "EEEE, dd MMMM yyyy")}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
function ThemeSwitcher({
  theme,
  setTheme,
}: {
  theme: string;
  setTheme: (theme: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface TodoItemProps {
  todo: Todo;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  updateTodo: (id: string, newText: string) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  formatDate: (timestamp: number) => string;
  isLoading: boolean;
}

  function TodoItem({
    todo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    editingId,
    setEditingId,
    formatDate,
    isLoading,
  }: TodoItemProps) {
    return (
      <div
        className={cn(
          "group flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted",
          todo.completed && "bg-muted"
        )}
      >
        <Checkbox
          checked={todo.completed}
          onCheckedChange={() => toggleTodo(todo.id)}
          disabled={isLoading}
          className="h-5 w-5"
          aria-label={`Mark ${todo.text} as ${
            todo.completed ? "incomplete" : "complete"
          }`}
        />
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          {editingId === todo.id ? (
            <Input
              autoFocus
              defaultValue={todo.text}
              onBlur={(e) => updateTodo(todo.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateTodo(todo.id, e.currentTarget.value);
                }
              }}
              disabled={isLoading}
              className="h-9 text-base"
              aria-label="Edit todo"
            />
          ) : (
            <>
              <span
                className={cn(
                  "text-base truncate",
                  todo.completed && "text-muted-foreground line-through"
                )}
              >
                {todo.text}
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground/80 transition-colors">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" strokeWidth={2.5} />
                        <span className="font-medium tracking-tight">
                          {formatDate(todo.createdAt)}
                        </span>
                      </div>
                      <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                      <span className="text-muted-foreground/50">
                        {format(new Date(todo.createdAt), 'EEEE')}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    className="bg-popover/95 backdrop-blur-sm border-border/40 shadow-lg"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="text-sm font-medium">
                        {format(new Date(todo.createdAt), 'MMMM d, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(todo.createdAt), 'EEEE, h:mm a')}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
        <div className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingId(editingId === todo.id ? null : todo.id)}
            disabled={isLoading}
            aria-label="Edit todo"
          >
            <Pencil className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteTodo(todo.id)}
            disabled={isLoading}
            aria-label="Delete todo"
          >
            <Trash2 className="h-5 w-5 text-destructive" />
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden h-8 w-8"
              aria-label="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditingId(todo.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => deleteTodo(todo.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

function Footer() {
  return (
    <div className="border-t p-4 sm:p-6 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} Clear Task. All rights reserved.
    </div>
  );
}
