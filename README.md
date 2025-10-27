# WebXR VR 全景查看器插件文档

## 简介

`VREquirectangularViewer` 是一个轻量级、零依赖的 WebXR VR 全景查看器插件。它使用原生 WebXR API 和 WebGL 技术，提供沉浸式的 360° 全景图片体验。支持 insta 360 导出的等距矩形投影图。

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

## 快速开始

### 1. 引入插件

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
- WebP (`.webp`)

**示例**:

```javascript
const vrViewer = new VREquirectangularViewer({
  imageUrl: '/assets/equirectangulars/office.webp'
})
```

---

### maxTextureSize

**类型**: `number`  
**默认**: `null`

最大纹理尺寸限制（像素）。超过此尺寸的图片会被自动缩放。不设置的话则使用设备默认的最大纹理。

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

## 支持

如有问题或建议，请提交 Issue 或 Pull Request。

**项目地址**: [VR-Equirectangular-Viewer](https://github.com/eeg1412/VR-Equirectangular-Viewer)

---

**祝使用愉快！🎉**
