# Tasks
- [x] Task 1: 建立测试产物目录约定
  - [x] 在仓库根目录创建 `test-artifacts/` 目录
  - [x] 设计目录内的最小结构，便于区分不同测试场景

- [x] Task 2: 配置 Git 忽略规则
  - [x] 将 `test-artifacts/` 整体加入 `.gitignore`
  - [x] 验证截图产物生成后不会出现在 Git 待提交列表中

- [x] Task 3: 生成基线测试截图产物
  - [x] 准备 stdin 输入场景的测试数据并生成截图
  - [x] 准备 `--in <file>` 输入场景的测试数据并生成截图
  - [x] 生成多页输出场景的截图
  - [x] 覆盖 `terminal` / `paper` 两种主题
  - [x] 覆盖 PNG / JPG 两种格式

- [x] Task 4: 编写测试文档
  - [x] 新增测试文档，包含测试目标、测试内容、验收标准、测试结果
  - [x] 在文档中记录每个测试场景对应的产物路径
  - [x] 在文档中明确哪些场景通过、依据是什么

- [x] Task 5: 验证交付物完整性
  - [x] 检查 `test-artifacts/` 目录结构与产物是否齐全
  - [x] 检查测试文档是否覆盖所有关键场景
  - [x] 检查 `.gitignore` 是否正确忽略测试产物目录

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 3
- Task 5 depends on Task 2
- Task 5 depends on Task 4
