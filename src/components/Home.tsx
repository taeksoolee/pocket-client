import { config } from '../config';
import { FunctionsDropdown } from './FunctionsDropdown';
import { Layout } from './Layout';
import { RequestForm } from './RequestForm';
import { Sidebar } from './Sidebar';

export const Home = ({
  snapshots,
  templates,
  suggestions = [],
  functionsMap = {},
}: {
  snapshots: string[];
  templates: string[];
  suggestions?: string[];
  functionsMap?: Record<string, string>;
}) => {
  const initialHeaders = Object.entries(config.globalHeaders).map(([key, value]) => ({
    key,
    value,
    active: true,
  }));

  if (initialHeaders.length === 0) {
    initialHeaders.push({ key: '', value: '', active: true });
  }

  const uniqueSuggestions = [...new Set([...(config.commonEndpoints || []), ...suggestions])];

  return (
    <Layout>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__POCKET_CODES = ${JSON.stringify(functionsMap)};`,
        }}
      />

      <Sidebar snapshots={snapshots} templates={templates} />

      <main class="flex-1 h-screen overflow-y-auto p-8 bg-slate-50 text-slate-800">
        <div class="max-w-4xl mx-auto">
          <header class="mb-8 flex justify-between items-end relative">
            <div>
              <h1 class="text-3xl font-bold text-indigo-600">Pocket Client 🚀</h1>
              <p class="text-slate-500 font-medium">Embedded Local-first Http Client Tool</p>
            </div>

            <FunctionsDropdown />
          </header>

          <RequestForm initialHeaders={initialHeaders} uniqueSuggestions={uniqueSuggestions} />
          
          <div id="snapshort"></div>
        </div>
      </main>
    </Layout>
  );
};
