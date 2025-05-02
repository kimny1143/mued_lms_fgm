import { FC } from 'react';
import { formatDistance } from 'date-fns';
import { ja } from 'date-fns/locale';

export interface LearningActivity {
  id: string;
  type: 'lesson' | 'exercise' | 'material' | 'quiz';
  title: string;
  description?: string;
  timestamp: Date;
  duration?: number; // in minutes
  progress?: number; // 0-100
  completed?: boolean;
}

interface LearningLogItemProps {
  activity: LearningActivity;
  onClick?: (activity: LearningActivity) => void;
}

export const LearningLogItem: FC<LearningLogItemProps> = ({ 
  activity,
  onClick 
}) => {
  const { type, title, description, timestamp, duration, progress, completed } = activity;
  
  const getTypeIcon = (type: LearningActivity['type']) => {
    switch (type) {
      case 'lesson':
        return (
          <div className="rounded-full bg-blue-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'exercise':
        return (
          <div className="rounded-full bg-green-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case 'material':
        return (
          <div className="rounded-full bg-yellow-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        );
      case 'quiz':
        return (
          <div className="rounded-full bg-purple-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };
  
  const formatTypeLabel = (type: LearningActivity['type']) => {
    switch (type) {
      case 'lesson': return 'レッスン';
      case 'exercise': return '練習問題';
      case 'material': return '教材';
      case 'quiz': return 'クイズ';
      default: return type;
    }
  };
  
  const formatTimeAgo = (date: Date) => {
    return formatDistance(date, new Date(), { 
      addSuffix: true,
      locale: ja 
    });
  };
  
  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    
    if (minutes < 60) {
      return `${minutes}分`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}時間`;
    }
    
    return `${hours}時間${remainingMinutes}分`;
  };
  
  return (
    <div 
      className={`
        p-4 mb-3 border rounded-lg hover:shadow-md transition-shadow
        ${onClick ? 'cursor-pointer' : ''}
        ${completed ? 'bg-gray-50' : 'bg-white'}
      `}
      onClick={() => onClick?.(activity)}
      data-testid="learning-log-item"
    >
      <div className="flex items-start">
        <div className="mr-4 mt-1">
          {getTypeIcon(type)}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {formatTypeLabel(type)}
              </span>
              <h3 className="text-lg font-medium text-gray-900 mt-1" data-testid="activity-title">{title}</h3>
            </div>
            
            <div className="text-sm text-gray-500">
              {formatTimeAgo(timestamp)}
            </div>
          </div>
          
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
          
          <div className="flex items-center justify-between mt-3">
            {typeof progress === 'number' && (
              <div className="w-full max-w-xs">
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${progress}%` }}
                      data-testid="progress-bar"
                    />
                  </div>
                  <span className="text-xs text-gray-500 ml-2">{progress}%</span>
                </div>
              </div>
            )}
            
            {duration && (
              <div className="text-sm text-gray-500">
                学習時間: {formatDuration(duration)}
              </div>
            )}
            
            {completed && (
              <div className="flex items-center text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">完了</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 