/**
 * 构建脚本
 * 用于生成 npm 发布所需的文件（包含代码压缩）
 */

const fs = require('fs')
const path = require('path')
const { minify } = require('terser')

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

// 版权信息注释（压缩后保留）
const banner = `/**
 * VR Equirectangular Viewer
 * @version ${version}
 * @license MIT
 */`

// 生成 UMD 版本
const umdContent = `${sourceCode}

// UMD 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VREquirectangularViewer;
}
if (typeof window !== 'undefined') {
  window.VREquirectangularViewer = VREquirectangularViewer;
}
`

// 生成 ES Module 版本
const esmContent = `${sourceCode}

export default VREquirectangularViewer;
`

// 压缩配置
const terserOptions = {
  format: {
    comments: false, // 移除所有注释
    preamble: banner // 但保留版权信息
  },
  compress: {
    drop_console: false, // 保留 console（可根据需要修改）
    passes: 2
  },
  mangle: true
}

// 异步压缩并写入文件
async function build() {
  try {
    console.log('🔨 开始压缩 UMD 版本...')
    const umdMinified = await minify(umdContent, terserOptions)
    if (umdMinified.error) throw umdMinified.error

    fs.writeFileSync(
      path.join(distDir, 'vr-equirectangular-viewer.min.js'),
      umdMinified.code
    )
    console.log('✅ UMD 版本压缩完成')

    console.log('🔨 开始压缩 ESM 版本...')
    const esmMinified = await minify(esmContent, terserOptions)
    if (esmMinified.error) throw esmMinified.error

    fs.writeFileSync(
      path.join(distDir, 'vr-equirectangular-viewer.esm.js'),
      esmMinified.code
    )
    console.log('✅ ESM 版本压缩完成')

    console.log('\n✅ 构建完成！')
    console.log('生成的文件:')
    console.log('  - dist/vr-equirectangular-viewer.min.js (UMD格式，已压缩)')
    console.log(
      '  - dist/vr-equirectangular-viewer.esm.js (ES Module格式，已压缩)'
    )

    // 显示文件大小
    const umdSize = fs.statSync(
      path.join(distDir, 'vr-equirectangular-viewer.min.js')
    ).size
    const esmSize = fs.statSync(
      path.join(distDir, 'vr-equirectangular-viewer.esm.js')
    ).size
    console.log(`\n文件大小:`)
    console.log(`  - UMD: ${(umdSize / 1024).toFixed(2)} KB`)
    console.log(`  - ESM: ${(esmSize / 1024).toFixed(2)} KB`)
  } catch (error) {
    console.error('❌ 构建失败:', error)
    process.exit(1)
  }
}

build()
