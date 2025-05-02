import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LearningLogList } from './LearningLogList';
import { LearningActivity } from './LearningLogItem';

describe('LearningLogList', () => {
  // テスト用のモックデータ
  const mockActivities: LearningActivity[] = [
    {
      id: '1',
      type: 'lesson',
      title: 'レッスン1',
      description: 'レッスン1の説明',
      timestamp: new Date('2023-01-01T12:00:00Z'),
      duration: 45,
      progress: 75,
      completed: false,
    },
    {
      id: '2',
      type: 'exercise',
      title: '練習問題1',
      description: '練習問題1の説明',
      timestamp: new Date('2023-01-02T12:00:00Z'),
      duration: 30,
      progress: 50,
      completed: false,
    },
    {
      id: '3',
      type: 'material',
      title: '教材1',
      description: '教材1の説明',
      timestamp: new Date('2023-01-03T12:00:00Z'),
      duration: 60,
      progress: 25,
      completed: false,
    },
    {
      id: '4',
      type: 'quiz',
      title: 'クイズ1',
      description: 'クイズ1の説明',
      timestamp: new Date('2023-01-04T12:00:00Z'),
      duration: 15,
      completed: true,
    },
  ];

  it('アクティビティリストを正しくレンダリングすること', () => {
    render(<LearningLogList activities={mockActivities} />);
    
    // 全てのアクティビティタイトルが表示されるか確認
    expect(screen.getByText('レッスン1')).toBeInTheDocument();
    expect(screen.getByText('練習問題1')).toBeInTheDocument();
    expect(screen.getByText('教材1')).toBeInTheDocument();
    expect(screen.getByText('クイズ1')).toBeInTheDocument();
    
    // フィルターボタンが表示されるか確認
    expect(screen.getByTestId('filter-all')).toBeInTheDocument();
    expect(screen.getByTestId('filter-lesson')).toBeInTheDocument();
    expect(screen.getByTestId('filter-exercise')).toBeInTheDocument();
    expect(screen.getByTestId('filter-material')).toBeInTheDocument();
    expect(screen.getByTestId('filter-quiz')).toBeInTheDocument();
    
    // ソート選択が表示されるか確認
    expect(screen.getByTestId('sort-select')).toBeInTheDocument();
  });

  it('フィルターボタンをクリックすると、フィルタリングが機能すること', () => {
    render(<LearningLogList activities={mockActivities} />);
    
    // 最初は全てのアクティビティが表示されていることを確認
    expect(screen.getByText('レッスン1')).toBeInTheDocument();
    expect(screen.getByText('練習問題1')).toBeInTheDocument();
    expect(screen.getByText('教材1')).toBeInTheDocument();
    expect(screen.getByText('クイズ1')).toBeInTheDocument();
    
    // レッスンフィルターをクリック
    fireEvent.click(screen.getByTestId('filter-lesson'));
    
    // レッスンのみが表示されていることを確認
    expect(screen.getByText('レッスン1')).toBeInTheDocument();
    expect(screen.queryByText('練習問題1')).not.toBeInTheDocument();
    expect(screen.queryByText('教材1')).not.toBeInTheDocument();
    expect(screen.queryByText('クイズ1')).not.toBeInTheDocument();
    
    // 練習問題フィルターをクリック
    fireEvent.click(screen.getByTestId('filter-exercise'));
    
    // 練習問題のみが表示されていることを確認
    expect(screen.queryByText('レッスン1')).not.toBeInTheDocument();
    expect(screen.getByText('練習問題1')).toBeInTheDocument();
    expect(screen.queryByText('教材1')).not.toBeInTheDocument();
    expect(screen.queryByText('クイズ1')).not.toBeInTheDocument();
    
    // すべてのフィルターをクリック
    fireEvent.click(screen.getByTestId('filter-all'));
    
    // 再び全てのアクティビティが表示されていることを確認
    expect(screen.getByText('レッスン1')).toBeInTheDocument();
    expect(screen.getByText('練習問題1')).toBeInTheDocument();
    expect(screen.getByText('教材1')).toBeInTheDocument();
    expect(screen.getByText('クイズ1')).toBeInTheDocument();
  });

  it('ソート順の変更が機能すること', () => {
    render(<LearningLogList activities={mockActivities} />);
    
    // デフォルトでは新しい順（降順）でソートされる
    const activityContainer = screen.getByTestId('activity-container');
    const initialChildren = activityContainer.children;
    expect(initialChildren[0]).toHaveTextContent('クイズ1');
    expect(initialChildren[initialChildren.length - 1]).toHaveTextContent('レッスン1');
    
    // ソートを古い順に変更
    fireEvent.change(screen.getByTestId('sort-select'), { target: { value: 'oldest' } });
    
    // 古い順でソートされたことを確認
    const updatedContainer = screen.getByTestId('activity-container');
    const updatedChildren = updatedContainer.children;
    expect(updatedChildren[0]).toHaveTextContent('レッスン1');
    expect(updatedChildren[updatedChildren.length - 1]).toHaveTextContent('クイズ1');
  });

  it('showFilters=falseの場合、フィルターが表示されないこと', () => {
    render(<LearningLogList activities={mockActivities} showFilters={false} />);
    
    // フィルターボタンが表示されていないことを確認
    expect(screen.queryByTestId('filter-all')).not.toBeInTheDocument();
    expect(screen.queryByTestId('filter-lesson')).not.toBeInTheDocument();
    
    // ソート選択も表示されていないことを確認
    expect(screen.queryByTestId('sort-select')).not.toBeInTheDocument();
    
    // アクティビティは全て表示されていることを確認
    expect(screen.getByText('レッスン1')).toBeInTheDocument();
    expect(screen.getByText('練習問題1')).toBeInTheDocument();
    expect(screen.getByText('教材1')).toBeInTheDocument();
    expect(screen.getByText('クイズ1')).toBeInTheDocument();
  });

  it('空のアクティビティリストの場合、空メッセージが表示されること', () => {
    const customEmptyMessage = 'カスタム空メッセージ';
    render(<LearningLogList activities={[]} emptyMessage={customEmptyMessage} />);
    
    // 空メッセージが表示されていることを確認
    expect(screen.getByTestId('empty-message')).toHaveTextContent(customEmptyMessage);
    
    // アクティビティアイテムがないことを確認
    expect(screen.queryByTestId('learning-log-item')).not.toBeInTheDocument();
  });

  it('アクティビティをクリックすると、onActivityClickが呼ばれること', () => {
    const handleActivityClick = vi.fn();
    render(<LearningLogList activities={mockActivities} onActivityClick={handleActivityClick} />);
    
    // アクティビティアイテムの最初のものをクリック
    const items = screen.getAllByTestId('learning-log-item');
    fireEvent.click(items[0]);
    
    // onActivityClickが正しい引数で呼ばれたことを確認
    expect(handleActivityClick).toHaveBeenCalledTimes(1);
    expect(handleActivityClick).toHaveBeenCalledWith(expect.objectContaining({
      id: mockActivities[3].id, // 表示順が逆転しているので最後のアイテムが最初に表示される
    }));
  });
}); 