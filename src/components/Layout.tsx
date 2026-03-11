import { ALPINE_LIB, HTMX_LIB, TAILWIND_CSS } from '../config';

export const Layout = ({ children }: { children: any }) => (
  <html lang="ko">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>PocketClient Workspace</title>
      <script dangerouslySetInnerHTML={{ __html: HTMX_LIB }}></script>
      <script defer dangerouslySetInnerHTML={{ __html: ALPINE_LIB }}></script>
      {/* 💡 CDN 대신 빌드된 CSS를 직접 주입! 오프라인 완벽 대응 */}
      <style dangerouslySetInnerHTML={{ __html: TAILWIND_CSS }}></style>
    </head>
    <body class="bg-slate-50 text-slate-900 font-sans h-screen flex overflow-hidden">
      {children}
    </body>
  </html>
);
