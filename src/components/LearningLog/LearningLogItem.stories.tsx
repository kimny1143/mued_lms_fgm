import type { Meta, StoryObj } from '@storybook/react';
import { LearningLogItem, LearningActivity } from './LearningLogItem';
import { action } from '@storybook/addon-actions';

const meta: Meta<typeof LearningLogItem> = {
  title: 'Components/LearningLog/LearningLogItem',
  component: LearningLogItem,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof LearningLogItem>;

// サンプルデータ
const baseActivity: LearningActivity = {
  id: '1',
  type: 'lesson',
  title: '音楽理論の基礎',
  description: '音楽理論の基礎について学びます。音符、休符、拍子記号などの基本的な要素を理解しましょう。',
  timestamp: new Date(),
  duration: 45,
  progress: 75,
  completed: false,
};

// 基本的なレッスン
export const Lesson: Story = {
  args: {
    activity: baseActivity,
    onClick: action('lesson clicked'),
  },
};

// 完了済みのレッスン
export const CompletedLesson: Story = {
  args: {
    activity: {
      ...baseActivity,
      completed: true,
      progress: 100,
    },
    onClick: action('completed lesson clicked'),
  },
};

// 練習問題
export const Exercise: Story = {
  args: {
    activity: {
      ...baseActivity,
      id: '2',
      type: 'exercise',
      title: 'スケール練習: メジャースケール',
      description: 'メジャースケールを全ての調で練習します。',
      progress: 40,
      duration: 30,
    },
    onClick: action('exercise clicked'),
  },
};

// 教材
export const Material: Story = {
  args: {
    activity: {
      ...baseActivity,
      id: '3',
      type: 'material',
      title: '和声学の教科書',
      description: 'クラシック音楽の和声理論について解説した教材です。',
      progress: 25,
      duration: 60,
    },
    onClick: action('material clicked'),
  },
};

// クイズ
export const Quiz: Story = {
  args: {
    activity: {
      ...baseActivity,
      id: '4',
      type: 'quiz',
      title: '音楽理論の理解度チェック',
      description: '音楽理論の基本概念についての理解度を確認するクイズです。',
      duration: 15,
      completed: true,
    },
    onClick: action('quiz clicked'),
  },
};

// 説明なし
export const WithoutDescription: Story = {
  args: {
    activity: {
      ...baseActivity,
      id: '5',
      description: undefined,
    },
    onClick: action('lesson without description clicked'),
  },
};

// 進捗なし
export const WithoutProgress: Story = {
  args: {
    activity: {
      ...baseActivity,
      id: '6',
      progress: undefined,
    },
    onClick: action('lesson without progress clicked'),
  },
}; 