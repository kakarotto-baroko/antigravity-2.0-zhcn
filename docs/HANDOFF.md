# GitHub 交接说明

## 当前结论

- 当前主版本已升级到 `2.0.6`。
- `2.0.0` 上的“进入界面卡死”问题已经定位并修复，修复策略已沿用到后续版本。
- 修复方案不是全局劫持 `https`，而是：
  `customScheme.ai-ui.js` 注册 `agy-ui://`，再用 `webRequest.onBeforeRequest` 仅重定向 `https://127.0.0.1:*/main.js`。
- 本机验证过主日志出现 `Serving translated AI UI bundle`，说明主界面中文 bundle 已实际加载。
- `scripts/translate_ui.py` 已扩展到 289 条 UI 文案映射，本机最新一轮重生成命中 251 条。
- `scripts/apply.ps1` 现已能在 `2.0.6` 下自动解析真实运行中的 `/main.js`，不再死依赖旧 `scratch\\ui_main.js`。

## 本次已完成

- 修复 `2.0.0` 中 AI UI 注入导致的启动卡死。
- 将 AI UI 注入收敛为仅替换 `/main.js`。
- 补充设置中心首轮汉化：
  `外观 / 权限 / 浏览器 / 模型 / 自定义 / 应用 / 账户 / 快捷键` 等主要导航与设置项。
- 继续补齐项目设置页，当前已覆盖：
  `文件夹 / 添加文件夹 / 智能体设置 / 安全预设 / 产物评审策略 / 本地权限 / 文件访问规则 / 网络访问规则 / 终端命令 / 沙箱外命令 / MCP 工具 / 危险区域 / 删除项目`
- 账号页与应用页固定说明已补齐：
  `启用遥测 / 营销邮件 / 升级 / 退出登录 / 服务条款 / 通知设置 / 打开系统设置`
- 快捷键页主要固定文案已补齐：
  `CONVERSATION / LAYOUT CONTROLS / Toggle Model Selector / Toggle Voice Recording / Find in Pane / Toggle Sidebar / Toggle Auxiliary Pane`
- `2.0.6` 当前已通过标准命令重新部署验证，主日志可见 `Serving translated AI UI bundle`。

## 当前仓库里最重要的文件

- [scripts/translate_ui.py](/G:/GEMINI-xiangmu/AGY/AGY-汉化/scripts/translate_ui.py)
  AI UI 词典替换脚本，当前命中 251 / 289。
- [patches/customScheme.ai-ui.js](/G:/GEMINI-xiangmu/AGY/AGY-汉化/patches/customScheme.ai-ui.js)
  当前生效的 `/main.js` 定向重定向补丁。
- [patches/customScheme.core.js](/G:/GEMINI-xiangmu/AGY/AGY-汉化/patches/customScheme.core.js)
  稳定核心模式模板。
- [scripts/apply.ps1](/G:/GEMINI-xiangmu/AGY/AGY-汉化/scripts/apply.ps1)
  现有安装器入口，现已对 `2.0.6` 做自动 UI bundle 解析兼容。
- [scripts/extract.ps1](/G:/GEMINI-xiangmu/AGY/AGY-汉化/scripts/extract.ps1)
  版本更新报告入口。
- [patches/ai-ui-compat.json](/G:/GEMINI-xiangmu/AGY/AGY-汉化/patches/ai-ui-compat.json)
  当前已登记 `2.0.0` 与 `2.0.6`。
- [implementation_plan.md](/G:/GEMINI-xiangmu/AGY/AGY-汉化/implementation_plan.md)
  当前 `2.0.6` 的最新实施状态、哈希、部署方式与注意事项。

## 待继续处理

- 继续观察后续高版本更新后的目录结构变化。
- 若官方继续升级，需要重新抓取真实 `/main.js` 并更新 `patches/ai-ui-compat.json`。
- 做第二轮 AI UI 扫描。
  目前设置中心主体已补一轮，但仍可能残留分组标题、提示文本、通知页、Editor / Tab / Browser 深层描述中的英文。
- 继续处理运行态拼接文本。
  当前设置页仍可见的残留主要是：
  `了解更多关于 无限制`
  `继承自 全局设置。本地权限具有更高优先级。 了解更多.`
  `Rules`
  `Show 1 breakdown`
  这些更像组件拼接出来的文本，不是简单的完整静态字符串。
- 用户已明确表示当前完成度足够，以上残留不再继续追。

## 建议下一步

1. 先提交这批代码和文档，让仓库状态可追踪。
2. 后续若官方升级版本，先提取新版本真实前端 bundle 指纹，更新 `patches/ai-ui-compat.json`。
3. 继续逐屏复查静态说明文案，但不要碰动态数据字段。
4. 用运行中的设置页逐屏复查，把残余英文继续补掉。

## 建议上传内容

- `scripts/apply.ps1`
- `scripts/bg_install.py`
- `scripts/extract.ps1`
- `scripts/run_bg_install.bat`
- `scripts/translate_ui.py`
- `patches/customScheme.ai-ui.js`
- `patches/customScheme.core.js`
- `patches/ai-ui-compat.json`
- `README.md`
- `docs/INSTALL.md`
- `docs/CHANGELOG.md`
- `docs/HANDOFF.md`

## 本机验证事实

- `scripts/translate_ui.py` 已通过 `python -m py_compile`。
- `%APPDATA%\\Antigravity\\zh_cn_ui_main.js` 已通过 `node --check`。
- 最新一轮 `scripts/translate_ui.py` 命中 251 / 289。
- `scripts/validate.ps1` 通过：16,567 条消息，已翻译 16,352 条，覆盖率 98.7%。
- `2.0.6` 当前主日志再次出现：
  `Serving translated AI UI bundle: C:\\Users\\Administrator\\AppData\\Roaming\\Antigravity\\zh_cn_ui_main.js`

## 注意事项

- 不要假设 `2.0.0`、`2.0.1`、`2.0.6` 的目录结构相同。
- 不要再假设旧的 `resources/app/out` 一定存在。
- 本机的自动更新在退出时会触发静默升级，可能覆盖已打入的补丁。
