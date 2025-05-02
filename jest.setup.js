import { expect, vi } from 'vitest';

// グローバルオブジェクトを設定
global.expect = expect;
global.vi = vi;

// その後でjest-domをインポート
import '@testing-library/jest-dom'; 