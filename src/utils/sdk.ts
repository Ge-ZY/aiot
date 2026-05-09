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
    id: 1830745839849473,
    name: '技术部一组',
  },
  selectedUnit: {
    id: 17962201991237,
    name: "1单元",
  },
});
export { sdk };