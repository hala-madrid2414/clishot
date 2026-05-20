# 中文乱码最小复现

本目录用于完成 `fix-chinese-encoding` 的 Task 1。

## 目录

- `collect-evidence.cjs`: 重新生成样本与 `evidence.json`
- `evidence.json`: 当前代码下的复现实验结果
- `outputs/*.png`: 当前代码渲染出的最小复现图片
- `samples/utf8-good.txt`: 正常 UTF-8 中文输入
- `samples/mojibake-literal.txt`: 输入内容本身已经乱码
- `samples/utf16le-bom.txt`: Windows PowerShell 5 常见 UTF-16LE BOM 文件
- `samples/font-missing.txt`: 用于复现中文字符渲染缺字

## 根因分类

### 1. 输入已乱码

样本：`samples/mojibake-literal.txt`

特征：

- 文件按 UTF-8 读取不会报错
- 读取结果已经是 `ä¸­ææµè¯`
- 这类问题发生在终端复制、选中、重定向之前的编码转换已经出错时

结论：

- 后续无论再按什么编码读取，系统都只能得到错误字符
- 这一类不属于 CLI 读取器修复范围，需要文档提示用户重新采集原始文本

### 2. 读取编码错误

样本：`samples/utf16le-bom.txt`

特征：

- 样本原始内容是 `中文测试`
- 当前代码在 [cli.ts](file:///f:/clishot/src/cli.ts#L23-L29) 和 [cli.ts](file:///f:/clishot/src/cli.ts#L95-L102) 中固定按 UTF-8 解码
- 将该文件强制按 UTF-8 读取后得到 `��-N�eKmՋ`

结论：

- 这是后续 Task 2 要解决的读取层问题
- 需要自动识别常见编码，并允许用户显式指定 `--encoding`

### 3. 字体缺失

样本：`samples/font-missing.txt`

特征：

- 当前字体链定义在 [typography.ts](file:///f:/clishot/src/render/typography.ts#L16-L29)
- 字体链只有 `JetBrains Mono` 与西文字体，没有 CJK 字体
- 对 `中`、`文`、`测` 单独栅格化后得到完全相同的图像哈希
- 该哈希同时等于替换字符 `�` 的图像哈希，说明中文被退化成同一个缺字字形

结论：

- 这是后续 Task 3 要解决的渲染层问题
- 需要补充可用的中文字体回退链

## 复现命令

先构建：

```powershell
npm run build
```

重新生成全部样本与证据：

```powershell
node .trae/specs/fix-chinese-encoding/repro/collect-evidence.cjs
```

用当前 CLI 渲染 UTF-8 中文：

```powershell
node dist/cli.js render --in .trae/specs/fix-chinese-encoding/repro/samples/utf8-good.txt --out .trae/specs/fix-chinese-encoding/repro/outputs/utf8-good.png --format png --theme terminal --cols 20 --rows 4
```

用当前 CLI 读取 UTF-16LE 文件，复现误解码：

```powershell
node dist/cli.js render --in .trae/specs/fix-chinese-encoding/repro/samples/utf16le-bom.txt --out .trae/specs/fix-chinese-encoding/repro/outputs/utf16le-misread.png --format png --theme terminal --cols 20 --rows 4
```

## 当前结论

- `samples/mojibake-literal.txt` 对应“输入已乱码”
- `samples/utf16le-bom.txt` 对应“读取编码错误”
- `samples/font-missing.txt` 对应“字体缺失”
- `samples/utf8-good.txt` 是后续修复与测试的正确对照组
