import './datasource-editor';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import type { Datasource } from '@/core/entities';
import { setCatalogService } from '@/shared/services/catalog-service';
import { setDbService } from '@/shared/services/db-service';

setDbService({ query: async () => ({}), initialize: async () => {}, createViews: async () => {} });

const storyDatasources: Datasource[] = [
  {
    id: 'superstore-sales',
    slug: 'superstore-sales',
    name: 'sales',
    type: 'csv',
    url: 'https://example.com/sales.csv',
    source: 'yaml',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'superstore-customers',
    slug: 'superstore-customers',
    name: 'customer',
    type: 'csv',
    url: 'https://example.com/customers.csv',
    source: 'yaml',
    createdAt: '',
    updatedAt: '',
  },
];

function installStoryCatalog(): void {
  setCatalogService({
    listDatasources: { execute: async () => storyDatasources },
    getDatasource: {
      execute: async (id: string) => storyDatasources.find((item) => item.id === id) ?? null,
    },
    listQuestions: { execute: async () => [] },
    getQuestion: { execute: async () => null },
    listDashboards: { execute: async () => [] },
    getDashboard: { execute: async () => null },
  });
}

const meta = {
  title: 'Features/DatasourceEditor',
  component: 'datasource-editor',
  tags: ['autodocs'],
  decorators: [
    (story) => {
      installStoryCatalog();
      return story() as Node;
    },
  ],
  render: (args: { slug: string; isNew?: boolean }) => html`
    <div style="min-height: 600px;">
      <datasource-editor .slug=${args.slug} .isNew=${args.isNew ?? false}></datasource-editor>
    </div>
  `,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full editor page for a datasource. Loads through the catalog use-case service by slug. Shows breadcrumb, header with save/delete/export actions, and the editor panel.',
      },
    },
  },
} satisfies Meta<{ slug: string; isNew?: boolean }>;

export default meta;
type Story = StoryObj<{ slug: string; isNew?: boolean }>;

export const ExistingDatasource: Story = {
  args: {
    slug: 'superstore-sales',
    isNew: false,
  },
};

export const ReadOnlyYaml: Story = {
  name: 'Read-only (YAML-sourced)',
  args: {
    slug: 'superstore-customers',
    isNew: false,
  },
};

export const NewDatasource: Story = {
  args: {
    slug: 'new',
    isNew: true,
  },
};

export const NotFound: Story = {
  args: {
    slug: 'does-not-exist',
    isNew: false,
  },
};
