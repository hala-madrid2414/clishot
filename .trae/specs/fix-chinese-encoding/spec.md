# 中文字符乱码修复 Spec

## Why
当前项目在中文场景下存在乱码或缺字问题，影响终端日志截图的可读性与可用性。已收集到的证据表明，问题来源不是单一模块，而是 Windows 终端采集编码、文件解码策略、以及渲染字体对中文覆盖不足三方面共同造成。

## What Changes
- 新增输入解码层：支持自动识别常见编码，并允许用户显式指定输入编码。
- 修复 Windows PowerShell 5 常见日志采集乱码问题，补充推荐采集方式与兼容策略。
- 优化渲染字体策略：为中文场景提供可用的 CJK 字体覆盖，避免出现方框/缺字。
- 新增中文回归测试与基线产物，覆盖 `stdin`、文件输入和 Windows 编码场景。
- 更新文档：明确乱码成因、推荐命令、编码参数和排查方式。

## Impact
- Affected specs: 输入源与编码、字体渲染、CLI 参数、测试与文档。
- Affected code: CLI 入口、输入读取/解码模块、字体加载模块、测试用例、README 与测试文档。

## ADDED Requirements
### Requirement: 输入编码识别与显式指定
系统 SHALL 在读取文本输入时支持编码识别与显式指定，避免将非 UTF-8 文本误按 UTF-8 解码导致乱码。

#### Scenario: 自动识别 UTF-16LE 文件
- **WHEN** 用户使用 Windows PowerShell 5 重定向生成日志文件
- **AND** 日志文件为 UTF-16LE（含 BOM 或可识别特征）
- **THEN** 系统自动按 UTF-16LE 解码
- **AND** 生成图片中的中文内容保持可读

#### Scenario: 用户显式指定输入编码
- **WHEN** 用户执行 `clishot render --in <file> --encoding <value>`
- **THEN** 系统按指定编码读取文本
- **AND** 指定值非法时返回可读错误信息与非 0 退出码

### Requirement: Windows 中文采集兼容性
系统 SHALL 为 Windows 中文终端采集提供可执行的兼容方案，避免用户直接拿到已乱码的日志文本。

#### Scenario: README 提供中文采集指导
- **WHEN** 用户查看项目文档
- **THEN** 能看到 PowerShell 5 / PowerShell 7 的推荐采集写法
- **AND** 能知道何时需要设置 UTF-8 或显式指定编码

### Requirement: 中文字体渲染可用性
系统 SHALL 在渲染阶段使用对中文友好的字体策略，避免中文字符显示为方框、缺字或空白。

#### Scenario: 渲染中文文本
- **WHEN** 输入文本中包含简体中文
- **THEN** 输出图片中的中文字符可见且可读
- **AND** 若首选字体不支持中文，系统应回退到支持中文的字体

### Requirement: 中文回归测试
系统 SHALL 提供覆盖中文场景的自动化测试与人工基线产物。

#### Scenario: 中文文件输入测试
- **WHEN** 自动化测试运行
- **THEN** 至少覆盖 UTF-8 中文输入与 Windows 常见编码中文输入
- **AND** 测试能证明 CLI 不会在读取阶段产生乱码

#### Scenario: 中文人工验收
- **WHEN** 开发者查看测试文档与测试产物
- **THEN** 能看到中文渲染结果
- **AND** 能按文档中的验收标准判断“可读/无乱码/无缺字”

## MODIFIED Requirements
### Requirement: 输入源与编码
系统 SHALL 在支持 `stdin` 与 `--in <file>` 两类输入的基础上，提供面向中文与 Windows 场景的编码兼容能力。

系统 SHOULD 默认采用自动识别策略；当自动识别不可靠时，用户 SHALL 能通过参数显式指定编码。

### Requirement: 主题与字体
系统 SHALL 在现有等宽文本渲染基础上，增加中文字体覆盖策略，以保证中英文混排时的基本可读性。

## REMOVED Requirements
（无）

