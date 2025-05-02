import type { Meta, StoryObj } from '@storybook/react';
import { LearningLogList } from './LearningLogList';
import { LearningActivity } from './LearningLogItem';
import { action } from '@storybook/addon-actions';

const meta: Meta<typeof LearningLogList> = {
  title: 'Components/LearningLog/LearningLogList',
  component: LearningLogList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onActivityClick: { action: 'activity clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof LearningLogList>;

// サンプルデータ
const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(now);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const lastWeek = new Date(now);
lastWeek.setDate(lastWeek.getDate() - 7);

const sampleActivities: LearningActivity[] = [
  {
    id: '1',
    type: 'lesson',
    title: '音楽理論の基礎',
    description: '音楽理論の基礎について学びます。音符、休符、拍子記号などの基本的な要素を理解しましょう。',
    timestamp: now,
    duration: 45,
    progress: 75,
    completed: false,
  },
  {
    id: '2',
    type: 'exercise',
    title: 'スケール練習: メジャースケール',
    description: 'メジャースケールを全ての調で練習します。',
    timestamp: yesterday,
    progress: 40,
    duration: 30,
    completed: false,
  },
  {
    id: '3',
    type: 'material',
    title: '和声学の教科書',
    description: 'クラシック音楽の和声理論について解説した教材です。',
    timestamp: twoDaysAgo,
    progress: 25,
    duration: 60,
    completed: false,
  },
  {
    id: '4',
    type: 'quiz',
    title: '音楽理論の理解度チェック',
    description: '音楽理論の基本概念についての理解度を確認するクイズです。',
    timestamp: lastWeek,
    duration: 15,
    completed: true,
  },
  {
    id: '5',
    type: 'lesson',
    title: 'コード進行の基本',
    description: '一般的なコード進行パターンとその使い方について学びます。',
    timestamp: lastWeek,
    duration: 60,
    progress: 100,
    completed: true,
  },
];

// 基本的なリスト表示
export const Default: Story = {
  args: {
    activities: sampleActivities,
    onActivityClick: action('activity clicked'),
  },
};

// フィルターなしのリスト
export const WithoutFilters: Story = {
  args: {
    activities: sampleActivities,
    onActivityClick: action('activity clicked'),
    showFilters: false,
  },
};

// 特定タイプのみ（レッスン）
export const LessonsOnly: Story = {
  args: {
    activities: sampleActivities.filter(a => a.type === 'lesson'),
    onActivityClick: action('activity clicked'),
  },
};

// 完了済みのみ
export const CompletedOnly: Story = {
  args: {
    activities: sampleActivities.filter(a => a.completed),
    onActivityClick: action('activity clicked'),
  },
};

// 空のリスト
export const Empty: Story = {
  args: {
    activities: [],
    onActivityClick: action('activity clicked'),
    emptyMessage: '学習記録が見つかりませんでした。新しいコースを始めましょう！',
  },
}; 