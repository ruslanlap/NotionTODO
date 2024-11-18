// src/components/todo/todo-app.tsx
import { useEffect, useState } from "react";
import {
  Pencil,
  Plus,
  Trash2,
  Moon,
  Sun,
  Clock,
  RefreshCw,
  MoreVertical,
} from "lucide-react";

// Import toast notifications from the sonner library
import { toast } from "sonner";

// Import date formatting functions from date-fns
import { format } from "date-fns";

// Import custom UI components (Button, Card, Checkbox, etc.)
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

// Import DropdownMenu components for theme selection
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import Input component for adding and editing todos
import { Input } from "@/components/ui/input";

// Import theme provider to handle light/dark theme logic
import { useTheme } from "@/components/theme-provider";

// Utility function for conditional class names
import { cn } from "@/lib/utils";

// Import Notion function
import { notionApi } from "@/lib/notion";


// Import Tooltip components for displaying additional info
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";



// Define the structure of a Todo item
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

// Auto-refresh interval for syncing todos (30 seconds)
const AUTO_REFRESH_INTERVAL = 30000;

// Main component for the Todo application
export default function TodoApp() {
  // State to store the list of todos
  const [todos, setTodos] = useState<Todo[]>([]);

  // State to hold the new todo text input
  const [newTodo, setNewTodo] = useState("");

  // State to track which todo is being edited
  const [editingId, setEditingId] = useState<string | null>(null);

  // State to show loading spinner while fetching todos
  const [isLoading, setIsLoading] = useState(true);

  // State to store the timestamp of the last sync with Notion
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Get the current theme (light, dark, or system) and the function to set it
  const { theme, setTheme } = useTheme();

  // Function to fetch todos from the Notion API
  const fetchTodos = async () => {
    try {
      setIsLoading(true);
      const notionTodos = await notionApi.fetchTodos();
      setTodos(notionTodos);
      setLastUpdate(new Date());
      toast.success("Todos synced with Notion");
    } catch (error) {
      toast.error("Failed to fetch todos from Notion");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch todos when the component mounts and set up an auto-refresh interval
  useEffect(() => {
    fetchTodos(); // Initial fetch
    const intervalId = setInterval(fetchTodos, AUTO_REFRESH_INTERVAL); // Set up auto-refresh
    return () => clearInterval(intervalId); // Clean up on component unmount
  }, []);

  // Function to handle adding a new todo
  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!newTodo.trim()) return; // Do nothing if the input is empty

    try {
      const todo = await notionApi.createTodo(newTodo); // Create a new todo in Notion
      setTodos((prev) => [todo, ...prev]); // Prepend the new todo to the list
      setNewTodo(""); // Clear the input field
      toast.success("Todo added to Notion"); // Show success message
    } catch (error) {
      toast.error("Failed to add todo to Notion"); // Show error message if creation fails
    }
  };

  // Function to toggle the completion status of a todo
  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      await notionApi.updateTodo(id, { completed: !completed }); // Update the todo in Notion
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id ? { ...todo, completed: !completed } : todo,
        ),
      ); // Update the local state
    } catch (error) {
      toast.error("Failed to update todo in Notion"); // Show error message if update fails
    }
  };

  // Function to delete a todo
  const deleteTodo = async (id: string) => {
    try {
      await notionApi.deleteTodo(id); // Delete the todo from Notion
      setTodos((prev) => prev.filter((todo) => todo.id !== id)); // Remove the todo from the local state
      toast.success("Todo deleted from Notion"); // Show success message
    } catch (error) {
      toast.error("Failed to delete todo from Notion"); // Show error message if deletion fails
    }
  };

  // Function to start editing a todo
  const startEditing = (id: string) => {
    setEditingId(id); // Set the id of the todo being edited
  };

  // Function to update the text of a todo
  const updateTodo = async (id: string, newText: string) => {
    if (!newText.trim()) return; // Do nothing if the new text is empty
    try {
      await notionApi.updateTodo(id, { text: newText }); // Update the todo in Notion
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id ? { ...todo, text: newText } : todo,
        ),
      ); // Update the local state
      setEditingId(null); // Exit editing mode
      toast.success("Todo updated in Notion"); // Show success message
    } catch (error) {
      toast.error("Failed to update todo in Notion"); // Show error message if update fails
    }
  };

  // Keyboard shortcut to focus the new todo input (Ctrl/⌘ + 1)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "1" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        document.getElementById("new-todo-input")?.focus(); // Focus the input field
      }
    };

    window.addEventListener("keydown", handleKeyPress); // Add event listener for key presses
    return () => window.removeEventListener("keydown", handleKeyPress); // Clean up on component unmount
  }, []);

  // Utility function to format timestamps for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${format(date, "HH:mm")}`; // Show "Today" if the todo was created today
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${format(date, "HH:mm")}`; // Show "Yesterday" if it was created yesterday
    } else {
      return format(date, "MMM d, yyyy HH:mm"); // Otherwise, show the full date
    }
  };

  // Render the TodoApp UI
  return (
    <div className="min-h-screen bg-background p-2 sm:p-8">
      <Card className="mx-auto max-w-3xl">
        {/* Header section - адаптований для мобільних */}
        <div className="border-b">
          <div className="p-3 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Логотип і заголовок */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <svg
                    viewBox="0 0 32 32"
                    className="h-7 w-7 sm:h-8 sm:w-8"
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
                <h1 className="text-2xl sm:text-3xl font-bold">Clear Task</h1>
              </div>

              {/* Контроли - адаптовані для мобільних */}
              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                {/* Last update tooltip - спрощений для мобільних */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 rounded-lg border border-border/40 p-2 sm:p-2.5 hover:border-border transition-all duration-200">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        <span className="text-xs sm:text-sm font-medium">
                          {format(lastUpdate, "HH:mm:ss")} last update
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                        </div>

                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-primary">
                          {format(lastUpdate, "HH:mm")}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {format(lastUpdate, "dd MMM yyyy")}
                        </span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Кнопки оновлення і теми */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchTodos}
                    disabled={isLoading}
                    className="h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <RefreshCw
                      className={cn(
                        "h-4 w-4 sm:h-5 sm:w-5",
                        isLoading && "animate-spin",
                      )}
                    />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                      >
                        {theme === "dark" ? (
                          <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
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
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-6">
          {/* Форма додавання - адаптована для мобільних */}
          <form onSubmit={addTodo} className="mb-4 sm:mb-6 flex gap-2">
            <Input
              id="new-todo-input"
              placeholder="Add a new todo (Ctrl/⌘+1)"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              className="flex-1 text-sm sm:text-base h-9 sm:h-10"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading} className="h-9 sm:h-10">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </form>

          {/* Список todo - адаптований для мобільних */}
          <div className="space-y-2">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg border p-2 sm:p-3 transition-colors hover:bg-muted",
                  todo.completed && "bg-muted",
                )}
              >
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
                  disabled={isLoading}
                  className="h-4 w-4 sm:h-5 sm:w-5"
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
                      className="text-sm sm:text-base h-8 sm:h-9"
                    />
                  ) : (
                    <>
                      <span
                        className={cn(
                          "flex-1 text-sm sm:text-base truncate",
                          todo.completed &&
                            "text-muted-foreground line-through",
                        )}
                      >
                        {todo.text}
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span className="truncate">
                                {formatDate(todo.createdAt)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            Created: {format(todo.createdAt, "PPpp")}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>

                {/* Кнопки дій - адаптовані для мобільних */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:hidden"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEditing(todo.id)}>
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

                {/* Кнопки для десктопу */}
                <div className="hidden sm:flex opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditing(todo.id)}
                    disabled={isLoading}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTodo(todo.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {!isLoading && todos.length === 0 && (
              <div className="text-center text-sm sm:text-base text-muted-foreground">
                No todos yet. Add one to get started!
              </div>
            )}

            {isLoading && (
              <div className="text-center text-sm sm:text-base text-muted-foreground">
                Loading todos from Notion...
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}