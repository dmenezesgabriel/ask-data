import './index';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import type { Dashboard } from '@/core/entities';
import { setCatalogService } from '@/shared/services/catalog-service';

const seedDashboards: Dashboard[] = [
  {
    id: 'portable-bi',
    name: 'Portable BI',
    type: 'dashboard',
    widgets: [],
    layout: [],
    source: 'yaml',
  },
];

function installStoryCatalog(): void {
  setCatalogService({
    listDashboards: { execute: async () => seedDashboards },
    getDashboard: {
      execute: async (id: string) => seedDashboards.find((item) => item.id === id) ?? null,
    },
    createDashboard: {
      execute: async (input: unknown) => ({
        id: 'created-dashboard',
        name: (input as { name: string }).name,
        type: 'dashboard',
        widgets: [],
        layout: [],
        source: 'user',
      }),
    },
    updateDashboard: { execute: async (_id: string, input: unknown) => input },
    listDatasources: { execute: async () => [] },
    getDatasource: { execute: async () => null },
    listQuestions: { execute: async () => [] },
    getQuestion: { execute: async () => null },
  });
}

type DashboardListArgs = {
  onDashboardSelect: (slug: string) => void;
  onDashboardCreate: (name: string) => void;
  onDashboardDelete: (slug: string) => void;
};

const meta = {
  title: 'Organisms/Dashboard List',
  component: 'dashboard-list',
  tags: ['autodocs'],
  decorators: [
    (story) => {
      installStoryCatalog();
      return story() as Node;
    },
  ],
  render: ({ onDashboardSelect, onDashboardCreate, onDashboardDelete }: DashboardListArgs) =>
    html`<dashboard-list
      @dashboard-select=${(e: CustomEvent<{ slug: string }>) => onDashboardSelect(e.detail.slug)}
      @dashboard-create=${(e: CustomEvent<{ name: string }>) => onDashboardCreate(e.detail.name)}
      @dashboard-delete=${(e: CustomEvent<{ slug: string }>) => onDashboardDelete(e.detail.slug)}
    ></dashboard-list>`,
  argTypes: {
    onDashboardSelect: {
      action: 'dashboard-select',
      description:
        'Fired when a dashboard row is clicked or a view/edit button is pressed. `detail.slug` identifies the dashboard.',
      table: { category: 'Events' },
    },
    onDashboardCreate: {
      action: 'dashboard-create',
      description:
        'Fired after the user confirms the create-dashboard dialog. `detail.name` is the new name.',
      table: { category: 'Events' },
    },
    onDashboardDelete: {
      action: 'dashboard-delete',
      description: 'Fired after a user-created dashboard is deleted. `detail.slug` identifies it.',
      table: { category: 'Events' },
    },
  },
  args: {
    onDashboardSelect: fn(),
    onDashboardCreate: fn(),
    onDashboardDelete: fn(),
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Landing page listing all available dashboards as a CRUD table. ' +
          'Reads through use-case-backed catalog data (static YAML + persisted user records). ' +
          'Each row has View, Edit, and Delete (user-created only) icon buttons.',
      },
    },
  },
} satisfies Meta<DashboardListArgs>;

export default meta;
type Story = StoryObj<DashboardListArgs>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'List view showing the dashboard table.' } },
  },
};

export const OpenCreateModal: Story = {
  name: 'Interaction — Open Create Modal',
  tags: ['!autodocs'],
  play: async ({ canvas }) => {
    const newBtn = canvas.getByRole('button', { name: /new dashboard/i });
    await userEvent.click(newBtn);
    await expect(canvas.findByRole('dialog')).toBeTruthy();
  },
};

export const CreateDashboard: Story = {
  name: 'Interaction — Create Dashboard',
  tags: ['!autodocs'],
  play: async ({ canvas, args }) => {
    const newBtn = canvas.getByRole('button', { name: /new dashboard/i });
    await userEvent.click(newBtn);
    const nameInput = await canvas.findByRole('textbox', { name: /name/i });
    await userEvent.type(nameInput, 'Q4 Revenue');
    const createBtn = canvas.getByRole('button', { name: /^create$/i });
    await userEvent.click(createBtn);
    await expect(args.onDashboardCreate).toHaveBeenCalledWith('Q4 Revenue');
  },
};

export const BlankNameValidation: Story = {
  name: 'Interaction — Blank Name Validation',
  tags: ['!autodocs'],
  play: async ({ canvas, args }) => {
    const newBtn = canvas.getByRole('button', { name: /new dashboard/i });
    await userEvent.click(newBtn);

    const nameInput = await canvas.findByRole('textbox', { name: /name/i });
    const createBtn = canvas.getByRole('button', { name: /^create$/i });
    await userEvent.click(createBtn);

    const errorAlert = await canvas.findByRole('alert');
    await expect(args.onDashboardCreate).not.toHaveBeenCalled();
    await expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    await expect(errorAlert).toHaveTextContent('Please enter a dashboard name.');
  },
};

export const CancelCreateModalRestoresFocus: Story = {
  name: 'Interaction — Cancel Restores Focus',
  tags: ['!autodocs'],
  play: async ({ canvas }) => {
    const newBtn = canvas.getByRole('button', { name: /new dashboard/i });
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
    await expect(args.onDashboardSelect).toHaveBeenCalledOnce();
  },
};

export const EditItem: Story = {
  name: 'Interaction — Edit Button Fires Select Event',
  tags: ['!autodocs'],
  play: async ({ canvas, args }) => {
    const editBtn = canvas.getAllByTitle('Edit')[0];
    await userEvent.click(editBtn);
    await expect(args.onDashboardSelect).toHaveBeenCalledOnce();
  },
};

export const DeleteReadOnlyHidden: Story = {
  name: 'YAML-seeded dashboards have no delete button',
  tags: ['!autodocs'],
  play: async ({ canvas }) => {
    // All seeded dashboards are YAML-sourced; no delete buttons should appear
    const deleteButtons = canvas.queryAllByTitle('Delete');
    await expect(deleteButtons).toHaveLength(0);
  },
};
