import cpzxrobotDefault from '@cpzxrobot/sdk';
const cpzxrobot =
  typeof cpzxrobotDefault === 'function'
    ? cpzxrobotDefault
    : (cpzxrobotDefault as { default?: unknown }).default;
if (typeof cpzxrobot !== 'function') {
  throw new Error('@cpzxrobot/sdk: 无法解析为可调用工厂函数，请检查依赖版本与打包配置');
}
const sdk = cpzxrobot({
  devAuth: 'QVp2wWrosOBJGEMxQCsmY5YEUPWvxv1k',
  appCode: 'MIjgAIHXgOd3bwqc',
  selectedFarm: {
    id: 17629813863749,
  },
});
export { sdk };