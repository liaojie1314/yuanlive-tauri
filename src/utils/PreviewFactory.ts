// 公用的头部注入
const COMMON_HEAD = `
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script>
    (function() {
      const _warn = console.warn;
      console.warn = function(...args) {
        // 屏蔽 Tailwind 和 Babel 的无关警告
        if (args[0] && typeof args[0] === 'string' && (args[0].includes('cdn.tailwindcss.com') || args[0].includes('babeljs.io'))) return;
        _warn.apply(console, args);
      };
    })();
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    #loading { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #64748b; font-size: 14px; pointer-events: none; display: flex; align-items: center; gap: 8px; }
    [v-cloak] { display: none; }
    #error-box { display: none; margin: 16px; padding: 16px; border-radius: 8px; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; font-family: monospace; white-space: pre-wrap; font-size: 13px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  </style>
`;

// --- 1. Vue 处理逻辑 ---
const wrapVueCode = (code: string) => {
  const serializedCode = JSON.stringify(code).replace(/<\/script/g, "<\\/script");

  return `
<!DOCTYPE html>
<html>
<head>
  ${COMMON_HEAD}
</head>
<body>
  <div id="error-box"></div>
  <div id="app" v-cloak></div>
  <div id="loading">
    <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    <span>Loading Vue...</span>
  </div>

  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/vue3-sfc-loader/dist/vue3-sfc-loader.js"></script>

  <script>
    const { loadModule } = window['vue3-sfc-loader'];
    
    function showError(msg) {
        const loading = document.getElementById('loading');
        if(loading) loading.style.display = 'none';
        const el = document.getElementById('error-box');
        el.style.display = 'block';
        el.textContent = 'Vue Error: ' + msg;
        console.error(msg);
    }

    const options = {
      moduleCache: { vue: Vue },
      async getFile(url) {
        if (url === '/App.vue') return ${serializedCode};
        return Promise.reject('Unknown file');
      },
      addStyle(textContent) {
        const style = document.createElement('style');
        style.textContent = textContent;
        document.head.appendChild(style);
      },
    }

    try {
        const App = Vue.defineAsyncComponent(() => loadModule('/App.vue', options));
        const app = Vue.createApp(App);
        
        app.config.errorHandler = (err) => showError(err.message);
        window.addEventListener('error', (e) => showError(e.message));

        app.mount('#app');
        
        setTimeout(() => {
            const loading = document.getElementById('loading');
            if (loading) loading.style.display = 'none';
        }, 100);
    } catch(e) {
        showError(e.message);
    }
  </script>
</body>
</html>`;
};

// --- 2. React 处理逻辑 ---
const wrapReactCode = (code: string) => {
  let cleanCode = code.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, "").replace(/<\/script/g, "<\\/script");

  if (cleanCode.includes("export default")) {
    cleanCode = cleanCode.replace("export default", "window.App =");
  } else {
    cleanCode += "; window.App = App;";
  }

  return `
<!DOCTYPE html>
<html>
<head>
  ${COMMON_HEAD}
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>
  <div id="error-box"></div>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo, useCallback, createElement } = React;
    const { createRoot } = ReactDOM;
    
    // JS 内置对象的保留字黑名单
    const RESERVED_NAMES = new Set([
      'Infinity', 'NaN', 'Undefined', 
      'Map', 'Set', 'Symbol', 'Promise', 
      'Object', 'Function', 'Array', 'String', 'Number', 'Boolean', 'Date', 'Math', 'JSON', 'Error'
    ]);

    function createLucideIcon(iconName, iconData) {
      const IconComponent = React.forwardRef((props, ref) => {
        // 核心修复：解构时同时提取 className 和 class (作为别名 classProp)
        // 这样如果用户传了 class="...", 它会被提取出来，不会流入 ...rest
        const { color = "currentColor", size = 24, strokeWidth = 2, className, class: classProp, ...rest } = props || {};
        
        // 智能合并：将 className 和 classProp 合并
        const finalClassName = \`lucide lucide-\${iconName} \${className || ''} \${classProp || ''}\`.trim();
        
        return createElement('svg', {
          ref: ref,
          xmlns: "http://www.w3.org/2000/svg",
          width: size,
          height: size,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: color,
          strokeWidth: strokeWidth,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          className: finalClassName, // 传给 React 正确的 className
          ...rest, // 此时 rest 里已经没有 'class' 了，不会触发警告
          dangerouslySetInnerHTML: {
              __html: iconData.map(child => {
                  const [tag, attrs] = child;
                  const attrStr = Object.entries(attrs).map(([k, v]) => \`\${k}="\${v}"\`).join(' ');
                  return \`<\${tag} \${attrStr} />\`;
              }).join('')
          }
        });
      });
      IconComponent.displayName = \`Lucide(\${iconName})\`;
      return IconComponent;
    }

    try {
      if (window.lucide && window.lucide.icons) {
        Object.keys(window.lucide.icons).forEach(key => {
          const componentName = key.charAt(0).toUpperCase() + key.slice(1);
          
          if (RESERVED_NAMES.has(componentName)) {
             return;
          }

          window[componentName] = createLucideIcon(key, window.lucide.icons[key]);
        });
        console.log("✅ Lucide React adapter loaded.");
      }
    } catch (e) {
      console.error("Icon injection failed:", e);
    }

    window.addEventListener('error', (e) => {
        const el = document.getElementById('error-box');
        el.style.display = 'block';
        el.textContent = 'Runtime Error: ' + e.message;
    });

    try {
        ${cleanCode}
    } catch (err) {
        const el = document.getElementById('error-box');
        el.style.display = 'block';
        el.textContent = 'Syntax Error: ' + err.message;
        console.error(err);
    }

    const root = createRoot(document.getElementById('root'));
    if (typeof window.App !== 'undefined') {
      root.render(<window.App />);
    } else {
      root.render(
        <div className="flex h-screen items-center justify-center text-gray-400 flex-col">
          <h2 className="text-lg font-bold mb-2">Wait for code...</h2>
        </div>
      );
    }
  </script>
</body>
</html>`;
};

// --- 3. 主入口 ---
export const generatePreviewHtml = (code: string, type: "html" | "vue" | "react" = "html"): string => {
  const trimmed = code.trim();

  if (type === "vue") {
    return wrapVueCode(trimmed);
  } else if (type === "react") {
    return wrapReactCode(trimmed);
  } else {
    if (trimmed.startsWith("<!DOCTYPE html") || trimmed.startsWith("<html")) {
      return trimmed;
    }
    return `
      <!DOCTYPE html>
      <html>
      <head>
        ${COMMON_HEAD}
      </head>
      <body>${trimmed}</body>
      </html>
    `;
  }
};
