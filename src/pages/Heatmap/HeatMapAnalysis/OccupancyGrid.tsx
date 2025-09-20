import React from 'react';

export interface OccupancyItem {
  buildingId: string;
  buildingName: string;
  currentCount: number;
  predictedCount: number;
  capacity: number;
}

interface Props {
  items: OccupancyItem[];
  onSelect?: (buildingId: string) => void;
  sortBy?: 'name' | 'current' | 'predicted' | 'utilization';
}

function percent(cur: number, cap: number) {
  const v = cap > 0 ? Math.round((cur / cap) * 100) : 0;
  return Math.max(0, Math.min(999, v));
}

function barColor(p: number) {
  if (p >= 100) return 'bg-red-500';
  if (p >= 90) return 'bg-orange-500';
  if (p >= 75) return 'bg-yellow-500';
  return 'bg-emerald-500';
}

const OccupancyGrid: React.FC<Props> = ({ items, onSelect, sortBy = 'utilization' }) => {
  const sorted = [...items].sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.buildingName.localeCompare(b.buildingName);
      case 'current': return b.currentCount - a.currentCount;
      case 'predicted': return b.predictedCount - a.predictedCount;
      case 'utilization':
      default:
        return percent(b.currentCount, b.capacity) - percent(a.currentCount, a.capacity);
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sorted.map(item => {
        const util = percent(item.currentCount, item.capacity);
        const predUtil = percent(item.predictedCount, item.capacity);
        return (
          <button
            key={item.buildingId}
            onClick={() => onSelect?.(item.buildingId)}
            className="text-left p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-800 truncate pr-2">{item.buildingName}</div>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{item.capacity} cap</span>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              Current: <span className="font-medium text-gray-900">{item.currentCount}</span>
              <span className="mx-2 text-gray-400">|</span>
              Pred: <span className="font-medium text-gray-900">{item.predictedCount}</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${barColor(util)}`} style={{ width: `${Math.min(util, 100)}%` }} />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
              <span>{util}% now</span>
              <span className="text-gray-500">{predUtil}% predicted</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default OccupancyGrid;
