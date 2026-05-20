# 测试产物目录与测试文档 Spec

## Why
当前项目已具备生成终端截图图片的能力，但缺少统一的测试产物存放位置与配套测试记录文档，导致功能验收与回归检查不够直观。新增固定目录与测试文档后，可以更方便地人工检查图片效果，并沉淀测试内容、验收标准和测试结果。

## What Changes
- 在仓库根目录新增 `test-artifacts/` 目录，用于存放测试终端截图产物。
- 将 `test-artifacts/` 整体加入 `.gitignore`，避免测试图片产物进入版本控制。
- 新增一份测试文档，记录测试内容、验收标准、测试结果与对应产物位置。
- 生成一组基线测试截图产物，覆盖 stdin、文件输入、多页输出、主题与格式等 MVP 关键场景。

## Impact
- Affected specs: 测试产物管理、测试文档、MVP 验收可视化。
- Affected code: 仓库根目录结构、`.gitignore`、测试文档、测试产物目录内容。

## ADDED Requirements
### Requirement: 固定测试产物目录
系统 SHALL 在仓库根目录提供 `test-artifacts/` 目录，用于存放测试终端截图结果与相关验证产物。

#### Scenario: 生成测试截图
- **WHEN** 开发者执行测试或手工验收命令生成截图
- **THEN** 产物输出到 `test-artifacts/` 目录或其子目录中
- **AND** 目录命名与内容能反映测试场景

### Requirement: 忽略测试产物目录
系统 SHALL 将 `test-artifacts/` 整体加入 Git 忽略规则，避免生成的测试截图与临时产物被提交。

#### Scenario: 查看 Git 状态
- **WHEN** 开发者在仓库中生成测试截图后执行 Git 状态检查
- **THEN** `test-artifacts/` 下的产物不会作为待提交文件出现

### Requirement: 测试文档
系统 SHALL 提供一份测试文档，至少包含以下内容：
- 测试目标
- 测试内容
- 验收标准
- 测试结果
- 对应产物位置

#### Scenario: 进行人工验收
- **WHEN** 开发者查看测试文档
- **THEN** 能知道每个测试场景的验证方式
- **AND** 能通过文档找到对应截图产物
- **AND** 能根据验收标准判断功能是否完整

### Requirement: 基线测试覆盖
系统 SHALL 生成至少一组基线测试截图，覆盖 MVP 的关键路径：
- stdin 输入
- `--in <file>` 文件输入
- 多页输出
- `terminal` / `paper` 两个主题
- PNG / JPG 两种格式

#### Scenario: 检查 MVP 关键能力
- **WHEN** 开发者打开 `test-artifacts/` 并对照测试文档检查
- **THEN** 能看到覆盖关键路径的截图产物
- **AND** 能确认各场景输出文件存在且命名符合预期

## MODIFIED Requirements
### Requirement: 项目文档与测试交付物
项目文档体系 SHALL 补充面向人工验收的测试记录，而不仅依赖自动化测试输出。

## REMOVED Requirements
（无）

