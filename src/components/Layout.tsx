import { ALPINE_LIB, HTMX_LIB } from '../config';

export const Layout = ({ children }: { children: any }) => (
  <html lang="ko">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>PocketAPI Workspace</title>
      <script dangerouslySetInnerHTML={{ __html: HTMX_LIB }}></script>
      <script defer dangerouslySetInnerHTML={{ __html: ALPINE_LIB }}></script>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-50 text-slate-900 font-sans p-8">
      <div class="max-w-4xl mx-auto">
        <header class="mb-8">
          <h1 class="text-3xl font-bold text-indigo-600">PocketAPI 🚀</h1>
          <p class="text-slate-500">Embedded Local-first API Tool</p>
        </header>
        {children}
      </div>
    </body>
  </html>
);
