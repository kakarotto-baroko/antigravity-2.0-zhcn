# Antigravity 汉化项目 (AGY-ZH)

![Antigravity](https://img.shields.io/badge/Antigravity-2.0.x-blue.svg)
![Status](https://img.shields.io/badge/Status-Stable-brightgreen.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

为强大的 Antigravity 编辑器提供深度、安全的中文本地化支持。本项目不仅汉化了核心的基础服务，还通过安全定向拦截技术成功汉化了 AI UI 面板（包括设置、导航、应用等页面）。

## 🌟 核心特性

- **稳定可靠的基础汉化**：完美覆盖核心扩展及基础提示，让你在熟悉的母语环境里流畅编码。
- **安全的 AI UI 面板注射**：独创 `agy-ui://` 协议拦截替换，仅对 `/main.js` 做定向处理，彻底告别旧版本中可能遭遇的“启动卡死”问题。
- **高覆盖率的静态文案映射**：内置近 300 条深度人工校验规则，覆盖系统设置、智能体设置、本地权限、账号选项、快捷键说明等。
- **不损原貌的动态拼接**：主动放弃直接替换不可靠的动态变量（如项目名、实时生成文本），最大程度避免因字符串越界带来的应用功能损坏。
- **向后兼容预警机制**：配置了版本指纹（Hash）检测机制。当宿主引擎发生大版本更新时，可降级回退或快速定位补丁点。

## 📦 安装与使用

### 默认安装 (Stable Core)
仅应用基础核心语言包，不尝试干涉 AI 界面渲染，提供最稳固的使用体验。
```powershell
.\scripts\apply.ps1
```

### AI 面板深度汉化模式 (Enable AI UI)
开启基于 `agy-ui://` 的定向重定向机制，享受设置中心与主交互界面的中文体验。
```powershell
.\scripts\apply.ps1 -EnableAiUi
```

> **注意**：
> 当前主版本已升级至 `2.0.6`。`2.0.6` 已不再沿用旧的 `resources/app/out` 结构，核心 VS Code 部分不再适合老式覆盖方式。当前脚本会优先解析真实运行中的 UI bundle，并在命中兼容哈希后启用 AI UI 汉化。详见 [implementation_plan.md](implementation_plan.md) 与 [开发交接文档](docs/HANDOFF.md)。

## 🛠️ 项目结构

- `scripts/`
  - `apply.ps1` - 汉化应用入口与打包脚本。
  - `extract.ps1` - 提取工具，用于生成版本更新时的文本差异与哈希报告。
  - `translate_ui.py` - AI UI 面板核心词库与驱动引擎，通过字面量精确替换。
  - `bg_install.py` / `run_bg_install.bat` - 异步静默安装触发器。
- `patches/`
  - `customScheme.ai-ui.js` / `customScheme.core.js` - `main.js` 定向重写与网络拦截的核心补丁模板。
  - `ai-ui-compat.json` - 版本兼容性指纹记录档案库。
- `docs/`
  - `INSTALL.md` - 详细安装指南。
  - `CHANGELOG.md` - 变更记录。
  - `HANDOFF.md` - 给开发者的接力及状态说明文档。

## 💡 开发与参与

本项目基于 Python 和 PowerShell 实现无损替换与应用。如果你有兴趣为项目添砖加瓦：

1. **增补词汇**：请直接编辑 `scripts/translate_ui.py` 中的词库字典。请确保修改后能在本机通过 `node --check` 以及 `python -m py_compile` 的语法验证。
2. **适配新版**：我们在 `patches/ai-ui-compat.json` 中登记了已验证的文件指纹（Bundle Hash）。如果你在最新的 Antigravity 版本下提取了新的指纹，欢迎提交更新。

## 📄 授权与许可

本项目采用 MIT 协议开源。
本项目仅作为本地化辅助工具，提供给爱好者研究使用。Antigravity 商标及软件相关权利归属其原属公司。
