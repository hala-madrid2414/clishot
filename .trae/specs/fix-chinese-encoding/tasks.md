# Tasks
- [x] Task 1: 复现并锁定中文乱码根因
  - [x] 梳理当前乱码场景：终端选中文本、PowerShell 重定向文件、图片渲染缺字
  - [x] 确认哪些问题来自输入已乱码，哪些问题来自读取编码错误，哪些问题来自字体缺失
  - [x] 形成最小复现样本，作为后续测试输入

- [x] Task 2: 实现输入编码兼容
  - [x] 在读取 `--in <file>` 时增加编码识别与解码层
  - [x] 增加 `--encoding` 参数，支持用户显式指定输入编码
  - [x] 为非法编码值与解码失败场景提供可读错误信息

- [x] Task 3: 实现中文字体覆盖策略
  - [x] 调整字体选择逻辑，优先使用支持中文的字体或字体回退链
  - [x] 验证 `terminal` / `paper` 两种主题下中文均可读
  - [x] 确保字体调整不破坏现有英文场景输出

- [x] Task 4: 补齐中文测试与基线产物
  - [x] 增加中文输入自动化测试（UTF-8）
  - [x] 增加 Windows 常见重定向编码输入测试（至少覆盖 UTF-16LE）
  - [x] 生成中文基线截图产物，便于人工验收

- [x] Task 5: 更新文档与排查指南
  - [x] 在 README 中补充乱码成因说明
  - [x] 在 README 中补充 PowerShell 5 / 7 推荐采集方式
  - [x] 在 README 中补充 `--encoding` 示例与中文排查步骤

- [x] Task 6: 验证修复结果
  - [x] 运行构建与自动化测试
  - [x] 验证中文文件输入生成图片无乱码
  - [x] 验证中文基线产物与文档内容一致

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2
- Task 4 depends on Task 3
- Task 5 depends on Task 2
- Task 5 depends on Task 3
- Task 6 depends on Task 4
- Task 6 depends on Task 5
