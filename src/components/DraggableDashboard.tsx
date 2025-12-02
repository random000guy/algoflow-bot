import { ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardItem {
  id: string;
  component: ReactNode;
  colSpan?: 1 | 2 | 3;
}

interface SortableItemProps {
  id: string;
  children: ReactNode;
  colSpan?: 1 | 2 | 3;
}

const SortableItem = ({ id, children, colSpan = 1 }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        colSpan === 2 && "lg:col-span-2",
        colSpan === 3 && "lg:col-span-3",
        isDragging && "z-50 opacity-90 scale-105"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing bg-card/80 backdrop-blur-sm rounded-md p-1 border border-border/50 shadow-lg"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
};

interface DraggableDashboardProps {
  items: DashboardItem[];
  onReorder: (items: DashboardItem[]) => void;
  className?: string;
}

export const DraggableDashboard = ({
  items,
  onReorder,
  className,
}: DraggableDashboardProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6", className)}>
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id} colSpan={item.colSpan}>
              {item.component}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
