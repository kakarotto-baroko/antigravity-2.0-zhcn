const fs = require('fs');
const path = require('path');

function toSingleQuoted(value) {
    const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `'${escaped}'`;
}

function applySafeLiteralReplacement(content, originalLiteral, translatedLiteral) {
    let forceGlobal = false;
    let isRaw = false;
    let actualOriginal = originalLiteral;
    if (originalLiteral.startsWith('GLOBAL:')) {
        forceGlobal = true;
        actualOriginal = originalLiteral.slice(7);
    } else if (originalLiteral.startsWith('RAW:')) {
        isRaw = true;
        actualOriginal = originalLiteral.slice(4);
    }
    
    let sourceValue, targetValue;
    if (isRaw) {
        sourceValue = actualOriginal;
        targetValue = translatedLiteral;
    } else {
        sourceValue = actualOriginal.slice(1, -1);
        targetValue = translatedLiteral.slice(1, -1);
    }
    
    let newContent = content;
    if (isRaw) {
        newContent = newContent.split(actualOriginal).join(translatedLiteral);
    } else if (forceGlobal || (sourceValue.includes(' ') && sourceValue.length > 12) || !actualOriginal.startsWith('"')) {
        newContent = newContent.split(actualOriginal).join(translatedLiteral);
        const altOriginal = actualOriginal.replace(/"/g, "'");
        const altTranslated = translatedLiteral.replace(/"/g, "'");
        if (altOriginal !== actualOriginal) {
            newContent = newContent.split(altOriginal).join(altTranslated);
        }
    } else {
        const keys = ['title', 'label', 'displayName', 'name', 'description', 'placeholder', 'aria-label', 'sectionTitle', 'tooltipText', 'tooltip', 'text'];
        for (const key of keys) {
            const rx1 = new RegExp(`\\b${key}\\s*:\\s*"${sourceValue}"`, 'g');
            newContent = newContent.replace(rx1, `${key}:"${targetValue}"`);
            const rx2 = new RegExp(`\\b${key}\\s*:\\s*'${sourceValue}'`, 'g');
            newContent = newContent.replace(rx2, `${key}:'${targetValue}'`);
        }
        
        const rx3 = new RegExp(`>${sourceValue}<`, 'g');
        newContent = newContent.replace(rx3, `>${targetValue}<`);
        
        const rx4 = new RegExp(`(,|null|\\{|\\})\\s*"${sourceValue}"\\s*(\\}|\\)|\\]|,)`, 'g');
        newContent = newContent.replace(rx4, `$1"${targetValue}"$2`);
        const rx5 = new RegExp(`(,|null|\\{|\\})\\s*'${sourceValue}'\\s*(\\}|\\)|\\]|,)`, 'g');
        newContent = newContent.replace(rx5, `$1'${targetValue}'$2`);
    }
    
    return [newContent, newContent !== content];
}

const args = process.argv.slice(2);
let inputFile = process.env.AGY_UI_MAIN_SOURCE || String.raw`C:\Users\Administrator\.gemini\antigravity\brain\a12d81c7-05e0-4def-b7bc-6e8543fed692\scratch\ui_main.js`;

if (args.includes('--input')) {
    inputFile = args[args.indexOf('--input') + 1];
}

const appdata = process.env.APPDATA;
if (!appdata) {
    console.error("Error: APPDATA environment variable not found.");
    process.exit(1);
}

const outputDir = path.join(appdata, "Antigravity");
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}
const outputFile = path.join(outputDir, "zh_cn_ui_main.js");

if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file ${inputFile} not found.`);
    process.exit(1);
}

console.log(`Reading from: ${inputFile}`);
let content = fs.readFileSync(inputFile, 'utf8');

const translations = {
        'label:"New Conversation"': 'label:"新建对话"',
        'label:"Create Project"': 'label:"创建项目"',
        'label:"Command Palette"': 'label:"命令面板"',
        'label:"Toggle Fullscreen"': 'label:"切换全屏"',
        'label:"Zoom In"': 'label:"放大"',
        'label:"Zoom Out"': 'label:"缩小"',
        'label:"Reset Zoom"': 'label:"重置缩放"',
        'label:"Toggle Developer Tools"': 'label:"开发者工具"',
        'label:"Minimize"': 'label:"最小化"',
        'label:"Maximize"': 'label:"最大化"',
        'label:"Close"': 'label:"关闭"',
        'label:"About"': 'label:"关于"',
        'label:"Check for Updates"': 'label:"检查更新"',
        'title:"File"': 'title:"文件"',
        'title:"View"': 'title:"视图"',
        'title:"Window"': 'title:"窗口"',
        '"Settings"': '"设置"',
        '"Project General"': '"项目常规"',
        '"Project Folders"': '"项目文件夹"',
        '"Project Agent"': '"项目智能体"',
        '"Account"': '"账户"',
        '"Google Drive"': '"谷歌云端硬盘"',
        '"General"': '"通用"',
        '"Appearance"': '"外观"',
        '"Chat Settings"': '"聊天设置"',
        '"Models"': '"模型"',
        '"Customizations"': '"自定义"',
        '"Browser"': '"浏览器"',
        '"App"': '"应用"',
        '"Permissions"': '"权限"',
        '"Notifications"': '"通知"',
        '"Editor"': '"编辑器"',
        '"Tab"': '"Tab"',
        '"Best of N"': '"Best of N"',
        '"Advanced"': '"高级"',
        '"Quota"': '"配额"',
        '"Browser Settings"': '"浏览器设置"',
        '"App Settings"': '"应用设置"',
        '"Best of N Settings"': '"Best of N 设置"',
        '"Shortcuts"': '"快捷键"',
        '"Folders"': '"文件夹"',
        '"Agent Settings"': '"智能体设置"',
        '"Security Preset"': '"安全预设"',
        '"Agent Behavior"': '"智能体行为"',
        '"Artifact Review Policy"': '"产物评审策略"',
        '"Local Permissions"': '"本地权限"',
        '"File Access Rules"': '"文件访问规则"',
        '"Network Access Rules"': '"网络访问规则"',
        '"MCP Tools"': '"MCP 工具"',
        '"Danger Zone"': '"危险区域"',
        '"Rules"': '"规则"',
        '"Terminal Commands"': '"终端命令"',
        '"Commands Outside Sandbox"': '"沙箱外命令"',
        '"Global"': '"全局"',
        '"File Reads"': '"文件读取"',
        '"File Writes"': '"文件写入"',
        '"Read URLs"': '"读取 URL"',
        '"Skills"': '"技能"',
        '"Custom"': '"自定义"',
        '"user_global"': '"用户全局"',
        '"Suggestions"': '"建议"',
        '"Navigation"': '"导航"',
        '"Context"': '"上下文"',
        '"Default Customizations"': '"默认自定义"',
        '"Customize Global Skills"': '"自定义全局技能"',
        '"Custom Agents"': '"自定义智能体"',
        '"MCP Servers"': '"MCP 服务器"',
        '"Actuation Permissions"': '"执行权限"',
        '"Browser Actuation Rules"': '"浏览器执行规则"',
        '"Enable Telemetry"': '"启用遥测"',
        '"Marketing Emails"': '"营销邮件"',
        '"Your Plan:"': '"当前套餐："',
        '"Upgrade"': '"升级"',
        '"Sign Out"': '"退出登录"',
        '"Email"': '"邮箱"',
        '"Terms of Service"': '"服务条款"',
        '"Conversations"': '"对话"',
        '"Not in Project"': '"未归属项目"',
        '"Workspaces"': '"工作区"',
        '"Show all"': '"显示全部"',
        '"Theme"': '"主题"',
        '"Keyboard Shortcuts"': '"快捷键"',
        '"No project selected or project management not available."': '"未选择项目，或项目管理不可用。"',
        '"Open Settings"': '"打开设置"',
        '"Open Keyboard Shortcuts"': '"打开快捷键列表"',
        '"No agents running"': '"当前没有运行中的智能体"',
        '"Folders"': '"文件夹"',
        '"Add Folder"': '"添加文件夹"',
        '"Agent Settings"': '"智能体设置"',
        '"Security Preset"': '"安全预设"',
        '"Unrestricted"': '"无限制"',
        '"Agent Behavior"': '"智能体行为"',
        '"Artifact Review Policy"': '"产物评审策略"',
        '"Local Permissions"': '"本地权限"',
        '"File Access Rules"': '"文件访问规则"',
        '"Network Access Rules"': '"网络访问规则"',
        '"MCP Tools"': '"MCP 工具"',
        '"Danger Zone"': '"危险区域"',
        '"Delete Project"': '"删除项目"',
        '"Open"': '"打开"',
        '"Learn more about Unrestricted"': '"了解更多关于“无限制”"',
        '"Learn more about "': '"了解更多关于 "',
        '"Rules"': '"规则"',
        '"Show 1 breakdown"': '"显示 1 项明细"',
        '"Terminal Commands"': '"终端命令"',
        '"Commands Outside Sandbox"': '"沙箱外命令"',
        '"Global"': '"全局"',
        '"File Reads"': '"文件读取"',
        '"File Writes"': '"文件写入"',
        '"Read URLs"': '"读取 URL"',
        '"Skills"': '"技能"',
        '"Custom"': '"自定义"',
        '"Hide breakdown"': '"隐藏明细"',
        '"No customizations found for this workspace."': '"当前工作区未找到任何自定义内容。"',
        '"user_global"': '"用户全局"',
        '"Suggestions"': '"建议"',
        '"Navigation"': '"导航"',
        '"Context"': '"上下文"',
        '"Advanced"': '"高级"',
        '"Quota"': '"配额"',
        '"Default Customizations"': '"默认自定义"',
        '"Customize Global Skills"': '"自定义全局技能"',
        '"Custom Agents"': '"自定义智能体"',
        '"MCP Servers"': '"MCP 服务器"',
        '"Actuation Permissions"': '"执行权限"',
        '"Browser Actuation Rules"': '"浏览器执行规则"',
        '"Configure allowed and denied URLs for browser actuation."': '"配置浏览器执行时允许和拒绝的 URL。"',
        '"Edit"': '"编辑"',
        '"Add"': '"添加"',
        '"Delete command"': '"删除命令"',
        '"Remove"': '"移除"',
        '"Cancel"': '"取消"',
        '"Allow List Terminal Commands"': '"允许列表终端命令"',
        '"Deny List Terminal Commands"': '"拒绝列表终端命令"',
        '"Agent Auto-Fix Lints"': '"智能体自动修复 Lint"',
        '"Enable Workspace API"': '"启用 Workspace API"',
        '"Confirm Window Reload"': '"确认窗口重载"',
        '"Enable Demo Mode (Beta)"': '"启用演示模式（Beta）"',
        '"Explain and Fix in Current Conversation"': '"在当前对话中解释并修复"',
        '"Strict Mode"': '"严格模式"',
        '"Agent Non-Workspace File Access"': '"智能体访问工作区外文件"',
        '"Enable Terminal Sandbox"': '"启用终端沙箱"',
        '"Sandbox Allow Network"': '"沙箱允许网络"',
        '"Enable Shell Integration"': '"启用 Shell 集成"',
        '"Terminal Command Auto Execution"': '"终端命令自动执行"',
        '"Agent Host Address"': '"智能体主机地址"',
        '"Review Policy"': '"评审策略"',
        '"Enable Sounds for Agent"': '"为智能体启用提示音"',
        '"Auto-Expand Changes Overview"': '"自动展开变更概览"',
        '"Knowledge"': '"知识库"',
        '"Auto-Open Edited Files"': '"自动打开已编辑文件"',
        '"Open Agent on Reload"': '"重载时打开智能体"',
        '"Suggestions in Editor"': '"编辑器内建议"',
        '"Tab to Jump"': '"Tab 跳转"',
        '"Tab to Import"': '"Tab 导入"',
        '"Tab Speed"': '"Tab 速度"',
        '"Highlight After Accept"': '"接受后高亮"',
        '"Tab Gitignore Access"': '"Tab 访问 .gitignore"',
        '"Browser Javascript Execution Policy"': '"浏览器 JavaScript 执行策略"',
        '"Chrome Binary Path"': '"Chrome 可执行文件路径"',
        '"Browser User Profile Path"': '"浏览器用户配置路径"',
        '"Browser CDP Port"': '"浏览器 CDP 端口"',
        '"Show Selection Actions"': '"显示选区操作"',
        '"Include Jetski Default Customizations"': '"包含 Jetski 默认自定义"',
        '"Prevent Sleep"': '"防止休眠"',
        '"Keep In Menu Bar"': '"保持在菜单栏中"',
        '"Enable Remote Control"': '"启用远程控制"',
        '"Disabled"': '"禁用"',
        '"Request Review"': '"请求评审"',
        '"Always Proceed"': '"始终继续"',
        '"Proceed in Sandbox"': '"在沙箱中继续"',
        '"Fast"': '"快速"',
        '"Slow"': '"慢速"',
        '"Terminal"': '"终端"',
        '"File Access"': '"文件访问"',
        '"Automation"': '"自动化"',
        '"History"': '"历史"',
        '"Sandboxed"': '"沙箱模式"',
        '"Strict"': '"严格模式"',
        '"Enabled"': '"已启用"',
        '"Value:"': '"值："',
        '"When enabled, Agent can interact with Google Workspace through the API to search and read documents."': '"启用后，智能体可以通过 API 与 Google Workspace 交互，搜索并读取文档。"',
        '"Toggle if a confirmation is shown when using the "Reload Window" button."': '"控制使用“重载窗口”按钮时是否显示确认提示。"',
        '"When enabled, "Explain and Fix" actions will continue in the current conversation instead of starting a new one."': '"启用后，“解释并修复”操作会在当前对话中继续，而不是新建对话。"',
        '"When enabled, terminal commands run with sandbox restrictions."': '"启用后，终端命令将在沙箱限制下运行。"',
        '"When enabled, sandboxed commands are allowed to make network requests."': '"启用后，沙箱中的命令可以发起网络请求。"',
        '"When enabled, Agent will use IDE\'s shell integration to detect and report terminal command execution. When disabled, the agent will use its own shell. Restart the application for this to take effect."': '"启用后，智能体会使用 IDE 的 Shell 集成来检测并报告终端命令执行情况。禁用后，智能体将使用自己的 Shell。重新启动应用后生效。"',
        '"When enabled, Agent will use IDE\'s shell integration to detect and report terminal command execution."': '"启用后，智能体会使用 IDE 的 Shell 集成来检测并报告终端命令执行情况。"',
        '"When enabled, Agent is given awareness of lint errors created by its edits and may fix them without explicit user prompting."': '"启用后，智能体会感知自身编辑产生的 Lint 错误，并可在无需明确提示的情况下修复。"',
        '"When enabled, the agent will be able to access past conversations to inform its responses."': '"启用后，智能体可以访问历史对话来辅助生成回复。"',
        '"Open files in the background if Agent creates or edits them"': '"当智能体创建或编辑文件时，在后台自动打开这些文件。"',
        '"To modify notification settings, open your operating system\'s system preferences."': '"若要修改通知设置，请打开操作系统的系统设置。"',
        '"Manage your plan, credentials, and general preferences."': '"管理你的套餐、凭据和通用偏好设置。"',
        '"When toggled on, Antigravity collects usage data to help Google enhance performance and features."': '"开启后，Antigravity 会收集使用数据，以帮助 Google 改进性能和功能。"',
        '"Receive product updates, tips, and promotions from Google Antigravity via email."': '"通过电子邮件接收来自 Google Antigravity 的产品更新、技巧和推广信息。"',
        '"You can upgrade to a Google AI Ultra plan to receive the highest rate limits."': '"你可以升级到 Google AI Ultra 套餐，以获得最高的速率限制。"',
        '"By using this app, you agree to its"': '"使用此应用即表示你同意其"',
        '"Open Agent panel on window reload"': '"窗口重载时打开智能体面板。"',
        '"Allows the agent to access files outside of your current workspace."': '"允许智能体访问当前工作区之外的文件。"',
        '"Agent cannot modify files outside of the workspace in strict mode."': '"在严格模式下，智能体无法修改工作区之外的文件。"',
        '"Agent will always ask to review in strict mode."': '"在严格模式下，智能体始终会请求评审。"',
        '"Show suggestions when typing in the editor."': '"在编辑器输入时显示建议。"',
        '"Quickly add and update imports with a tab keypress."': '"通过按下 Tab 键快速添加和更新导入。"',
        '"Set the speed of tab suggestions"': '"设置 Tab 建议的显示速度。"',
        '"Highlight newly inserted text after accepting a Tab completion."': '"接受 Tab 补全后高亮新插入的文本。"',
        '"Controls whether the agent can run custom JavaScript to automate complex browser actions."': '"控制智能体是否可以运行自定义 JavaScript 来自动化复杂的浏览器操作。"',
        '"Path to the Chrome/Chromium executable. Leave empty for auto-detection."': '"Chrome/Chromium 可执行文件路径。留空则自动检测。"',
        '"Custom path for the browser user profile directory. Leave empty for default (~/.gemini/antigravity-browser-profile)."': '"浏览器用户配置目录的自定义路径。留空则使用默认值（~/.gemini/antigravity-browser-profile）。"',
        '"Port number for Chrome DevTools Protocol remote debugging. Leave empty for default (9222)."': '"Chrome DevTools Protocol 远程调试端口。留空则使用默认值（9222）。"',
        '"Show "Edit" and "Chat" buttons when selecting text in the editor."': '"在编辑器中选中文本时显示“编辑”和“聊天”按钮。"',
        '"When enabled, the agent will include default customizations, including default skills."': '"启用后，智能体会包含默认自定义内容，包括默认技能。"',
        '"Prevent the computer from sleeping while the app is running."': '"在应用运行期间阻止计算机进入睡眠。"',
        '"The app will be accessible from the menu bar and will keep running in the background when all windows are closed."': '"应用可从菜单栏访问，并会在所有窗口关闭后继续在后台运行。"',
        '"If enabled, you can manage your conversations from the Antigravity website. Please reload the application to apply this setting."': '"启用后，你可以在 Antigravity 网站上管理对话。请重新加载应用以使设置生效。"',
        '"Configure the browser subagent. It requires"': '"配置浏览器子智能体。它需要"',
        '"to be installed. The browser subagent can be invoked by typing /browser in the conversation input box."': '"已安装。可在对话输入框中输入 /browser 来调用浏览器子智能体。"',
        '"No permissions configured."': '"尚未配置任何权限。"',
        '"Controls whether terminal commands require your approval before running."': '"控制终端命令在执行前是否需要你的批准。"',
        '"Restricts agent tools to a secure, isolated local sandbox."': '"将智能体工具限制在安全、隔离的本地沙箱中。"',
        '"Agents run in a secure sandbox that restricts access to external resources outside of your trusted folders."': '"智能体会在安全沙箱中运行，限制其访问受信任文件夹之外的外部资源。"',
        '"Terminal commands always require review and the agent cannot access files outside of its given workspaces."': '"终端命令始终需要评审，且智能体无法访问其指定工作区之外的文件。"',
        '"Execute URLs"': '"执行 URL"',
        '"Allow/deny agent browser actuation access to specific URLs."': '"允许或拒绝智能体对特定 URL 执行浏览器操作。"',
        '"Allow/deny agent read access to specific files or directories."': '"允许或拒绝智能体读取特定文件或目录。"',
        '"Allow/deny agent write access to specific files or directories."': '"允许或拒绝智能体写入特定文件或目录。"',
        '"Allow/deny agent read access to specific URLs or domains."': '"允许或拒绝智能体读取特定 URL 或域名。"',
        '"Allow/deny specific terminal commands."': '"允许或拒绝特定终端命令。"',
        '"Allow/deny agent command execution outside the sandbox."': '"允许或拒绝智能体在沙箱外执行命令。"',
        '"External tools the agent can call via Model Context Protocol."': '"智能体可通过 Model Context Protocol 调用的外部工具。"',
        '"e.g., /path/to/file"': '"例如：/path/to/file"',
        '"e.g., https://example.com"': '"例如：https://example.com"',
        '"e.g., npm test"': '"例如：npm test"',
        '"e.g., curl"': '"例如：curl"',
        '"Enter tool name or server..."': '"输入工具名称或服务器..."',
        '"Inherits from"': '"继承自"',
        '"global settings"': '"全局设置"',
        '". Local permissions have higher priority."': '"。本地权限具有更高优先级。"',
        '"Learn more about"': '"了解更多关于"',
        '"Manage project folders, agent settings, and permissions."': '"管理项目文件夹、智能体设置和权限。"',
        '"Choose a predefined security preset for the agent. This controls terminal auto-execution policy, and file access policy."': '"为智能体选择预定义的安全预设。它会控制终端自动执行策略和文件访问策略。"',
        '"Specifies Agent\'s behavior when asking for review on artifacts, which are documents it creates to enable a richer conversation experience."': '"指定智能体在请求评审产物时的行为。产物是它为提供更丰富对话体验而创建的文档。"',
        '"Inherits from global settings. Local permissions have higher priority. Learn more."': '"继承全局设置。本地权限具有更高优先级。了解更多。"',
        '"Inherits from global settings. Local permissions have higher priority. "': '"继承全局设置。本地权限具有更高优先级。"',
        '"Learn more."': '"了解更多。"',
        '"Configure allowed and denied paths for file reads and writes."': '"配置文件读写时允许和拒绝的路径。"',
        '"Configure allowed and denied URLs for reading."': '"配置读取时允许和拒绝的 URL。"',
        '"Configure allowed terminal commands."': '"配置允许的终端命令。"',
        '"Configure allowed commands outside the sandbox."': '"配置沙箱外允许执行的命令。"',
        '"Configure external tools via Model Context Protocol."': '"通过 Model Context Protocol 配置外部工具。"',
        '"The breakdown below shows token usage from customizations like skills, rules, and MCP. If the budget is exceeded, large customizations will be truncated automatically."': '"下方明细显示技能、规则、MCP 等自定义内容的 token 使用情况。如果超出预算，较大的自定义内容会被自动截断。"',
        '"of the customization budget is available."': '"的自定义预算仍可用。"',
        '"The customization budget is available."': '"自定义预算仍可用。"',
        '"Permanently delete this project and all of its conversations."': '"永久删除该项目及其所有对话。"',
        '"Getting started with a Project"': '"项目入门指南"',
        '"Now that you\'ve created a project, configure your project\'s agent settings or start a conversation."': '"项目创建成功！现在可以配置项目智能体设置，或者直接开始对话。"',
        '"Learn more"': '"了解更多"',
        '"Learn More"': '"了解更多"',
        '"Submit"': '"提交"',
        '"Continue"': '"继续"',
        '"Cancel"': '"取消"',
        '"Quit"': '"退出"',
        '"Approve"': '"批准"',
        '"Reject"': '"拒绝"',
        '"Allow"': '"允许"',
        '"Deny"': '"拒绝"',
        '"Completed"': '"已完成"',
        '"Task"': '"任务"',
        '"running"': '"运行中"',
        '"Running"': '"运行中"',
        '"completed"': '"已完成"',
        '"Approved"': '"已批准"',
        '"Requested change"': '"请求变更"',
        '"Denied"': '"已拒绝"',
        '"Action Required"': '"需要操作"',
        '"Completed Operations"': '"已完成操作"',
        '"Walkthrough"': '"任务演练"',
        '"Review"': '"评审"',
        '"Wait"': '"等待"',
        'Learn more about ': '了解更多关于 ',
        'Inherits from global settings. Local permissions have higher priority. ': '继承全局设置。本地权限具有更高优先级。',
        'of the customization budget is available.': '的自定义预算仍可用。',
        'Rules\n(1.6%)': '规则\n(1.6%)',
        'Show 1 breakdown': '显示 1 项明细',
        'Learn more about Unrestricted': '了解更多关于无限制',
        'Learn more about 无限制': '了解更多关于无限制',
        'Inherits from global settings. Local permissions have higher priority. 了解更多.': '继承全局设置。本地权限具有更高优先级。了解更多。',
        '"Turbo mode"': '"Turbo 模式"',
        '"Turbo Mode"': '"Turbo 模式"',
        '"Requires manual review for all terminal commands and file accesses outside of the working folders."': '"所有终端命令以及对工作文件夹外部的文件访问都需要手动评审。"',
        '"All terminal commands require review. The agent can read or write to any file in the machine."': '"所有终端命令都需要评审。智能体可以读写本机上的任何文件。"',
        '"Disables all safety barriers for maximal iteration velocity."': '"禁用所有安全屏障以获得最大迭代速度。"',
        '"Custom"': '"自定义"',
        '"Default"': '"默认"',
        '"Full Machine"': '"完整系统权限"',
        '"collects usage data to help Google enhance performance and features."': '"收集使用数据，以帮助 Google 改进性能和功能。"',
        '"Receive product updates, tips, and promotions from Google "': '"接收来自 Google "',
        '" via email."': '" 的产品更新、提示和促销信息（通过电子邮件）。"',
        '"Your Plan: Google AI Pro"': '"当前套餐：Google AI Pro"',
        '"You can upgrade to a Google AI Ultra plan to receive the highest rate limits."': '"您可以升级到 Google AI Ultra 套餐，以获得最高的速率限制。"',
        '"Project-Specific Settings"': '"项目特定设置"',
        '"Modify scoped permissions, folders, and agent settings like Sandbox and Terminal Command Execution."': '"修改作用域权限、文件夹以及沙箱和终端命令执行等智能体设置。"',
        '"Go To Projects"': '"转到项目"',
        '"Configure global allowed and denied resource permissions."': '"配置全局允许和拒绝的资源权限。"',
        '"Configure global allowed and denied resource permissions. "': '"配置全局允许和拒绝的资源权限。"',
        '"Configure the agent\'s visual theme and display preferences."': '"配置智能体的视觉主题和显示偏好。"',
        '"Select light, dark, or inherit system settings."': '"选择浅色、深色或跟随系统设置。"',
        '"Light Theme"': '"浅色主题"',
        '"Dark Theme"': '"深色主题"',
        '"Configure AI models and view your quota."': '"配置 AI 模型并查看您的配额。"',
        '"Refresh"': '"刷新"',
        '"Model Credits"': '"模型额度"',
        '"Enable AI Credit Overages"': '"启用 AI 额度超额"',
        '"When toggled on, Antigravity will use your AI credits to fulfill model requests once you\'re out of model quota. Antigravity will always use your model quota first before using AI credits."': '"开启后，当模型配额用尽时，Antigravity 将使用您的 AI 额度来处理请求。系统将始终优先消耗模型配额。"',
        '"Model Quota"': '"模型配额"',
        '"Refreshes in "': '"刷新倒计时 "',
        'GLOBAL:"Projects"': '"项目"',
        'GLOBAL:"Provide Feedback"': '"提供反馈"',
        'label:"New Conversation"': 'label:"新建对话"',
        'label:"Create Project"': 'label:"创建项目"',
        'label:"Command Palette"': 'label:"命令面板"',
        'label:"Toggle Fullscreen"': 'label:"切换全屏"',
        'label:"Zoom In"': 'label:"放大"',
        'label:"Zoom Out"': 'label:"缩小"',
        'label:"Reset Zoom"': 'label:"重置缩放"',
        'label:"Toggle Developer Tools"': 'label:"开发者工具"',
        'label:"Minimize"': 'label:"最小化"',
        'label:"Maximize"': 'label:"最大化"',
        'label:"Close"': 'label:"关闭"',
        'label:"About"': 'label:"关于"',
        'label:"Check for Updates"': 'label:"检查更新"',
        'title:"File"': 'title:"文件"',
        'title:"View"': 'title:"视图"',
        'title:"Window"': 'title:"窗口"',
        '"New Conversation"': '"新建对话"',
        '"Scheduled Tasks"': '"计划任务"',
        '"Conversation History"': '"历史对话"',
        'GLOBAL:"Conversations"': '"对话"',
        '"Ask anything, @ to mention"': '"问任何问题，输入 @ 提及"',
        '", / for actions"': '"，输入 / 执行操作"',
        'GLOBAL:"Local"': '"本地"',
        'GLOBAL:"Open IDE"': '"打开 IDE"',
        
        // Final missing sections
        'GLOBAL:"Manage application settings."': '"管理应用程序设置。"',
        'GLOBAL:"Notification Settings"': '"通知设置"',
        'GLOBAL:"Open System Preferences"': '"打开系统设置"',
        'RAW:,"Notifications")': ',"通知")',
        'RAW:Your Plan: ': '当前套餐：',
        'RAW:You can upgrade to a ': '您可以升级到 ',
        'RAW: plan to receive the highest rate limits.': ' 套餐，以获得最高的速率限制。',
        'RAW:When toggled on, ': '开启后，',
        'RAW: collects usage data to help Google enhance performance and features.': ' 收集使用数据，以帮助 Google 改进性能和功能。',
        'RAW: will use your AI credits to fulfill model requests once you\'re out of model quota. ': ' 当模型配额用尽时，将使用您的 AI 额度来处理请求。',
        'RAW: will always use your model quota first before using AI credits': ' 将始终优先消耗模型配额。',
        'RAW:Receive product updates, tips, and promotions from Google ': '接收来自 Google ',
        'RAW: via email.': ' 的产品更新、提示和促销信息（通过电子邮件）。',
        'RAW:Refreshes in ': '刷新倒计时 ',
        
        // Customizations tab
        'GLOBAL:"Configure default behaviors, skills, and MCP servers. "': '"配置默认行为、技能和 MCP 服务器。"',
        'GLOBAL:"Token Usage"': '"Token 使用情况"',
        'GLOBAL:"Installed MCP Servers"': '"已安装的 MCP 服务器"',
        'GLOBAL:"Add MCP +"': '"添加 MCP +"',
        'GLOBAL:"Refresh"': '"刷新"',
        'GLOBAL:"No MCP Servers"': '"没有 MCP 服务器"',
        'GLOBAL:"You currently don\'t have any MCP Servers installed. Add an MCP server above"': '"您目前尚未安装任何 MCP 服务器。请在上方添加 MCP 服务器"',
        'GLOBAL:"Build With Google Plugins"': '"使用 Google 插件构建"',
        'GLOBAL:"Customize"': '"自定义"',
        
        // Final batch 3
        'RAW:Configure default behaviors, skills, and MCP servers.': '配置默认行为、技能和 MCP 服务器。',
        'RAW:View your available model quota and AI credits. Model quota refreshes periodically based on your plan. Enable AI Credit Overages to continue using models when your quota is exhausted.': '查看可用模型配额和 AI 额度。模型配额将根据您的套餐定期刷新。开启 AI 额度超额以在配额耗尽后继续使用模型。',
        'RAW:Verbose agent chat': '显示详细思考过程',
        'RAW:Display and preserve intermediate thinking steps': '在聊天中显示并保留智能体的中间思考步骤',
        'RAW:File Permissions': '文件访问权限',
        'RAW:Network Permissions': '网络访问权限',
        'RAW:Terminal & Tooling Permissions': '终端与工具权限',
        'RAW:Go to Projects': '前往项目设置',
        'GLOBAL:"Custom"': '"自定义"',
        'GLOBAL:"Full machine"': '"完全访问 (Full Machine)"',
        'GLOBAL:"Manually customize individual settings."': '"手动自定义各项设置。"',
        'GLOBAL:"Add Context"': '"添加上下文"',
        'label:"Media"': 'label:"媒体"',
        'label:"Mentions"': 'label:"提及"',
        'label:"Actions"': 'label:"操作"',
        'GLOBAL:"New Worktree"': '"新建 Worktree"',
        'GLOBAL:"New Workspace"': '"新建 Workspace"',
        'GLOBAL:"Worktrees are available for Git repositories"': '"Worktree 仅适用于 Git 仓库"',
        'GLOBAL:"Worktrees are not available for this project"': '"此项目不支持 Worktree"',
        'GLOBAL:"Workspaces are not available for this project"': '"此项目不支持 Workspace"',
        'GLOBAL:"The associated worktree will also be deleted."': '"关联的 Worktree 也将被删除。"',
        'GLOBAL:"Run in a new git worktree"': '"在全新的 Git Worktree 中运行"',
        'GLOBAL:"Previous Worktrees"': '"历史 Worktree"',
        'GLOBAL:"Previous Workspaces"': '"历史 Workspace"',
        'GLOBAL:"Select Project"': '"选择项目"',
        'GLOBAL:"New Project"': '"新建项目"',
        'GLOBAL:"Quick Start"': '"快速开始"',
        'GLOBAL:"No Project"': '"无项目"'
};

let replacedCount = 0;
for (const [original, translated] of Object.entries(translations)) {
    const res = applySafeLiteralReplacement(content, original, translated);
    content = res[0];
    if (res[1]) replacedCount++;
}

console.log(`Replaced ${replacedCount} of ${Object.keys(translations).length} strings.`);
fs.writeFileSync(outputFile, content, 'utf8');
console.log("Translation completed successfully!");
