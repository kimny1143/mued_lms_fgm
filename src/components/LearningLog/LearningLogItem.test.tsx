import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LearningLogItem, LearningActivity } from './LearningLogItem';

describe('LearningLogItem', () => {
  const mockActivity: LearningActivity = {
    id: '1',
    type: 'lesson',
    title: 'テストレッスン',
    description: 'これはテスト用の説明です',
    timestamp: new Date('2023-01-01T12:00:00Z'),
    duration: 45,
    progress: 75,
    completed: false,
  };

  it('正しくレンダリングされること', () => {
    render(<LearningLogItem activity={mockActivity} />);
    
    // 基本的なテキストが表示されるか確認
    expect(screen.getByText('テストレッスン')).toBeInTheDocument();
    expect(screen.getByText('これはテスト用の説明です')).toBeInTheDocument();
    expect(screen.getByText('レッスン')).toBeInTheDocument();
    
    // 進捗バーが表示されるか確認
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle('width: 75%');
    
    // 学習時間が表示されるか確認
    expect(screen.getByText(/学習時間: 45分/)).toBeInTheDocument();
  });

  it('クリックハンドラーが呼ばれること', () => {
    const handleClick = vi.fn();
    render(<LearningLogItem activity={mockActivity} onClick={handleClick} />);
    
    fireEvent.click(screen.getByTestId('learning-log-item'));
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(mockActivity);
  });

  it('説明がない場合、説明が表示されないこと', () => {
    const activityWithoutDescription = {
      ...mockActivity,
      description: undefined,
    };
    
    render(<LearningLogItem activity={activityWithoutDescription} />);
    
    // タイトルは表示される
    expect(screen.getByText('テストレッスン')).toBeInTheDocument();
    // 説明は表示されない
    expect(screen.queryByText('これはテスト用の説明です')).not.toBeInTheDocument();
  });

  it('進捗がない場合、進捗バーが表示されないこと', () => {
    const activityWithoutProgress = {
      ...mockActivity,
      progress: undefined,
    };
    
    render(<LearningLogItem activity={activityWithoutProgress} />);
    
    // 進捗バーは表示されない
    expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();
  });

  it('完了済みの場合、完了ステータスが表示されること', () => {
    const completedActivity = {
      ...mockActivity,
      completed: true,
    };
    
    render(<LearningLogItem activity={completedActivity} />);
    
    // 完了ステータスが表示される
    expect(screen.getByText('完了')).toBeInTheDocument();
  });

  it('アクティビティタイプに基づいて正しいアイコンが表示されること', () => {
    // レッスンタイプ
    const { rerender } = render(<LearningLogItem activity={mockActivity} />);
    expect(screen.getByText('レッスン')).toBeInTheDocument();
    
    // 練習問題タイプ
    rerender(<LearningLogItem activity={{ ...mockActivity, type: 'exercise' }} />);
    expect(screen.getByText('練習問題')).toBeInTheDocument();
    
    // 教材タイプ
    rerender(<LearningLogItem activity={{ ...mockActivity, type: 'material' }} />);
    expect(screen.getByText('教材')).toBeInTheDocument();
    
    // クイズタイプ
    rerender(<LearningLogItem activity={{ ...mockActivity, type: 'quiz' }} />);
    expect(screen.getByText('クイズ')).toBeInTheDocument();
  });
}); 