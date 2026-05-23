# 安装说明

## 系统要求

- Windows 10/11 64-bit
- Antigravity 2.0.6 已安装
- PowerShell 5.1+

## 自动安装

```powershell
git clone https://github.com/kakarotto-baroko/antigravity-2.0-zhcn.git
cd antigravity-2.0-zhcn
powershell -ExecutionPolicy Bypass -File scripts/apply.ps1
```

脚本会自动：
1. 检测 Antigravity 安装目录
2. 备份原始文件
3. 应用稳定核心中文翻译
4. 提示重启 Antigravity

默认安装只启用稳定核心汉化，不启用 AI 面板前端补丁，避免版本不匹配时影响启动。

如需启用实验性的 AI 面板汉化：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply.ps1 -EnableAiUi
```

该模式会检查 Antigravity 版本和 UI bundle hash。若不匹配，将自动跳过 AI 面板补丁，只应用核心汉化。

AI 面板模式只把 `https://127.0.0.1:<port>/main.js` 重定向到本地 `agy-ui://bundle/main.js`，其余页面和 API 仍由 Antigravity 自带语言服务器提供。

## 版本现状

- `2.0.6`:
  当前脚本已兼容。它会优先从运行中的 Antigravity 会话抓取真实 `/main.js`，保存为本地缓存并校验哈希，命中后再启用 AI UI 汉化。
- 核心 VS Code 部分:
  由于 `2.0.6` 已不再沿用旧的 `resources/app/out` 结构，脚本会跳过不适用的旧路径注入，避免误改。

## 手动安装

### 1. 关闭 Antigravity

为释放 `app.asar` 文件锁，应用汉化前必须先彻底退出客户端。

### 2. 运行脚本

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply.ps1 -EnableAiUi
```

### 3. 重启 Antigravity

关闭并重新打开 Antigravity。

## 恢复英文

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply.ps1 -Restore
```

或手动：

```powershell
$agyPath = "$env:LOCALAPPDATA\Programs\Antigravity\resources\app\out"
Copy-Item "$agyPath\nls.messages.json.bak" "$agyPath\nls.messages.json"
```

## 故障排除

### 应用后界面显示异常
- 确认 Antigravity 版本为 `2.0.6`
- 尝试关闭客户端后重新运行 `scripts/apply.ps1 -EnableAiUi`
- 若主界面仍是英文，请确认主日志中出现 `Serving translated AI UI bundle`
- 版本与哈希状态以 [implementation_plan.md](/G:/GEMINI-xiangmu/AGY/AGY-汉化/implementation_plan.md) 为准

### Antigravity 更新后如何适配

```powershell
powershell -ExecutionPolicy Bypass -File scripts/extract.ps1 -Update
```

该命令会重新提取文本，并生成 `releases/version-update-report.json`。核心翻译通过 `scripts/validate.ps1` 后可继续使用；AI 面板汉化需要确认新版本 UI bundle 后，再更新 `patches/ai-ui-compat.json`。

### 部分文本未汉化
- AI 面板部分文本需要额外的补丁，参见补丁安装说明
- 部分扩展文本需要单独安装扩展翻译
