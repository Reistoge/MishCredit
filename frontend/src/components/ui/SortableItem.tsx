import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type SortableItemProps = {
  id: string;
  /**
   * If `label` is provided the component will render the default
   * draggable tag UI (grip + text). Otherwise it will render `children`
   * inside the draggable wrapper. This keeps the drag behaviour and
   * transform logic on the prefab element.
   */
  label?: string;
  children?: React.ReactNode;
  className?: string;
};

export function SortableItem({ id, children, label, className = '' }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none', // Prevents scrolling on mobile when dragging
  };

  // default inner UI for a priority tag (grip + label)
  const DefaultTag = ({ text }: { text: string }) => (
    <span
      className={
        `flex items-center gap-3 cursor-move select-none rounded px-2 py-1 text-xs font-semibold bg-teal-500/20 text-teal-700 hover:text-white hover:bg-teal-700 dark:text-teal-100 focus-visible:ring-teal-500 transition group: ` +
        className
      }
    //   role="button"
      aria-label={`Prioridad ${text}`}
      {...listeners}
      {...attributes}
    >
      <span className="flex h-4 w-4 flex-col items-center justify-center opacity-90" aria-hidden="true">
        <svg
          width="8"
          height="12"
          viewBox="0 0 8 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-teal-700 dark:text-teal-100 group-hover:text-teal-100"
        >
          <circle cx="2" cy="2" r="1" fill="currentColor" />
          <circle cx="6" cy="2" r="1" fill="currentColor" />
          <circle cx="2" cy="6" r="1" fill="currentColor" />
          <circle cx="6" cy="6" r="1" fill="currentColor" />
          <circle cx="2" cy="10" r="1" fill="currentColor" />
          <circle cx="6" cy="10" r="1" fill="currentColor" />
        </svg>
      </span>
      <span className="truncate">{text}</span>
    </span>
  );

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {label ? (
        // provide the prefab styled tag and attach listeners on it
        <DefaultTag text={label} />
      ) : (
        // preserve existing children but ensure the wrapper forwards listeners so the element can be dragged
        <div {...listeners} className={className}>
          {children}
        </div>
      )}
    </div>
  );
}