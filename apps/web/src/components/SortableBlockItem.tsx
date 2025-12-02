import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableBlockItemProps {
  id: string;
  children: (opts: {
    dragHandleProps: React.HTMLAttributes<HTMLButtonElement> | undefined;
    isDragging: boolean;
  }) => React.ReactNode;
}

export function SortableBlockItem({ id, children }: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative"
    >
      {children({
        dragHandleProps: listeners as React.HTMLAttributes<HTMLButtonElement>,
        isDragging,
      })}
    </div>
  );
}
