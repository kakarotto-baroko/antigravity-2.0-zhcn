# Antigravity 2.0.6 当前实施状态

## 当前版本

- 当前桌面客户端版本：`Antigravity 2.0.6`
- 当前 AI UI 兼容签名：
  `B5B9843AEC0237B1A76CA2DB604A71EF6396AFE7E6878EFFBC07D21F1A8EA3E6`
- 当前 AI UI 兼容信息已登记在：
  `patches/ai-ui-compat.json`

## 结构变化

- `2.0.6` 不再适用旧的 `2.0.0` / `2.0.1` 那套 `resources/app/out` 结构。
- 当前核心 VS Code 部分不再强行覆盖旧布局文件，`scripts/apply.ps1` 已改为：
  - 核心 NLS 若不适用当前目录结构，则跳过旧路径注入
  - AI UI 仍通过 `app.asar` 内的 `customScheme.ai-ui.js` 接管 `/main.js`

## 当前脚本状态

- `scripts/apply.ps1` 现在已兼容 `2.0.6`
- 它会优先解析真实运行中的 `2.0.6` UI bundle：
  - 从当前运行客户端的本地端口抓取 `/main.js`
  - 保存到本地临时缓存
  - 校验哈希是否命中 `patches/ai-ui-compat.json`
- 因此，不再依赖旧的 `scratch\\ui_main.js` 才能成功启用 AI UI

## 为什么会“看起来像闪退”

- 在执行 `scripts/apply.ps1` 时，脚本为了覆盖 `app.asar`，必须先释放文件锁。
- 所以会在 `Stop-OrFailIfRunning` 中检测 `Antigravity` 是否仍在运行。
- 如果客户端没关，脚本会提示你先关闭客户端；若你选择强制结束，它会调用：
  `Stop-Process -Name "Antigravity" -Force`
- 这个行为是正常文件锁释放流程，不是程序崩溃。

## 标准部署方式

请先彻底关闭 Antigravity 客户端，然后在项目根目录执行：

```powershell
powershell -ExecutionPolicy Bypass .\scripts\apply.ps1 -EnableAiUi
```

## 本机验证事实

- 当前运行日志已验证：
  `Starting app (v2.0.6) ...`
- 当前主日志已验证：
  `Serving translated AI UI bundle: C:\Users\Administrator\AppData\Roaming\Antigravity\zh_cn_ui_main.js`
- `scripts/apply.ps1` 已能在 `2.0.6` 下自动识别真实 UI bundle 来源

## 附加说明

- 如果执行时仍提示客户端正在运行，请先手动完全退出 Antigravity，再重试一次。
- 当前 `%APPDATA%\Antigravity\zh_cn_ui_main.js` 与 `2.0.6` 兼容。
- 若后续官方继续升级版本，需要重新抓取新版本 `/main.js` 并更新：
  `patches/ai-ui-compat.json`
