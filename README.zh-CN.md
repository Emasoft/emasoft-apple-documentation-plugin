# Emasoft Apple Documentation 插件

<!--BADGES-START-->
[![版本](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/Emasoft/emasoft-apple-documentation-plugin/releases)
[![许可证: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
<!--BADGES-END-->

面向 Claude Code 的 Apple 开发者文档：搜索 iOS、macOS、watchOS、tvOS 和 visionOS 文档、框架、API、SwiftUI、UIKit 和 WWDC 视频，并直接在 Claude Code 会话中获取 Swift/Objective-C 代码示例、API 参考和技术指南。插件内置了 MCP（模型上下文协议）服务器，因此只需安装插件即可使用。

本插件（`emasoft-apple-documentation-plugin`）基于 kimsungwhee 的 [kimsungwhee/apple-docs-mcp](https://github.com/kimsungwhee/apple-docs-mcp)（MIT 许可证）。它是一个独立的 fork，已重新打包为 Claude Code 插件，不会发布到 npm。

[English](README.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | **简体中文**

> **注**: 本简体中文版可能落后于英文版更新。安装、配置和开发部分由英文版 README 机器翻译而来。最新、最准确的信息请参阅[英文版 README](README.md)。

## 功能特性

- **智能搜索**: 智能搜索 SwiftUI、UIKit、Foundation、CoreData、ARKit 等 Apple 开发者文档
- **完整文档访问**: 完全访问 Apple JSON API，获取 Swift、Objective-C 和框架文档
- **Apple Design 和 HIG 访问**: 读取 Human Interface Guidelines JSON、Apple Design 页面和 Design Resources 目录条目
- **设计资源预览**: 以 MCP 图像内容块的形式返回 Apple 提供的 HIG 图片和资源缩略图
- **可下载的设计资源**: 将 Apple 直接托管的模板、字体、工具和压缩包下载到本地 MCP 资源缓存
- **框架索引**: 浏览 iOS、macOS、watchOS、tvOS、visionOS 框架的分层 API 结构
- **技术目录**: 探索包括 SwiftUI、UIKit、Metal、Core ML、Vision 和 ARKit 在内的 Apple 技术
- **文档更新**: 跟踪 WWDC 2025/2026 公告、iOS 27、macOS 27 和最新 SDK 发布
- **技术概览**: Swift、SwiftUI、UIKit 和所有 Apple 开发平台的综合指南
- **示例代码库**: iOS、macOS 和跨平台开发的 Swift 和 Objective-C 代码示例
- **WWDC 视频库**: 搜索 WWDC 2014-2026 会议，包含文字记录、Swift/SwiftUI 代码示例和资源，完全离线可用
- **相关 API 发现**: 查找 SwiftUI 视图、UIKit 控制器和框架特定的 API 关系
- **平台兼容性**: iOS 13+、macOS 10.15+、watchOS 6+、tvOS 13+、visionOS 兼容性分析
- **高性能**: 针对 Xcode、Swift Playgrounds 和 AI 驱动的开发环境进行优化
- **智能 UserAgent 池**: 具备自动故障恢复和性能监控的智能 UserAgent 轮换系统
- **多平台**: 完整的 iOS、iPadOS、macOS、watchOS、tvOS 和 visionOS 文档支持
- **Beta 和状态跟踪**: Beta 和新发布的 API、已弃用的 UIKit 方法、新 SwiftUI 功能跟踪

## 安装

### 要求

- [Claude Code](https://code.claude.com/docs/en/overview)
- `PATH` 中的 `node`（Node.js 22 或更高版本）。Claude Code 使用 `node` 运行内置服务器，而其原生安装程序不附带 Node.js。可用 `node --version` 检查。
- 每个已安装的插件版本约占 39 MB 磁盘空间（WWDC 数据已内置，供离线使用）。

### 在 Claude Code 会话中

```text
/plugin marketplace add Emasoft/emasoft-plugins
/plugin install emasoft-apple-documentation-plugin@emasoft-plugins
```

### 在终端中

```bash
claude plugin marketplace add Emasoft/emasoft-plugins
claude plugin install emasoft-apple-documentation-plugin@emasoft-plugins --scope user
```

重启 Claude Code（或运行 `/reload-plugins`）以激活插件，然后运行 `/mcp`，检查本插件的 `apple-docs` 服务器是否已连接。

### 更新和卸载

```bash
claude plugin update emasoft-apple-documentation-plugin@emasoft-plugins
claude plugin uninstall emasoft-apple-documentation-plugin
```

### Claude Code 中的工具名称

Claude Code 会为插件 MCP 服务器的工具添加命名空间，因此工具 `search_apple_docs` 显示为 `mcp__plugin_emasoft-apple-documentation-plugin_apple-docs__search_apple_docs`。您无需输入这些名称：描述您的需求，Claude 会选择合适的工具。

### 故障排除

- **服务器无法启动，或 `/mcp` 显示失败？** Claude Code 使用命令 `node` 启动服务器。GUI 应用不一定会继承 shell 的 `PATH`：请在终端运行 `which node`，并确认该目录在启动 Claude Code 的进程的 `PATH` 中。插件需要 Node.js 22 或更高版本。
- **`search_apple_docs` 没有返回结果或报错？** 它依赖 developer.apple.com 搜索页面内部使用的未公开 Apple 搜索后端（`devintserv.msc.sbz.apple.com`）。如果 Apple 更改了响应格式，在本插件跟进之前 `search_apple_docs` 可能无法工作。`get_apple_doc_content`、`search_framework_symbols` 和 WWDC 工具不依赖该端点，仍可正常使用。

## 使用示例

用自然语言询问 Claude，它会选择合适的工具。示例：

### 智能搜索

```text
"搜索 SwiftUI 动画"
"查找 withAnimation API 文档"
"查询 Swift 中的 async/await 模式"
"显示 AlarmKit 调度示例"
```

### 文档访问

```text
"获取 SwiftUI 框架的详细信息"
"显示 withAnimation API 及相关 API"
"获取 SwiftData 的平台兼容性"
"访问 UIViewController 文档及类似 API"
```

### Apple Design 和 HIG

```text
"搜索关于布局的 Apple Design 文档"
"列出适用于 iOS 模板的 Apple Design Resources"
"下载此 resourceId 对应的 Apple Design 资源"
"显示布局 HIG 页面的 Apple Design 示例"
```

### 框架探索

```text
"显示 SwiftUI 框架 API 索引"
"列出所有 UIKit 类和方法"
"浏览 ARKit 框架结构"
"获取 WeatherKit API 层次结构"
```

### API 发现

```text
"查找与 UIViewController 相关的 API"
"显示与 withAnimation 类似的 API"
"获取 SwiftData 文档中的所有引用"
"发现 Core Data NSManagedObject 的替代方案"
```

### 技术和平台分析

```text
"列出 iOS 最新版本中的所有 Beta 框架"
"显示图形和游戏技术"
"有哪些机器学习框架可用？"
"分析 Vision 框架的平台兼容性"
```

### 文档更新

```text
"显示最新的 WWDC 更新"
"SwiftUI 有什么新功能？"
"获取 iOS 的技术更新"
"显示 Xcode 的发布说明"
"查找最新更新中的 beta 功能"
```

### 技术概览

```text
"显示应用设计和 UI 的技术概览"
"获取游戏开发的综合指南"
"探索 AI 和机器学习概览"
"显示 iOS 特定的技术指南"
"获取数据管理技术概览"
```

### 示例代码库

```text
"显示 SwiftUI 示例代码项目"
"查找机器学习示例代码"
"获取 UIKit 示例项目"
"显示精选 WWDC 示例代码"
"查找 Core Data 示例实现"
"仅显示测试版示例代码项目"
```

### WWDC 视频搜索

```text
"搜索关于 SwiftUI 的 WWDC 视频"
"查找机器学习的 WWDC 会议"
"显示 WWDC 2024 视频"
"搜索 async/await WWDC 演讲"
"查找关于 Swift 并发的 WWDC 视频"
"显示无障碍主题的 WWDC 会议"
```

### WWDC 视频详情

```text
"获取 WWDC 会议 10176 的详情"
"显示 WWDC23 SwiftData 会议的文字记录"
"获取 WWDC 视频 10019 的代码示例"
"显示 Vision Pro WWDC 会议的资源"
"获取 Meet async/await in Swift 会议的文字记录"
```

### WWDC 主题和年份

```text
"列出所有 WWDC 主题"
"显示 Swift 主题的 WWDC 视频"
"获取关于开发者工具的 WWDC 视频"
"列出 2023 年的 WWDC 视频"
"显示所有 SwiftUI 和 UI 框架会议"
"获取机器学习 WWDC 内容"
```

### 高级用法

```text
"查找 @State 相关 API 及平台分析"
"解析 SwiftUI 文档中的所有引用"
"获取 Vision 框架的平台兼容性分析"
"深度搜索与 UIViewController 类似的 API"
```

## 可用工具

| 工具 | 描述 | 主要功能 |
|------|------|----------|
| `search_apple_docs` | 搜索 Apple 开发者文档 | 官方搜索 API，查找特定 API、类、方法 |
| `get_apple_doc_content` | 获取详细文档内容 | JSON API 访问，可选增强分析（相关/类似 API，平台兼容性） |
| `search_apple_design_docs` | 搜索 Apple Design 和 HIG 内容 | HIG JSON 引用，Design 页面，Design Resources 目录 |
| `get_apple_design_content` | 读取 Apple Design 和 HIG 页面 | HIG JSON 渲染，`/design/` 页面的 HTML 回退 |
| `list_apple_design_resources` | 列出 Apple Design Resources | 稳定的资源 ID，类别/平台/格式过滤，预览和链接 |
| `download_apple_design_resource` | 直接下载 Apple Design 资源 | 本地缓存，MCP `resource_link` 块，`resources/read` 二进制访问 |
| `get_apple_design_examples` | 返回 Apple Design 视觉示例 | 带 base64 数据和 MIME 类型的 MCP `image` 块 |
| `list_technologies` | 浏览所有 Apple 技术 | 类别过滤，语言支持，beta 状态 |
| `search_framework_symbols` | 在特定框架中搜索符号 | 类、结构体、协议，通配符模式，类型过滤 |
| `get_related_apis` | 查找相关 API | 继承、遵循、"参见"关系 |
| `resolve_references_batch` | 批量解析 API 引用 | 从文档中提取和解析所有引用 |
| `get_platform_compatibility` | 平台兼容性分析 | 版本支持，beta 状态，弃用信息 |
| `find_similar_apis` | 发现类似 API | Apple 官方推荐，主题分组 |
| `get_documentation_updates` | 跟踪 Apple 文档更新 | WWDC 公告，技术更新，发布说明 |
| `get_technology_overviews` | 获取技术概览和指南 | 综合指南，分层导航，平台过滤 |
| `get_sample_code` | 浏览 Apple 示例代码项目 | 框架过滤（有限制），关键词搜索，beta 状态 |
| `list_wwdc_videos` | 浏览 WWDC 视频会议 | 离线文字记录和代码，主题/年份过滤 |
| `search_wwdc_content` | 全文搜索 WWDC 文字记录和代码 | 特定讨论，API 提及，实现示例 |
| `get_wwdc_video` | 获取完整的 WWDC 会议内容 | 完整文字记录，代码示例，资源 |
| `get_wwdc_code_examples` | 浏览 WWDC 会议中的代码示例 | 带会议上下文的实现模式 |
| `browse_wwdc_topics` | 列出 WWDC 主题类别及其 ID | 可用于 `list_wwdc_videos` 过滤的主题 ID |
| `find_related_wwdc_videos` | 发现与某个视频相关的会议 | 先修会议，后续会议，类似演讲 |
| `list_wwdc_years` | 列出所有可用的 WWDC 年份 | 会议年份及视频数量和统计信息 |

## 技术架构

```text
emasoft-apple-documentation-plugin/
├── .claude-plugin/plugin.json        # Claude Code 插件清单
├── .mcp.json                         # 注册内置 MCP 服务器 (apple-docs)
├── servers/apple-docs/
│   ├── index.js                      # 已提交的 esbuild 打包文件，用户运行的服务器
│   └── THIRD_PARTY_LICENSES.txt      # 已打包依赖的许可证
├── data/wwdc/                        # 离线 WWDC 数据 (由打包文件读取)
├── src/                              # 服务器的 TypeScript 源码
│   ├── index.ts                      # MCP 服务器入口点，包含所有工具
│   ├── tools/                        # MCP 工具实现 (docs、design、WWDC 等)
│   └── utils/                        # 缓存、HTTP 客户端、UserAgent 池、错误处理
├── scripts/                          # build-bundle.mjs 和 publish.py
├── tests/                            # Jest 测试套件
└── package.json                      # 开发依赖和脚本 (private)
```

### 性能特性

- **基于内存的缓存**: 自定义缓存实现，具有自动清理和 TTL 支持
- **智能 UserAgent 池**: 具备自动故障恢复和性能监控的智能轮换系统
- **动态请求头**: 生成逼真的浏览器请求头 (Accept、Accept-Language、User-Agent)
- **智能搜索**: 官方 Apple 搜索 API，具有增强的结果格式化
- **增强分析**: 可选的相关 API、平台兼容性和相似性分析
- **错误恢复**: 优雅降级，全面的错误处理
- **类型安全**: 完整的 TypeScript，使用 Zod 进行运行时验证
- **零运行时依赖**: 服务器以单个打包文件发布，无需安装 node_modules

### 缓存策略

| 内容类型 | 缓存时长 | 缓存大小 | 原因 |
|----------|----------|----------|------|
| API 文档 | 30 分钟 | 500 项 | 频繁访问，适度更新 |
| 搜索结果 | 10 分钟 | 200 项 | 动态内容，用户特定 |
| 框架索引 | 1 小时 | 100 项 | 稳定结构，变化较少 |
| 技术列表 | 2 小时 | 50 项 | 很少变化，内容较大 |
| 文档更新 | 30 分钟 | 100 项 | 定期更新，WWDC 公告 |
| Apple Design 内容 | 2 小时 | 100 项 | HIG 和 Design 页面在会话期间保持稳定 |
| Apple Design 资源 | 2 小时 | 20 项 | 目录元数据的变化比页面读取少 |

下载的 Apple Design 文件缓存在插件目录之外：每个服务器进程创建的临时目录，或由 `APPLE_DOCS_MCP_CACHE_DIR` 指定的目录（见“配置”）。这些文件通过 MCP 的 `resources/list` 和 `resources/read` 提供。

## WWDC 数据

所有 WWDC 视频数据 (2014-2026) **直接内置于插件中**，带来以下优势：

- **零网络延迟**: WWDC 内容无需 API 调用
- **100% 离线访问**: 无需互联网连接即可使用
- **无速率限制**: 无限制的 WWDC 搜索和浏览
- **即时响应**: 所有数据均在本地可用

包含的数据：

- **1,400 多个 WWDC 会议视频**，附完整文字记录
- **19 个主题类别**，便于有序浏览
- **13 年的内容** (2014-2026)
- 每个已安装的插件版本含**约 39 MB 的优化 JSON 数据**

> **注意**: 请更新插件以获取最新的 WWDC 内容。

## 配置

服务器启动时会读取以下可选环境变量。这些变量必须设置在启动 Claude Code 的进程的环境中，因为通过图形界面启动的 Claude Code 看不到在 shell 配置文件中 export 的变量（已在 Claude Code 2.1.285 上验证，官方文档未记载）。设置方法：在已 export 这些变量的终端中启动 Claude Code；或在 macOS 上运行 `launchctl setenv NAME value`，然后重启 Claude Code（launchctl 设置的值在重启电脑后会失效）。

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `APPLE_DOCS_MCP_CACHE_DIR` | 已下载 Apple Design 文件的目录 | 每个服务器进程的临时目录 |
| `APPLE_DOCS_MCP_CACHE_MAX_BYTES` | 下载缓存的大小上限（字节） | 1073741824 (1 GiB) |
| `MCP_DEBUG` | 设为 `true` 以启用调试日志 | 关闭 |
| `DEFAULT_ACCEPT_LANGUAGE` | 发送给 Apple 服务器的 Accept-Language 请求头 | `en-US,en;q=0.9` |
| `DISABLE_LANGUAGE_ROTATION` | 设为 `true` 以停止轮换 Accept-Language 请求头 | 关闭 |
| `DISABLE_SEC_FETCH` | 设为 `true` 以去掉 Sec-Fetch-* 请求头 | 关闭 |
| `DISABLE_DNT` | 设为 `true` 以去掉 DNT 请求头 | 关闭 |
| `SIMPLE_HEADERS_MODE` | 设为 `true` 以发送最简请求头 | 关闭 |

服务器包含一个由 12 个以上预配置 UserAgent 字符串（macOS、Windows 和 Linux 上的 Chrome、Firefox、Safari 和 Edge）组成的池，并带有自动故障恢复的轮换。

## 开发

本节面向维护者，插件用户无需关注。要求：Node.js 22 或更高版本和 pnpm（版本由 `package.json` 中的 `packageManager` 固定）。

```bash
pnpm install --frozen-lockfile   # 安装开发依赖
pnpm build                       # 重新生成 servers/apple-docs/index.js 和 THIRD_PARTY_LICENSES.txt
pnpm typecheck                   # tsc --noEmit
pnpm lint                        # eslint src
pnpm test                        # Jest 测试套件
pnpm start                       # 运行已构建的 stdio 服务器 (node servers/apple-docs/index.js)
```

- **打包文件会被提交。** `servers/apple-docs/index.js` 是 Claude Code 运行的文件，用户机器上无需安装依赖。修改 `src/` 或任何已打包的依赖后，请运行 `pnpm build` 并提交结果：当已提交的打包文件与全新构建不同时，新鲜度测试（`tests/bundle-freshness.test.ts`）会失败。
- **不要添加 npm 或 bun 锁文件。** 如果 `package.json` 旁边存在 `package-lock.json`、`npm-shrinkwrap.json`、`bun.lock` 或 `bun.lockb`，Claude Code 会在插件根目录运行 `npm ci`，把所有开发依赖安装到每个用户的机器上。本仓库使用 pnpm，Claude Code 会忽略其锁文件。守卫测试（`tests/plugin-lockfile-guard.test.ts`）会在这些文件出现时失败。
- **依赖更新。** 升级 cheerio 后，必须重新验证 `scripts/build-bundle.mjs` 中指向其 `load-parse` 入口的重定向（运行 `pnpm build` 和独立打包文件测试）。
- **发布。** 使用 CPV 标准流水线发布：`uv run python scripts/publish.py`（lint、验证、测试、在 `plugin.json`、`package.json` 和 `pyproject.toml` 中递增版本、changelog、标签、推送和 GitHub 发布）。不会向 npm 发布任何内容。

## 贡献

欢迎贡献！以下是开始的方法：

1. **Fork** 仓库
2. **创建** 功能分支: `git checkout -b feature/amazing-feature`
3. 使用 Conventional Commits 格式**提交**更改（CI 中的 commitlint 会检查）: `git commit -m "feat: add amazing feature"`
4. **推送** 到分支: `git push origin feature/amazing-feature`
5. **打开** Pull Request

## 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE)。原始版权归 kimsungwhee 所有，新增部分版权归 Emasoft 所有。服务器中已打包依赖的许可证列在 [servers/apple-docs/THIRD_PARTY_LICENSES.txt](servers/apple-docs/THIRD_PARTY_LICENSES.txt) 中。

## 免责声明

此项目与 Apple Inc. 无关联或认可。它使用公开可用的 Apple 开发者文档 API 用于教育和开发目的。

---

[报告问题](https://github.com/Emasoft/emasoft-apple-documentation-plugin/issues) • [请求功能](https://github.com/Emasoft/emasoft-apple-documentation-plugin/issues/new) • [源码](https://github.com/Emasoft/emasoft-apple-documentation-plugin)
