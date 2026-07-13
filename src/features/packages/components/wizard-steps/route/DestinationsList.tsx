import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { GripVertical, Trash2, MapPin, Calendar } from 'lucide-react';
import { RouteDestination } from './types';

interface SortableDestinationProps {
  destination: RouteDestination;
  index: number;
  onUpdate: (id: string, updates: Partial<RouteDestination>) => void;
  onRemove: (id: string) => void;
}

function SortableDestination({ destination, index, onUpdate, onRemove }: SortableDestinationProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: destination.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const typeColors = {
    origin: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    stop: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    destination: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border border-border rounded-lg p-4 ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab hover:text-primary touch-none"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${typeColors[destination.type]}`}>
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="font-medium truncate">{destination.name}</span>
          </div>

          <Input
            value={destination.nameAr || ''}
            onChange={(e) => onUpdate(destination.id, { nameAr: e.target.value })}
            placeholder={t('packageWizard.destinationNameAr', 'Arabic name (optional)')}
            dir="rtl"
            className="h-8 text-sm mb-2"
          />

          <div className="flex items-center gap-3 flex-wrap">
            {/* Role is positional (first = start, last = destination) —
                derived automatically when stops are added or reordered. */}
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColors[destination.type]}`}>
              {destination.type === 'origin' && t('packageWizard.origin', 'Start')}
              {destination.type === 'stop' && t('packageWizard.stop', 'Stop')}
              {destination.type === 'destination' && t('packageWizard.destinationType', 'Destination')}
            </span>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min={1}
                max={30}
                value={destination.daysSpent}
                onChange={(e) => onUpdate(destination.id, { daysSpent: parseInt(e.target.value) || 1 })}
                className="w-16 h-8 text-sm"
              />
              <span className="text-sm text-muted-foreground">{t('common.days', 'days')}</span>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(destination.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface DestinationsListProps {
  destinations: RouteDestination[];
  onReorder: (destinations: RouteDestination[]) => void;
  onUpdate: (id: string, updates: Partial<RouteDestination>) => void;
  onRemove: (id: string) => void;
  isRTL?: boolean;
}

export function DestinationsList({
  destinations,
  onReorder,
  onUpdate,
  onRemove
}: DestinationsListProps) {
  const { t } = useTranslation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = destinations.findIndex(d => d.id === active.id);
      const newIndex = destinations.findIndex(d => d.id === over.id);

      const reordered = arrayMove(destinations, oldIndex, newIndex).map((d, i) => ({
        ...d,
        order: i
      }));

      onReorder(reordered);
    }
  };

  if (destinations.length === 0) {
    return (
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">
          {t('packageWizard.noDestinationsYet', 'No destinations added yet')}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {t('packageWizard.searchToAdd', 'Search above or click on the map to add destinations')}
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={destinations.map(d => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {destinations.map((destination, index) => (
            <SortableDestination
              key={destination.id}
              destination={destination}
              index={index}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
