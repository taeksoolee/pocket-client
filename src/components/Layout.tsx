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
    {/* 💡 Flex 레이아웃으로 변경 (화면 꽉 채우고 스크롤 제어) */}
    <body class="bg-slate-50 text-slate-900 font-sans h-screen flex overflow-hidden">
      {children}
    </body>
  </html>
);
