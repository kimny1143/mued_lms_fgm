import { FC, useMemo, useState } from 'react';
import { LearningLogItem, LearningActivity } from './LearningLogItem';

export interface LearningLogListProps {
  activities: LearningActivity[];
  onActivityClick?: (activity: LearningActivity) => void;
  showFilters?: boolean;
  emptyMessage?: string;
}

export const LearningLogList: FC<LearningLogListProps> = ({
  activities,
  onActivityClick,
  showFilters = true,
  emptyMessage = '学習記録がありません'
}) => {
  const [typeFilter, setTypeFilter] = useState<LearningActivity['type'] | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  const filteredActivities = useMemo(() => {
    let result = [...activities];
    
    // タイプフィルター
    if (typeFilter !== 'all') {
      result = result.filter(activity => activity.type === typeFilter);
    }
    
    // ソート
    result.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return result;
  }, [activities, typeFilter, sortOrder]);
  
  return (
    <div data-testid="learning-log-list">
      {showFilters && (
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 text-sm rounded-full ${
                typeFilter === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setTypeFilter('all')}
              data-testid="filter-all"
            >
              すべて
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-full ${
                typeFilter === 'lesson'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
              onClick={() => setTypeFilter('lesson')}
              data-testid="filter-lesson"
            >
              レッスン
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-full ${
                typeFilter === 'exercise'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
              onClick={() => setTypeFilter('exercise')}
              data-testid="filter-exercise"
            >
              練習問題
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-full ${
                typeFilter === 'material'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
              onClick={() => setTypeFilter('material')}
              data-testid="filter-material"
            >
              教材
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-full ${
                typeFilter === 'quiz'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
              onClick={() => setTypeFilter('quiz')}
              data-testid="filter-quiz"
            >
              クイズ
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="sort-order" className="text-sm text-gray-600">
              並び順:
            </label>
            <select
              id="sort-order"
              className="text-sm border rounded p-1"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              data-testid="sort-select"
            >
              <option value="newest">新しい順</option>
              <option value="oldest">古い順</option>
            </select>
          </div>
        </div>
      )}
      
      {filteredActivities.length > 0 ? (
        <div className="space-y-3" data-testid="activity-container">
          {filteredActivities.map((activity) => (
            <LearningLogItem
              key={activity.id}
              activity={activity}
              onClick={onActivityClick}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center bg-gray-50 rounded-lg border">
          <p className="text-gray-500" data-testid="empty-message">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}; 