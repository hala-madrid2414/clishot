# clishot

把纯文本终端输出渲染成“伪终端截图”图片（PNG/JPG），用于实验报告等场景：不依赖真实截屏、不依赖终端窗口大小，支持自动换行与分页。

## 当前状态

`clishot` 的最基本功能已经形成可用闭环，也就是 V1 的 `Render-only` 能力已经实现：

- 支持从 stdin 读取文本
- 支持用 `--in <file>` 从文件读取文本
- 支持输出 PNG / JPG
- 支持 `terminal` / `paper` 两种主题
- 支持自动换行与多页输出
- 支持基础文本清洗（换行规范化、控制字符清理、`\r` 覆盖行处理）

当前还没有实现的能力：

- ANSI 颜色/粗体/下划线等样式还原
- 真实桌面终端截图
- 复杂 TUI 动态界面的高保真复现
- 一条命令执行并截图的 `run` 子命令

## 特性（V1 Render-only）

- 输入：stdin（管道/重定向）或 `--in <file>`
- 输出：PNG/JPG（默认 PNG）
- 排版：等宽字体、自动换行、按页分页输出多张图片
- 主题：`terminal` / `paper`
- 文本清洗：规范化换行、剔除不可见控制字符、对 `\r`（回车覆盖行）做确定性处理

不支持：ANSI 颜色/样式还原、真实窗口截图、复杂 TUI 动态刷新高保真复刻。

## 环境要求

- Node.js >= 18

## 安装与构建（本仓库）

```bash
npm install
npm run build
```

构建后可直接运行：

```bash
node dist/cli.js render --help
```

如果你希望全局直接使用 `clishot` 命令（本地开发）：

```bash
npm link
clishot render --help
```

## 用法

最常见的使用方式是两种：

- 已有输出文本文件：用 `--in`
- 命令输出直接出图：把 stdout/stderr 重定向或通过管道传给 `clishot`

### 从 stdin 渲染（推荐）

PowerShell：

```powershell
"hello`nworld" | clishot render --out out.png
```

或重定向：

```powershell
python .\script.py *> out.log
clishot render --in .\out.log --out out.png
```

如果你还没有执行 `npm link`，也可以直接这样运行：

```powershell
"hello`nworld" | node .\dist\cli.js render --out out.png
```

### 从文件渲染并分页

```bash
clishot render --in .\log.txt --out out.png --cols 100 --rows 40
```

说明：

- 当内容超过 `--rows` 时，会自动输出多张图片
- 如果 `--out` 是 `out.png`，多页时会生成 `out-001.png`、`out-002.png`……

### 中文与 Windows 编码

中文截图场景里，常见“乱码”通常来自 3 类原因：

- 输入源已经乱码：例如终端/脚本输出在采集阶段就被错误转码，文件里已经是 `ä¸­æ` 这类文本；这种情况需要重新采集，渲染阶段无法还原原文
- 文件解码方式不对：例如 PowerShell 5 常见重定向文件是 UTF-16LE，但后续工具误按 UTF-8 读取
- 字体缺字：文本本身没问题，但渲染时缺少可显示中文的字体，图片里变成方框、空白或统一缺字 glyph

`clishot` 已内置两层兼容：

- `--in <file>` 默认按 `auto` 自动识别常见编码，优先处理 UTF-8 / UTF-16LE / UTF-16BE
- 渲染阶段会为中文补充 CJK 字体回退链，尽量避免“有字节、没字形”

如果你知道输入文件的实际编码，也可以显式指定：

```powershell
clishot render --in .\capture-utf16.log --encoding utf-16le --out .\capture.png
clishot render --in .\capture-utf8.log --encoding utf-8 --out .\capture.png
clishot render --in .\legacy-cn.log --encoding gb18030 --out .\legacy-cn.png
```

### PowerShell 采集建议

优先建议直接走管道，把文本直接送进 `clishot`，这样最不容易在“先落盘、后读取”之间引入额外编码问题：

```powershell
& { .\build.ps1 *>&1 | Out-String } | clishot render --out .\build.png
```

如果必须先写入文件，再由 `clishot render --in` 读取，建议显式指定 PowerShell 的落盘编码：

PowerShell 5：

```powershell
& { .\build.ps1 *>&1 | Out-String } | Out-File -FilePath .\build-ps5.log -Encoding Unicode
clishot render --in .\build-ps5.log --out .\build-ps5.png
```

PowerShell 7：

```powershell
& { .\build.ps1 *>&1 | Out-String } | Set-Content -Path .\build-ps7.log -Encoding utf8
clishot render --in .\build-ps7.log --out .\build-ps7.png
```

说明：

- PowerShell 5 的 `Out-File -Encoding Unicode` 产物是 UTF-16LE，`clishot` 默认可自动识别；若你想显式指定，也可以加 `--encoding utf-16le`
- PowerShell 7 更推荐显式落盘为 UTF-8，便于和其他工具链统一
- 如果中间文件已经是乱码文本，`clishot` 只能如实渲染；需要先修正采集命令

### 输出 JPG + paper 主题

```bash
echo "hi" | clishot render --out out.jpg --format jpg --theme paper --jpg-quality 90
```

## 参数说明（render）

- `--in <file>`：从文件读取文本（不传则从 stdin 读取；stdin 是 TTY 时会报错）
- `--encoding <name>`：输入编码，默认 `auto`；可显式指定 `utf-8`、`utf-16le`、`gb18030` 等
- `--out <path>`：输出文件路径或前缀（必填）
- `--format <png|jpg>`：输出格式（默认 `png`）
- `--theme <terminal|paper>`：主题（默认 `terminal`）
- `--cols <number>`：最大列宽（字符数，默认 `100`）
- `--rows <number>`：每页最大行数（默认 `40`）
- `--font-size <number>`：字体大小 px（默认 `16`）
- `--line-height <number>`：行高倍数（默认 `1.35`）
- `--margin <number>`：边距 px（默认 `24`）
- `--tab-stop <number>`：tab 展开到的空格列宽（默认 `4`）
- `--jpg-quality <number>`：JPG 质量 1~100（默认 `90`）

## 文件名占位怎么写

README 里的下面两类写法都是占位符，你实际使用时要替换成自己的文件名：

- `<你的日志文件名>`：你要输入的文本文件名
- `<你的输出文件名>`：你要生成的图片文件名

通用模板：

```powershell
clishot render --in .\<你的日志文件名>.log --out .\<你的输出文件名>.png
```

实际示例：

```powershell
clishot render --in .\build-output.log --out .\build-output.png
```

如果你想输出到不被 Git 跟踪的目录，也可以这样写：

```powershell
clishot render --in .\test-artifacts\inputs\terminal-1-105.log --out .\test-artifacts\manual\terminal-1-105.png
```

说明：

- 输入文件扩展名不一定是 `.log`，也可以是 `.txt`
- 输出文件扩展名决定格式，比如 `.png` 或 `.jpg`
- 当内容过长发生分页时，`terminal-1-105.png` 会实际生成 `terminal-1-105-001.png`、`terminal-1-105-002.png`……

## 快速上手

### 场景 1：把脚本输出变成截图

```powershell
python .\demo.py *> demo.log
clishot render --in .\demo.log --out .\demo.png
```

### 场景 2：直接把命令输出通过管道转成截图

```powershell
Get-ChildItem . | Out-String | clishot render --out .\dir.png --theme terminal
```

### 场景 3：长输出自动分页

```powershell
node .\dist\cli.js render --in .\long.log --out .\long.png --cols 100 --rows 30
```

执行后如果内容超页，会得到：

- `long-001.png`
- `long-002.png`
- `long-003.png`

## 多页输出命名规则

当渲染结果超过 `--rows` 需要分页时：

- `--out out.png` → `out-001.png`, `out-002.png`, ...
- `--out out.jpg` → `out-001.jpg`, `out-002.jpg`, ...

## 中文排查步骤

遇到中文乱码、方框或“明明是中文却显示成 `????` / `ä¸­æ`”时，按下面顺序排查：

1. 先看原始输入文件

用编辑器或十六进制工具打开原文件；如果文件内容本身已经是乱码文本，说明问题发生在采集阶段，需要重跑 PowerShell/脚本采集命令。

2. 再确认读取编码

如果文件内容肉眼可读，但 `clishot render --in` 的结果不对，优先尝试显式指定：

```powershell
clishot render --in .\capture.log --encoding utf-8 --out .\capture.png
clishot render --in .\capture.log --encoding utf-16le --out .\capture.png
```

3. 最后检查字体覆盖

如果文字内容顺序正常，但图片里是方框或缺字，通常是系统缺少可用中文字体。Windows 上优先确认 `Microsoft YaHei UI`、`Microsoft YaHei`、`DengXian` 等字体可用。

4. 用基线产物对照

执行 `docs/test-artifacts-baseline.md` 中的中文基线命令，确认 UTF-8 与 UTF-16LE 两组样本在本机是否都能稳定出图。

## 验证方式

检查最基本功能是否可用，至少执行下面两步：

```bash
npm run build
npm test
```

如果你想手工验收生成效果，可查看：

- 测试文档：`docs/test-artifacts-baseline.md`
- 测试产物目录：`test-artifacts/`
- 中文基线目录：`test-artifacts/baseline/chinese/`

## 开发与测试

```bash
npm run typecheck
npm test
```
