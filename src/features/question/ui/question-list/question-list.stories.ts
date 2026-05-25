import './index';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { vi } from 'vitest';

import type { Question } from '@/core/entities';
import { setCatalogService } from '@/shared/services/catalog-service';

const seedQuestions: Question[] = [
  {
    id: 'sales-by-region',
    slug: 'sales-by-region',
    title: 'Sales by Region',
    type: 'chart',
    chartType: 'bar',
    queryType: 'sql',
    query: 'SELECT 1',
    source: 'yaml',
    createdAt: '',
    updatedAt: '',
  },
];

function installStoryCatalog(extra: Question[] = []): void {
  let questions = [...seedQuestions, ...extra];
  setCatalogService({
    listQuestions: { execute: async () => questions },
    getQuestion: {
      execute: async (id: string) => questions.find((item) => item.id === id) ?? null,
    },
    createQuestion: {
      execute: async (input: unknown) => ({
        id: 'created-question',
        slug: 'created-question',
        ...(input as Record<string, unknown>),
        source: 'user',
        createdAt: '',
        updatedAt: '',
      }),
    },
    updateQuestion: { execute: async (_id: string, input: unknown) => input },
    deleteQuestion: {
      execute: async (id: string) => {
        questions = questions.filter((item) => item.id !== id);
      },
    },
    listDatasources: { execute: async () => [] },
    getDatasource: { execute: async () => null },
    listDashboards: { execute: async () => [] },
    getDashboard: { execute: async () => null },
  });
}

type QuestionListArgs = {
  onQuestionSelect: (slug: string) => void;
  onQuestionCreate: (name: string) => void;
  onQuestionDelete: (slug: string) => void;
};

const meta = {
  title: 'Organisms/Question List',
  component: 'question-list',
  tags: ['autodocs'],
  decorators: [
    (story) => {
      installStoryCatalog();
      return story() as Node;
    },
  ],
  render: ({ onQuestionSelect, onQuestionCreate, onQuestionDelete }: QuestionListArgs) =>
    html`<question-list
      @question-select=${(e: CustomEvent<{ slug: string }>) => onQuestionSelect(e.detail.slug)}
      @question-create=${(e: CustomEvent<{ name: string }>) => onQuestionCreate(e.detail.name)}
      @question-delete=${(e: CustomEvent<{ slug: string }>) => onQuestionDelete(e.detail.slug)}
    ></question-list>`,
  argTypes: {
    onQuestionSelect: {
      action: 'question-select',
      description:
        'Fired when a question row is clicked or a view/edit button is pressed. `detail.slug` identifies the question.',
      table: { category: 'Events' },
    },
    onQuestionCreate: {
      action: 'question-create',
      description:
        'Fired after the user confirms the create-question dialog. `detail.name` is the new question name.',
      table: { category: 'Events' },
    },
    onQuestionDelete: {
      action: 'question-delete',
      description:
        'Fired after a user-created question is deleted. `detail.slug` identifies the question.',
      table: { category: 'Events' },
    },
  },
  args: {
    onQuestionSelect: fn(),
    onQuestionCreate: fn(),
    onQuestionDelete: fn(),
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Landing page listing all available questions as a CRUD table. ' +
          'Reads through use-case-backed catalog data (YAML seeds + persisted user records). ' +
          'Each row has View, Edit, and Delete (user-created only) icon buttons.',
      },
    },
  },
} satisfies Meta<QuestionListArgs>;

export default meta;
type Story = StoryObj<QuestionListArgs>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'List view showing the question table.' } },
  },
};

export const OpenCreateModal: Story = {
  name: 'Interaction — Open Create Modal',
  tags: ['!autodocs'],
  play: async ({ canvas }) => {
    const newBtn = canvas.getByRole('button', { name: /new question/i });
    await userEvent.click(newBtn);
    await expect(canvas.findByRole('dialog')).toBeTruthy();
  },
};

export const CreateQuestion: Story = {
  name: 'Interaction — Create Question',
  tags: ['!autodocs'],
  play: async ({ canvas, args }) => {
    const newBtn = canvas.getByRole('button', { name: /new question/i });
    await userEvent.click(newBtn);
    const nameInput = await canvas.findByRole('textbox', { name: /name/i });
    await userEvent.type(nameInput, 'Monthly Revenue');
    const createBtn = canvas.getByRole('button', { name: /^create$/i });
    await userEvent.click(createBtn);
    await expect(args.onQuestionCreate).toHaveBeenCalledWith('Monthly Revenue');
  },
};

export const BlankNameValidation: Story = {
  name: 'Interaction — Blank Name Validation',
  tags: ['!autodocs'],
  play: async ({ canvas, args }) => {
    const newBtn = canvas.getByRole('button', { name: /new question/i });
    await userEvent.click(newBtn);

    const nameInput = await canvas.findByRole('textbox', { name: /name/i });
    const createBtn = canvas.getByRole('button', { name: /^create$/i });
    await userEvent.click(createBtn);

    const errorAlert = await canvas.findByRole('alert');
    await expect(args.onQuestionCreate).not.toHaveBeenCalled();
    await expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    await expect(errorAlert).toHaveTextContent('Please enter a question name.');
  },
};

export const CancelCreateModalRestoresFocus: Story = {
  name: 'Interaction — Cancel Restores Focus',
  tags: ['!autodocs'],
  play: async ({ canvas }) => {
    const newBtn = canvas.getByRole('button', { name: /new question/i });
    await userEvent.click(newBtn);

    const cancelBtn = await canvas.findByRole('button', { name: /cancel/i });
    await userEvent.click(cancelBtn);

    await waitFor(() => {
      expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
      expect(newBtn).toHaveFocus();
    });
  },
};

export const ViewItem: Story = {
  name: 'Interaction — View Button Fires Select Event',
  tags: ['!autodocs'],
  play: async ({ canvas, args }) => {
    const viewBtn = canvas.getAllByTitle('View')[0];
    await userEvent.click(viewBtn);
    await expect(args.onQuestionSelect).toHaveBeenCalledOnce();
  },
};

export const EditItem: Story = {
  name: 'Interaction — Edit Button Fires Select Event',
  tags: ['!autodocs'],
  play: async ({ canvas, args }) => {
    const editBtn = canvas.getAllByTitle('Edit')[0];
    await userEvent.click(editBtn);
    await expect(args.onQuestionSelect).toHaveBeenCalledOnce();
  },
};

export const DeleteReadOnlyHidden: Story = {
  name: 'YAML-seeded questions have no delete button',
  tags: ['!autodocs'],
  play: async ({ canvas }) => {
    // YAML questions show "· read-only" in the metadata column.
    // Assert they have no delete button by finding their row titles
    // and checking the overall page has no delete buttons (only YAML questions present in seed).
    const metaCells = canvas.queryAllByText(/read-only/);
    await expect(metaCells.length).toBeGreaterThan(0);
    // Each read-only row should not have an adjacent delete button.
    for (const cell of metaCells) {
      const row = cell.closest('.collection-list-row');
      expect(row?.querySelector('[title="Delete"]')).toBeNull();
    }
  },
};

export const DeleteItem: Story = {
  name: 'Interaction — Delete User Question',
  tags: ['!autodocs'],
  decorators: [
    (story) => {
      installStoryCatalog([
        {
          id: 'story-temp-question',
          slug: 'story-temp-question',
          title: 'Story Temp Question',
          type: 'table',
          queryType: 'sql',
          query: 'SELECT 1',
          source: 'user',
          createdAt: '',
          updatedAt: '',
        },
      ]);
      return story() as Node;
    },
  ],
  play: async ({ canvas, args }) => {
    // The component needs to pick up the newly added question.
    // Find the delete button for our test question.
    const row = await canvas.findByText('Story Temp Question');
    const deleteBtn = row.closest('.collection-list-row')?.querySelector('[title="Delete"]');
    await expect(deleteBtn).not.toBeNull();

    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    await userEvent.click(deleteBtn as HTMLElement);

    await expect(args.onQuestionDelete).toHaveBeenCalledWith('story-temp-question');
    await waitFor(() => {
      expect(canvas.queryByText('Story Temp Question')).not.toBeInTheDocument();
    });
  },
};
