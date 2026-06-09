import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';
const excludes = ['icons', 'index.js', 'lite.js', 'resolvers.js'];
const componentNames = readdirSync(resolve('src/components')).filter(
  (name) => !excludes.includes(name)
);

/**
 * 公共组件按需引入方式
 */
export function ComponentsResolver() {
  return {
    type: 'component',
    resolve: (name) => {
      if (componentNames.includes(name)) {
        return {
          name,
          from: `@/components`
        };
      }
    }
  };
}
