# Agent-config

可视化生成 AI 编码 Agent 的第三方 Provider 配置。纯前端静态页面（GitHub Pages），所有处理都在浏览器本地完成，没有后端。

## 技术栈

React 19 + TypeScript + Zustand + Vite。动效只用 AutoAnimate 和原生 CSS（View Transitions），刻意不引入重型组件库。

## 架构

单页应用，顶部三个页签对应三个 Agent：**OpenCode / Codex / Pi**。三个页签互不共享状态，各自独立成模块，每个模块内聚自己的全部逻辑：

- 数据与编辑（store + Form）
- 导入解析（load）
- 校验（validate）
- 预览生成（preview）

`components/` 只放真正跨页复用的东西：表单控件和右侧预览面板。页面布局即「左表单、右实时预览」。

## 功能

- OpenCode 生成 `opencode.jsonc`；Codex 生成 `config.toml` + 模型目录 `models.json`；Pi 生成 `~/.pi/agent/models.json`
- 导入现有配置文件，解析后回填表单继续编辑；界面未覆盖的字段原样保留，不会弄丢
- 实时预览 + 一键复制，校验不通过时禁用复制并说明原因
- 明 / 暗 / 跟随系统三档主题

## 使用注意

- 桌面端页面，未适配手机。
- 配置内容（含 API Key）只在浏览器内存中处理，页面不发任何请求，**刷新即清空**，注意先复制再关闭。
- 导入是「尽力解析」：常见写法没问题，但不能保证任意手写配置都被完整理解，导入后请核对预览。
- 生成结果需要你自己放到对应 Agent 的配置目录，页面上标注了目标路径。
- 校验提示代表对应 Agent 会拒绝该配置，建议清掉再复制。
