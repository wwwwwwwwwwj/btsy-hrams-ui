import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import vueDevTools from 'vite-plugin-vue-devtools';
import Compression from 'vite-plugin-compression';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import { EleAdminResolver } from 'ele-admin-plus/es/utils/resolvers';
import { ComponentsResolver } from './src/components/resolvers';

export default defineConfig(({ command, mode }) => {
  const isBuild = command === 'build';
  const env = loadEnv(mode, process.cwd());
  // 别名配置
  const alias = {
    '@/': resolve('src') + '/'
  };
  // 插件配置
  const plugins = [vue(), vueJsx()];
  const componentsResolvers = [ComponentsResolver()];
  if (env.VITE_AS_NEEDED === 'true') {
    // 组件按需引入插件
    componentsResolvers.push(
      ElementPlusResolver({
        importStyle: 'sass'
      })
    );
    componentsResolvers.push(
      EleAdminResolver({
        importStyle: 'sass'
      })
    );
  } else {
    // 全局安装
    alias['./as-needed'] = './global-import';
  }
  plugins.push(
    Components({
      dts: false,
      globsExclude: ['src/components/*/components/**'],
      resolvers: componentsResolvers
    })
  );
  if (env.VITE_DEV_TOOLS === 'true') {
    // vue 调试插件
    plugins.push(vueDevTools());
  }
  if (isBuild) {
    // gzip 压缩插件
    plugins.push(
      Compression({
        disable: !isBuild,
        threshold: 10240,
        algorithm: 'gzip',
        ext: '.gz'
      })
    );
  }
  // 接口地址代理配置
  const baseApi = env.VITE_API_URL;
  const proxyApi = env.VITE_API_PROXY_URL;
  const proxy = {};
  if (proxyApi) {
    const isRemoveBasePath = !proxyApi.endsWith(baseApi); // 接口代理时是否移除地址前缀
    proxy[baseApi] = {
      target: isRemoveBasePath
        ? proxyApi
        : proxyApi.substring(0, proxyApi.length - baseApi.length),
      rewrite: isRemoveBasePath
        ? (path) => path.replace(new RegExp(`^${baseApi}`), '')
        : void 0,
      ws: true,
      changeOrigin: true,
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq) => {
          proxyReq.setHeader('Referer', proxyApi);
        });
      }
    };
  }
  return {
    resolve: { alias },
    plugins,
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/variables.scss" as *;`
        }
      }
    },
    optimizeDeps: {
      include: [
        'echarts/core',
        'echarts/charts',
        'echarts/renderers',
        'echarts/components',
        'vue-echarts',
        'echarts-wordcloud',
        'sortablejs',
        'vuedraggable'
      ]
    },
    build: {
      target: 'chrome63',
      reportCompressedSize: false,
      chunkSizeWarningLimit: 4000,
      assetsInlineLimit: 0,
      sourcemap: false
    },
    server: { proxy }
  };
});
