/**
 * 简单的构建脚本
 * 用于生成 npm 发布所需的文件
 */

const fs = require('fs')
const path = require('path')

// 读取 package.json 获取版本号
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
)
const version = packageJson.version

// 确保 dist 目录存在
const distDir = path.join(__dirname, 'dist')
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir)
}

// 读取源文件
const sourceFile = path.join(__dirname, '/src/index.js')
const sourceCode = fs.readFileSync(sourceFile, 'utf8')

// 生成 UMD 版本（压缩版）
const umdContent = `/**
 * VR Equirectangular Viewer
 * @version ${version}
 * @license MIT
 */
${sourceCode}

// UMD 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VREquirectangularViewer;
}
if (typeof window !== 'undefined') {
  window.VREquirectangularViewer = VREquirectangularViewer;
}
`

// 生成 ES Module 版本
const esmContent = `/**
 * VR Equirectangular Viewer
 * @version ${version}
 * @license MIT
 */
${sourceCode}

export default VREquirectangularViewer;
`

// 写入文件
fs.writeFileSync(
  path.join(distDir, 'vr-equirectangular-viewer.min.js'),
  umdContent
)
fs.writeFileSync(
  path.join(distDir, 'vr-equirectangular-viewer.esm.js'),
  esmContent
)

console.log('✅ 构建完成！')
console.log('生成的文件:')
console.log('  - dist/vr-equirectangular-viewer.min.js (UMD格式)')
console.log('  - dist/vr-equirectangular-viewer.esm.js (ES Module格式)')
