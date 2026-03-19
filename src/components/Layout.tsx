import type { Child } from 'hono/jsx';

import { ALPINE_LIB, HTMX_LIB, TAILWIND_CSS } from '../config';
import { Toast } from './Toast';

export const Layout = ({ children }: { children: Child }) => (
  <html lang="ko">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>PocketClient Workspace</title>
      <script dangerouslySetInnerHTML={{ __html: HTMX_LIB }}></script>
      <script>{`window.showToast = function(msg, type) { window.dispatchEvent(new CustomEvent('show-toast', { detail: { id: Date.now(), message: msg, type: type || 'error' } })); };`}</script>
      <script defer dangerouslySetInnerHTML={{ __html: ALPINE_LIB }}></script>
      <style dangerouslySetInnerHTML={{ __html: TAILWIND_CSS }}></style>
      <style>{`
        /* 전역 리사이징 커서 강제 */
        .resizing * { cursor: col-resize !important; }
        .select-none { user-select: none !important; }
        
        /* 스크롤바 커스텀 */
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #6366f1; }
        
        /* 애니메이션 */
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #475569 transparent; }
      `}</style>
    </head>
    <body
      class="bg-slate-50 text-slate-900 font-sans h-screen flex overflow-hidden"
      /* 💡 드래그 중에는 body 전체에 select-none을 걸 수 있도록 클래스 바인딩 (선택사항) */
    >
      {children}
      <Toast />
    </body>
  </html>
);
