# My Notion Clone (Local-First)

一个基于 React、Node.js 和 SQLite 构建的“本地优先” Notion 风格工作区。
目前处于 **Alpha / MVP** 阶段。

## 技术架构

*   **架构**: 本地优先 (Local-First)，支持离线逻辑，目前通过本地 Node 进程服务
*   **前端**: React, TypeScript, Vite, TailwindCSS, React Query
*   **后端**: Node.js, Fastify, better-sqlite3
*   **数据库**: 本地 SQLite 文件 (`apps/server/data/workspace.db`)
*   **仓库管理**: Monorepo (npm/pnpm workspaces)

## 当前进度 (已完成)

### 核心基建
- [x] Monorepo 环境搭建 (Web + Server + Shared Types)
- [x] SQLite 数据库 Schema 设计 (Pages, Blocks)
- [x] 后端 API (REST) 实现 Page 增删改查和 Block 批量更新

### 页面管理
- [x] 创建新页面
- [x] 页面列表展示
- [x] 基础导航 (列表页 <-> 详情页)

### 块编辑器 (Block Editor)
- [x] **数据结构**: 支持嵌套的树形结构 (Tree structure)
- [x] **块类型**: 段落, 标题 1/2/3, 待办事项, 代码块, 分割线
- [x] **基础交互**:
    - [x] `Enter` 创建新块 (智能判断类型)
    - [x] `Backspace` 删除空块 (级联删除子块)
    - [x] `Tab` / `Shift+Tab` 缩进与反缩进
    - [x] `↑` / `↓` 光标在块之间移动
    - [x] 下拉菜单切换块类型
    - [x] 待办事项复选框切换
- [x] **富文本 (Rich Text)**: Markdown 风格 ( **粗体**, *斜体*, `代码` )
- [x] **自动保存**: 防抖动 (Debounced) 整页保存

---

## 路线图 (Roadmap)

### 第一阶段: 核心编辑器体验 (当前重点)
- [x] **嵌套块 (Nested Blocks)**: 支持父子层级关系 (缩进)
- [x] **键盘交互优化**: 箭头键导航, 智能回车/删除
- [x] **富文本**: 块内 Markdown 渲染
- [x] **斜杠命令 (Slash Commands)**: 输入 `/` 唤起菜单创建块
- [x] **拖拽排序 (Drag & Drop)**: 拖动块进行排序

### 第二阶段: UI 与打磨
- [x] **侧边栏**: 可折叠的页面树状侧边栏
- [x] **页面属性**: 图标 (Icon), 封面图 (Cover), 创建/更新时间
- [x] **样式优化**: 优化 UI 细节，更接近 Notion 原生质感
- [x] **暗色模式**

### 第三阶段: 高级类型
- [ ] **数据库 (Database)**: 表格视图, 看板视图
- [ ] **媒体**: 图片上传与托管 (本地文件存储)
- [ ] **页面引用**: `[[` 引用其他页面

### 第四阶段: 云端与同步
- [ ] **鉴权**: 用户登录
- [ ] **同步引擎**: 将本地 SQLite 变更推送到云端 (CRDT 或简单的 Last-Write-Wins)

---

## 如何运行

1.  **安装依赖**
    ```bash
    npm install
    ```

2.  **启动开发环境 (Web + Server)**
    ```bash
    npm run dev
    ```
    - 前端地址: `http://localhost:5173`
    - 后端地址: `http://localhost:3000`
