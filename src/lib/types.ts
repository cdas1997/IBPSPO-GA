export const TopicGroup = { Focus: 'focus', Month: 'month', Topic: 'topic' } as const;
export type TopicGroup = (typeof TopicGroup)[keyof typeof TopicGroup];

export type Question = {
  id: string;
  /** 1-based position inside its topic */
  n: number;
  topic: string;
  text: string;
  options: readonly string[];
  /** index of the correct option */
  answer: number;
  explanation: string;
  /** 0 = unscored, otherwise 1-5 chance of appearing in the exam */
  likely: number;
  /** position across the whole bank */
  order: number;
};

export type Topic = {
  key: string;
  name: string;
  group: TopicGroup;
  questions: readonly Question[];
};

export type Bank = {
  checked: string;
  examDate: string;
  topics: readonly Topic[];
  all: readonly Question[];
  byId: ReadonlyMap<string, Question>;
  topicByKey: ReadonlyMap<string, Topic>;
  top: readonly Question[];
};

export type AnswerRecord = readonly [choice: number, answeredAt: number];
export type Answers = Readonly<Record<string, AnswerRecord>>;

export const MockType = { Full: 'full', Quick: 'quick', Weak: 'weak' } as const;
export type MockType = (typeof MockType)[keyof typeof MockType];

export type MockRecord = {
  id: string;
  type: MockType;
  startedAt: number;
  questionIds: readonly string[];
  responses: Readonly<Record<string, number>>;
  seconds: Readonly<Record<string, number>>;
  right: number;
  wrong: number;
  skipped: number;
  net: number;
  maxMarks: number;
  usedMs: number;
  limitSecs: number;
};

export type LiveMock = {
  id: string;
  type: MockType;
  questionIds: readonly string[];
  responses: Readonly<Record<string, number>>;
  marked: Readonly<Record<string, true>>;
  visited: readonly number[];
  seconds: Readonly<Record<string, number>>;
  index: number;
  startedAt: number;
  endsAt: number;
  limitSecs: number;
  questionShownAt: number;
};

export const StudyMode = { Practice: 'practice', Revision: 'revision' } as const;
export type StudyMode = (typeof StudyMode)[keyof typeof StudyMode];

export type Profile = {
  answers: Answers;
  mocks: readonly MockRecord[];
  live: LiveMock | null;
  mode: StudyMode;
};

export const SetFilter = { All: 'all', Todo: 'todo', Wrong: 'wrong', Right: 'right', Hot: 'hot' } as const;
export type SetFilter = (typeof SetFilter)[keyof typeof SetFilter];
