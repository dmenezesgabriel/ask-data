import './datasource-list';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import type { Datasource } from '@/core/entities';
import { setCatalogService } from '@/shared/services/catalog-service';

const seedDatasources: Datasource[] = [
  {
    id: 'sales',
    slug: 'sales',
    name: 'sales',
    type: 'csv',
    url: '/sales.csv',
    source: 'yaml',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'customer',
    slug: 'customer',
    name: 'customer',
    type: 'csv',
    url: '/customer.csv',
    source: 'yaml',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'product',
    slug: 'product',
    name: 'product',
    type: 'csv',
    url: '/product.csv',
    source: 'yaml',
    createdAt: '',
    updatedAt: '',
  },
];

function installStoryCatalog(extra: Datasource[] = []): void {
  let items = [...seedDatasources, ...extra];
  setCatalogService({
    listDatasources: { execute: async () => items },
    getDatasource: { execute: async (id: string) => items.find((item) => item.id === id) ?? null },
    deleteDatasource: {
      execute: async (id: string) => {
        items = items.filter((item) => item.id !== id);
      },
    },
    listQuestions: { execute: async () => [] },
    getQuestion: { execute: async () => null },
    listDashboards: { execute: async () => [] },
    getDashboard: { execute: async () => null },
  });
}

const meta = {
  title: 'Features/DatasourceList',
  component: 'datasource-list',
  tags: ['autodocs'],
  decorators: [
    (story) => {
      installStoryCatalog();
      return story() as Node;
    },
  ],
  render: () => html`
    <div style="max-width: 900px; padding: 1rem;">
      <datasource-list></datasource-list>
    </div>
  `,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Collection page listing all registered datasources. Seed (YAML) entries are read-only; user-created entries support edit and delete.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  name: 'Default (seed entries)',
};

export const WithUserEntry: Story = {
  name: 'Mixed — seed + user entry',
  decorators: [
    (story) => {
      installStoryCatalog([
        {
          id: 'my-sales',
          slug: 'my-sales',
          name: 'my-sales',
          type: 'csv',
          url: 'https://example.com/my-sales.csv',
          description: 'Custom sales file',
          source: 'user',
          createdAt: '',
          updatedAt: '',
        },
      ]);
      return story() as Node;
    },
  ],
};
