# WebXR VR 全景查看器插件文档

## 目录

- [简介](#简介)
- [特性](#特性)
- [技术规格](#技术规格)
- [快速开始](#快速开始)
- [API 参考](#api-参考)
- [配置选项](#配置选项)
- [使用示例](#使用示例)
- [性能优化](#性能优化)
- [常见问题](#常见问题)
- [浏览器兼容性](#浏览器兼容性)
- [故障排除](#故障排除)

---

## 简介

`VREquirectangularViewer` 是一个轻量级、零依赖的 WebXR VR 全景查看器插件。它使用原生 WebXR API 和 WebGL 技术，提供沉浸式的 360° 全景图片体验。

### 核心优势

- **🚀 懒加载架构**：只在进入 VR 模式时才加载资源，内存占用为零直到实际使用
- **♻️ 自动资源管理**：退出 VR 时自动释放所有 GPU 和 CPU 内存
- **📱 移动设备优化**：自动处理超大图片，适配移动 VR 设备的 GPU 限制
- **🎯 零依赖**：纯原生 JavaScript，无需任何第三方库
- **🔌 插件化设计**：完全隔离，不影响现有项目代码

---

## 特性

### 1. 懒加载机制

- 构造函数只存储配置，不占用内存
- WebGL 上下文在首次调用 `enterVR()` 时创建
- 着色器、几何体、纹理按需加载
- 零初始化开销

### 2. 智能内存管理

- 退出 VR 自动销毁所有资源
- GPU 内存通过 `WEBGL_lose_context` 完全释放
- CPU 对象引用全部置空，便于垃圾回收
- 支持多次进入/退出循环，无内存泄漏

### 3. 超大图片支持

- 自动检测设备 GPU 最大纹理尺寸
- 超过限制时自动高质量缩放
- 默认安全上限 4096px（适配大多数移动 VR 设备）
- 支持 11904x5952 等超高分辨率全景图

### 4. VR 体验优化

- 双眼立体渲染
- 本地坐标系追踪（local-floor/local）
- 高性能渲染模式
- 自适应帧缓冲缩放（0.8x）

---

## 技术规格

### 渲染技术

- **WebGL**: 2.0 / 1.0（自动降级）
- **着色器精度**: `highp float`（移动设备兼容）
- **几何体**: 60x60 细分球体（7,260 顶点，7,200 三角形）
- **纹理映射**: Equirectangular（等距圆柱）
- **坐标系**: 内向球体（反向三角形索引）

### WebXR 配置

```javascript
{
  mode: 'immersive-vr',
  referenceSpace: 'local-floor' (fallback: 'local'),
  features: ['local-floor', 'bounded-floor'],
  framebufferScaleFactor: 0.8,
  antialias: false,
  depth: true
}
```

### 性能参数

- **最大纹理尺寸**: 4096px（可配置）
- **内存占用**:
  - 初始化前: ~2KB（仅配置对象）
  - VR 运行时: ~50-100MB（取决于图片大小）
  - 退出后: ~2KB（资源完全释放）
- **帧率**: 72-90 FPS（取决于 VR 设备）

---

## 快速开始

### 1. 引入插件

```html
<script src="vr-plugin.js"></script>
```

### 1.1 普通引入（script 标签）

如果你不使用打包工具，可以直接通过 `<script>` 标签引入 UMD 构建文件（例如项目内的 `dist` 目录），插件会挂载到全局 `window`：

```html
<!-- 在页面中直接引用构建产物 -->
<script src="dist/vr-equirectangular-viewer.min.js"></script>
<script>
  const vrViewer = new window.VREquirectangularViewer({
    imageUrl: 'img/equirectangular.jpg',
    onVRStart: () => console.log('VR 启动'),
    onVREnd: () => console.log('VR 退出')
  })

  document.getElementById('enterVR').addEventListener('click', async () => {
    try {
      await vrViewer.enterVR()
    } catch (err) {
      console.error(err)
    }
  })
</script>
```

> 注意：直接引用本地或项目内的构建文件时，请确认文件路径正确，并且页面通过 HTTPS 或 localhost 提供（WebXR 要求）。

### 1.2 通过 npm 使用

如果你的项目使用 npm/yarn，并使用打包工具（例如 webpack、Rollup、Parcel、Vite 等），推荐通过 npm 安装并以 ESM 或 CommonJS 方式引入：

安装：

```bash
npm install vr-equirectangular-viewer --save
# 或者使用 yarn
yarn add vr-equirectangular-viewer
```

在现代项目中以 ESM 方式引入：

```javascript
import VREquirectangularViewer from 'vr-equirectangular-viewer/dist/vr-equirectangular-viewer.esm.js'

const vrViewer = new VREquirectangularViewer({
  imageUrl: 'img/equirectangular.jpg'
})
await vrViewer.enterVR()
```

如果你的环境使用 CommonJS（例如 Node + 打包器的兼容模式），可以引入 UMD 构建：

```javascript
const VREquirectangularViewer = require('vr-equirectangular-viewer/dist/vr-equirectangular-viewer.min.js')

const vrViewer = new VREquirectangularViewer({
  imageUrl: 'img/equirectangular.jpg'
})
vrViewer.enterVR()
```

与常见打包器配合的注意事项：

- Rollup / webpack / Vite：优先使用 ESM 构建（`*.esm.js`），有助于树摇与现代优化。
- 确保你的打包配置允许加载图片资源（例如 file-loader / asset modules），或者将图片放在静态目录并使用 URL 引用。
- 在开发时可直接用 `npm link` 或将本地 dist 输出复制到项目中进行调试。

### 2. 最简单的使用

```javascript
// 创建实例
const vrViewer = new VREquirectangularViewer({
  imageUrl: 'img/equirectangular.jpg'
})

// 检查支持
const supported = await vrViewer.isVRSupported()
if (!supported) {
  alert('您的设备不支持 WebXR VR')
  return
}

// 进入 VR
await vrViewer.enterVR()

// 退出 VR（用户也可以在 VR 中按退出键）
// vrViewer.exitVR();
```

### 3. 完整示例（带错误处理）

```javascript
const vrViewer = new VREquirectangularViewer({
  imageUrl: 'img/equirectangular.webp',
  maxTextureSize: 4096,

  onVRStart: () => {
    console.log('✅ VR 模式已启动')
    document.getElementById('status').textContent = 'VR 运行中...'
  },

  onVREnd: () => {
    console.log('🔄 VR 模式已退出，资源已释放')
    document.getElementById('status').textContent = '已退出 VR'
  },

  onError: error => {
    console.error('❌ 错误:', error)
    alert('VR 启动失败: ' + error)
  }
})

// 按钮点击事件
document.getElementById('enterVR').addEventListener('click', async () => {
  try {
    const supported = await vrViewer.isVRSupported()
    if (!supported) {
      throw new Error('设备不支持 WebXR VR')
    }

    await vrViewer.enterVR()
  } catch (error) {
    console.error('无法进入 VR:', error)
  }
})
```

---

## API 参考

### 构造函数

```javascript
new VREquirectangularViewer(options)
```

创建 VR 查看器实例（不会加载任何资源）。

**参数**: `options` (Object)

- `imageUrl` (string): 全景图片 URL（默认: `'img/equirectangular.jpg'`）
- `maxTextureSize` (number): 最大纹理尺寸，像素（默认: `4096`）
- `onVRStart` (function): VR 启动回调
- `onVREnd` (function): VR 退出回调
- `onError` (function): 错误回调

**返回**: VREquirectangularViewer 实例

---

### isVRSupported()

```javascript
await vrViewer.isVRSupported()
```

检查设备是否支持 WebXR VR（无需加载资源）。

**返回**: `Promise<boolean>`

- `true`: 设备支持 WebXR VR
- `false`: 不支持

**示例**:

```javascript
if (await vrViewer.isVRSupported()) {
  document.getElementById('enterVR').disabled = false
} else {
  document.getElementById('enterVR').style.display = 'none'
}
```

---

### enterVR()

```javascript
await vrViewer.enterVR()
```

进入 VR 模式。首次调用时会懒加载所有资源（WebGL、着色器、纹理等）。

**返回**: `Promise<void>`

**可能抛出的错误**:

- `'已经在VR模式中'`: 重复调用 enterVR
- `'设备不支持WebXR VR'`: 浏览器/设备不支持
- `'WebGL初始化失败'`: WebGL 上下文创建失败
- `'着色器初始化失败'`: 着色器编译/链接错误
- `'无法创建VR会话'`: XR 会话请求被拒绝
- `'图片加载失败'`: 纹理图片加载错误

**示例**:

```javascript
try {
  await vrViewer.enterVR()
  console.log('成功进入 VR')
} catch (error) {
  console.error('进入 VR 失败:', error)
  alert(error.message)
}
```

---

### exitVR()

```javascript
vrViewer.exitVR()
```

退出 VR 模式并自动销毁所有资源。

**返回**: `void`

**说明**:

- 结束 XR 会话
- 直接调用内部清理方法（不依赖事件）
- 释放所有 GPU 和 CPU 内存
- 触发 `onVREnd` 回调
- 可安全重复调用

**示例**:

```javascript
// 添加退出按钮（通常不需要，用户可在 VR 中退出）
document.getElementById('exitVR').addEventListener('click', () => {
  vrViewer.exitVR()
})
```

---

### destroy()

```javascript
vrViewer.destroy()
```

手动销毁查看器并释放所有资源。

**返回**: `void`

**说明**:

- 通常不需要手动调用（`exitVR()` 会自动调用）
- 删除所有 WebGL 资源（纹理、缓冲区、着色器程序）
- 丢失 WebGL 上下文释放 GPU 内存
- 移除 DOM 中的 canvas 元素
- 重置所有内部状态

**示例**:

```javascript
// 页面卸载时清理（可选）
window.addEventListener('beforeunload', () => {
  vrViewer.destroy()
})
```

---

## 配置选项

### imageUrl

**类型**: `string`  
**默认**: `'img/equirectangular.jpg'`

全景图片的 URL 路径。支持相对路径和绝对路径。

**支持格式**:

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`) - 推荐，文件更小

**推荐尺寸**:

- 标准质量: 4096 x 2048
- 高质量: 8192 x 4096
- 超高质量: 11904 x 5952（会自动缩放）

**示例**:

```javascript
const vrViewer = new VREquirectangularViewer({
  imageUrl: '/assets/equirectangulars/office.webp'
})
```

---

### maxTextureSize

**类型**: `number`  
**默认**: `4096`

最大纹理尺寸限制（像素）。超过此尺寸的图片会被自动缩放。

**说明**:

- 设置为设备 GPU 安全值（通常 4096 适配大多数移动设备）
- 实际上限为 `Math.min(maxTextureSize, gl.MAX_TEXTURE_SIZE)`
- 过大会导致移动 VR 设备显示灰屏或崩溃
- 过小会损失画质

**推荐值**:

- 移动 VR 设备: `4096`
- 高端 PC VR: `8192`
- 调试/测试: `2048`

**示例**:

```javascript
const vrViewer = new VREquirectangularViewer({
  imageUrl: 'img/huge-equirectangular.jpg', // 11904x5952
  maxTextureSize: 4096 // 会自动缩放到 4096x2048
})
```

---

### onVRStart

**类型**: `function`  
**默认**: `() => {}`

VR 模式启动成功时的回调函数。

**触发时机**: XR 会话创建成功，渲染循环开始

**示例**:

```javascript
const vrViewer = new VREquirectangularViewer({
  imageUrl: 'img/equirectangular.jpg',
  onVRStart: () => {
    console.log('VR 已启动')
    document.body.classList.add('vr-active')
    hideUI() // 隐藏页面 UI
  }
})
```

---

### onVREnd

**类型**: `function`  
**默认**: `() => {}`

VR 模式退出时的回调函数。

**触发时机**: XR 会话结束，资源已释放

**示例**:

```javascript
const vrViewer = new VREquirectangularViewer({
  imageUrl: 'img/equirectangular.jpg',
  onVREnd: () => {
    console.log('VR 已退出，内存已释放')
    document.body.classList.remove('vr-active')
    showUI() // 恢复页面 UI
  }
})
```

---

### onError

**类型**: `function`  
**默认**: `console.error`

错误发生时的回调函数。

**参数**: `error` (string) - 错误描述信息

**常见错误类型**:

- WebGL 不可用
- 着色器编译/链接失败
- 图片加载失败
- 纹理上传失败
- XR 会话创建失败

**示例**:

```javascript
const vrViewer = new VREquirectangularViewer({
  imageUrl: 'img/equirectangular.jpg',
  onError: error => {
    console.error('VR 错误:', error)
    document.getElementById('error-message').textContent = error
    document.getElementById('error-dialog').style.display = 'block'
  }
})
```

---

## 使用示例

### 示例 1: 基础集成

```html
<!DOCTYPE html>
<html>
  <head>
    <title>VR 全景查看器</title>
  </head>
  <body>
    <button id="enterVR">进入 VR 模式</button>
    <p id="status">准备就绪</p>

    <script src="vr-plugin.js"></script>
    <script>
      const vrViewer = new VREquirectangularViewer({
        imageUrl: 'img/equirectangular.jpg',
        onVRStart: () => {
          document.getElementById('status').textContent = 'VR 运行中'
        },
        onVREnd: () => {
          document.getElementById('status').textContent = '已退出 VR'
        }
      })

      document.getElementById('enterVR').addEventListener('click', async () => {
        try {
          await vrViewer.enterVR()
        } catch (error) {
          alert('VR 启动失败: ' + error)
        }
      })
    </script>
  </body>
</html>
```

---

### 示例 2: 检查设备支持

```javascript
async function initVR() {
  const vrViewer = new VREquirectangularViewer({
    imageUrl: 'img/equirectangular.jpg'
  })

  // 检查支持
  const supported = await vrViewer.isVRSupported()

  if (!supported) {
    document.getElementById('enterVR').disabled = true
    document.getElementById('message').textContent =
      '您的设备不支持 WebXR VR。请使用支持 WebXR 的浏览器或 VR 设备。'
    return null
  }

  document.getElementById('message').textContent = '设备支持 VR！点击按钮体验。'

  return vrViewer
}

initVR().then(vrViewer => {
  if (vrViewer) {
    document.getElementById('enterVR').onclick = () => {
      vrViewer.enterVR()
    }
  }
})
```

---

### 示例 3: 多个全景切换

```javascript
const equirectangulars = [
  { name: '办公室', url: 'img/office.jpg' },
  { name: '会议室', url: 'img/meeting.jpg' },
  { name: '休息区', url: 'img/lounge.jpg' }
]

let currentViewer = null

async function switchEquirectangular(index) {
  // 销毁旧的查看器
  if (currentViewer) {
    currentViewer.destroy()
  }

  // 创建新查看器
  currentViewer = new VREquirectangularViewer({
    imageUrl: equirectangulars[index].url,
    onVRStart: () => {
      console.log(`正在查看: ${equirectangulars[index].name}`)
    }
  })

  // 自动进入 VR
  try {
    await currentViewer.enterVR()
  } catch (error) {
    console.error('切换全景失败:', error)
  }
}

// 按钮绑定
document.querySelectorAll('.equirectangular-btn').forEach((btn, index) => {
  btn.addEventListener('click', () => switchEquirectangular(index))
})
```

---

### 示例 4: 与现有项目集成

```javascript
// 现有的 Web 应用
class MyApp {
  constructor() {
    this.vrViewer = null
    this.isVRActive = false
  }

  async enableVRMode() {
    if (!this.vrViewer) {
      this.vrViewer = new VREquirectangularViewer({
        imageUrl: 'img/equirectangular.jpg',
        onVRStart: () => this.onVRStarted(),
        onVREnd: () => this.onVREnded()
      })
    }

    try {
      await this.vrViewer.enterVR()
    } catch (error) {
      this.showError('VR 启动失败: ' + error)
    }
  }

  onVRStarted() {
    this.isVRActive = true
    this.pauseBackgroundTasks()
    this.hideUI()
  }

  onVREnded() {
    this.isVRActive = false
    this.resumeBackgroundTasks()
    this.showUI()
  }

  pauseBackgroundTasks() {
    // 暂停动画、定时器等
  }

  resumeBackgroundTasks() {
    // 恢复应用状态
  }
}

const app = new MyApp()
document.getElementById('vrButton').onclick = () => app.enableVRMode()
```

---

## 性能优化

### 1. 图片优化建议

**格式选择**:

- 优先使用 **WebP**（比 JPEG 小 25-35%）
- 避免使用 PNG（文件过大）

**尺寸建议**:

```
标准质量: 4096 x 2048 (~2-4 MB)
高质量:   8192 x 4096 (~8-15 MB)
```

**压缩工具**:

```bash
# 使用 cwebp 转换
cwebp -q 85 input.jpg -o output.webp

# 使用 ImageMagick 缩放
magick input.jpg -resize 4096x2048 output.jpg
```

---

### 2. 内存管理最佳实践

```javascript
// ✅ 正确：退出后自动清理
const vrViewer = new VREquirectangularViewer({
  imageUrl: 'img/equirectangular.jpg'
})
await vrViewer.enterVR()
// ... 使用 VR ...
vrViewer.exitVR() // 自动释放所有内存

// ✅ 正确：多次进入/退出
await vrViewer.enterVR() // 第一次加载
vrViewer.exitVR() // 释放内存
await vrViewer.enterVR() // 重新加载
vrViewer.exitVR() // 再次释放

// ❌ 错误：不要创建多个未销毁的实例
const viewer1 = new VREquirectangularViewer({ imageUrl: 'img/a.jpg' })
const viewer2 = new VREquirectangularViewer({ imageUrl: 'img/b.jpg' })
await viewer1.enterVR() // viewer1 占用内存
await viewer2.enterVR() // viewer2 占用内存 - 可能导致内存溢出

// ✅ 正确：切换前先销毁
if (currentViewer) {
  currentViewer.destroy()
}
currentViewer = new VREquirectangularViewer({ imageUrl: newUrl })
```

---

### 3. 减少加载时间

```javascript
// 预加载检查（不加载资源）
const vrViewer = new VREquirectangularViewer({
  imageUrl: 'img/equirectangular.jpg'
})

// 提前检查支持（快速）
const supported = await vrViewer.isVRSupported()

if (supported) {
  // 用户点击时才加载资源
  document.getElementById('enterVR').onclick = () => {
    vrViewer.enterVR() // 此时才加载 WebGL + 图片
  }
}
```

---

### 4. 移动设备优化

```javascript
// 检测移动设备并调整设置
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)

const vrViewer = new VREquirectangularViewer({
  imageUrl: 'img/equirectangular.webp',
  maxTextureSize: isMobile ? 4096 : 8192, // 移动设备限制为 4K
  onError: error => {
    if (error.includes('纹理')) {
      // 纹理问题时重试更小尺寸
      console.warn('降低纹理质量重试...')
    }
  }
})
```

---

## 常见问题

### Q1: 如何判断设备是否支持 WebXR？

```javascript
const vrViewer = new VREquirectangularViewer({
  imageUrl: 'img/equirectangular.jpg'
})
const supported = await vrViewer.isVRSupported()

if (!supported) {
  alert('您的设备不支持 WebXR VR')
} else {
  console.log('设备支持 WebXR')
}
```

---

### Q2: 图片显示倒置怎么办？

插件已修复此问题（UV 坐标和三角形顶点顺序已优化）。如果仍有问题：

1. 检查图片是否为标准的 Equirectangular 格式
2. 确认图片方向（天空在上，地面在下）
3. 使用图片编辑工具翻转图片

---

### Q3: VR 设备显示灰屏？

**原因**: 图片尺寸超过设备 GPU 限制

**解决方案**:

```javascript
const vrViewer = new VREquirectangularViewer({
  imageUrl: 'img/equirectangular.jpg',
  maxTextureSize: 4096 // 限制为 4K（自动缩放）
})
```

或手动缩小图片：

```bash
# 缩放到 4096x2048
magick input.jpg -resize 4096x2048 output.jpg
```

---

### Q4: 如何避免内存泄漏？

**插件自动管理内存**，但建议：

1. **退出 VR 时自动释放**（默认行为）

   ```javascript
   vrViewer.exitVR() // 自动调用 destroy()
   ```

2. **切换全景前销毁旧实例**

   ```javascript
   if (currentViewer) {
     currentViewer.destroy()
   }
   currentViewer = new VREquirectangularViewer({ imageUrl: newUrl })
   ```

3. **页面卸载时清理**（可选）
   ```javascript
   window.addEventListener('beforeunload', () => {
     vrViewer.destroy()
   })
   ```

---

### Q5: 可以在非 HTTPS 环境使用吗？

**不可以**。WebXR API 要求：

- HTTPS 连接（生产环境）
- 或 `localhost`（开发环境）

开发时可以使用：

```bash
# 启动本地 HTTPS 服务器
npx http-server -S -C cert.pem -K key.pem
```

---

### Q6: 如何自定义球体精度？

当前版本球体细分度固定为 60x60。如需自定义，可修改 `_createSphere()` 方法：

```javascript
// 在插件源码中修改
_createSphere() {
  const latBands = 120; // 增加精度（更平滑，但性能降低）
  const lonBands = 120;
  // ... 其余代码不变
}
```

**推荐值**:

- 低端设备: 30x30
- 标准设备: 60x60（默认）
- 高端设备: 120x120

---

### Q7: 支持视频全景吗？

当前版本仅支持静态图片。视频全景需要额外实现：

- 使用 `<video>` 元素作为纹理源
- 在渲染循环中更新纹理（`gl.texImage2D`）
- 处理视频播放控制

计划在未来版本中添加。

---

## 浏览器兼容性

### 支持的浏览器

| 浏览器               | 版本   | WebXR 支持  | 备注                    |
| -------------------- | ------ | ----------- | ----------------------- |
| **Chrome**           | 79+    | ✅ 完全支持 | 推荐                    |
| **Edge**             | 79+    | ✅ 完全支持 | 基于 Chromium           |
| **Firefox**          | 98+    | ⚠️ 部分支持 | 需启用 WebXR 标志       |
| **Safari**           | 不支持 | ❌ 不支持   | iOS Safari 不支持 WebXR |
| **Oculus Browser**   | 最新版 | ✅ 完全支持 | Meta Quest 自带浏览器   |
| **Samsung Internet** | 15+    | ✅ 完全支持 | 安卓 VR 设备            |

### VR 设备支持

| 设备                      | 支持状态    | 推荐浏览器           |
| ------------------------- | ----------- | -------------------- |
| **Meta Quest 2/3/Pro**    | ✅ 完全支持 | Oculus Browser       |
| **HTC Vive**              | ✅ 完全支持 | Chrome               |
| **Valve Index**           | ✅ 完全支持 | Chrome               |
| **Windows Mixed Reality** | ✅ 完全支持 | Edge                 |
| **Pico**                  | ✅ 完全支持 | Pico Browser         |
| **Google Cardboard**      | ❌ 不支持   | 使用 WebVR（已弃用） |

### 启用 WebXR（Firefox）

1. 打开 `about:config`
2. 搜索 `dom.vr.webxr.enabled`
3. 设置为 `true`

---

## 故障排除

### 问题 1: "WebGL 不可用"

**可能原因**:

- 浏览器禁用了 WebGL
- GPU 驱动过旧
- 硬件不支持

**解决方法**:

1. 访问 `chrome://gpu` 检查 WebGL 状态
2. 更新显卡驱动
3. 在浏览器设置中启用硬件加速

---

### 问题 2: "设备不支持 WebXR VR"

**可能原因**:

- 浏览器不支持 WebXR
- 未使用 HTTPS
- VR 设备未连接

**解决方法**:

1. 使用 Chrome 79+ 或 Edge 79+
2. 确保使用 HTTPS 或 localhost
3. 连接 VR 设备并安装驱动

---

### 问题 3: "图片加载失败"

**可能原因**:

- 图片路径错误
- CORS 跨域问题
- 图片格式不支持

**解决方法**:

```javascript
// 检查图片 URL
const vrViewer = new VREquirectangularViewer({
  imageUrl: 'img/equirectangular.jpg', // 确认路径正确
  onError: error => {
    console.error('加载失败:', error)
  }
})

// 确保服务器允许 CORS
// 或将图片放在同一域名下
```

---

### 问题 4: VR 模式下画面卡顿

**可能原因**:

- 图片尺寸过大
- 设备性能不足
- 后台任务占用资源

**解决方法**:

```javascript
// 1. 降低纹理尺寸
const vrViewer = new VREquirectangularViewer({
  imageUrl: 'img/equirectangular.jpg',
  maxTextureSize: 2048 // 从 4096 降低到 2048
})

// 2. 优化图片（使用 WebP，降低质量）
// 3. 关闭其他应用和浏览器标签页
```

---

### 问题 5: 退出 VR 后内存未释放

**插件已修复此问题**。`exitVR()` 方法现在直接调用清理函数，确保内存释放。

验证方法：

```javascript
const vrViewer = new VREquirectangularViewer({
  imageUrl: 'img/equirectangular.jpg'
})

await vrViewer.enterVR()
console.log('VR 运行中')

vrViewer.exitVR()
console.log('VR 已退出')

// 在 Chrome DevTools -> Memory 中检查内存占用
// 应该恢复到初始化前的水平
```

---

## 高级用法

### 自定义渲染设置

如需修改渲染参数，可编辑插件源码：

```javascript
// 在 enterVR() 方法中修改 XRWebGLLayer 配置
const glLayer = new XRWebGLLayer(this.xrSession, this.gl, {
  antialias: false, // 抗锯齿（开启会降低性能）
  depth: true, // 深度缓冲
  stencil: false, // 模板缓冲
  alpha: false, // 透明通道
  framebufferScaleFactor: 0.8 // 帧缓冲缩放（降低提升性能）
})
```

---

### 添加自定义控制

```javascript
class CustomVRViewer extends VREquirectangularViewer {
  constructor(options) {
    super(options)
    this.rotationSpeed = options.rotationSpeed || 1.0
  }

  _renderScene(projectionMatrix, viewMatrix) {
    // 添加自动旋转
    const rotation = (this.rotationSpeed * Date.now()) / 1000
    // ... 修改 viewMatrix ...

    super._renderScene(projectionMatrix, viewMatrix)
  }
}
```

---

## 许可证

本插件为开源项目，可自由使用和修改。

---

## 更新日志

### v1.0.0 (2025-10-21)

- ✅ 初始版本发布
- ✅ 懒加载架构
- ✅ 自动资源管理
- ✅ 超大图片支持
- ✅ 修复 UV 坐标和三角形顶点顺序
- ✅ 修复 exitVR 内存释放问题

---

## 支持

如有问题或建议，请提交 Issue 或 Pull Request。

**项目地址**: [openai-realtime-demo](https://github.com/ebusiness/openai-realtime-demo)

---

**祝使用愉快！🎉**
