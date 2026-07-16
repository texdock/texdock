<div align="center">

# 📝 TeXDock

**基于 Overleaf Community Edition 的中文本地化发行版，支持 TeX Live 和 CJK 字体**

TeXDock 是 Overleaf Community Edition 的非官方发行与实验性扩展版本。
提供中文界面、完整 TeX Live 镜像、CJK 字体兼容、Full Image 部署模式，以及可选的 Sandbox 编译模式。

![Docker](https://img.shields.io/badge/docker-ready-blue?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-AGPL--3.0-green)
![TeX Live](https://img.shields.io/badge/TeX%20Live-2026-blue)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20x86__64-lightgrey)

本项目基于 [Overleaf Community Edition](https://github.com/overleaf/overleaf) 修改，遵循 [AGPL-3.0](LICENSE) 许可证发布。
TeXDock 不是 Overleaf 官方项目。

</div>

---

## 概览

TeXDock 提供两种部署模式：

| 模式 | 镜像 | TeX Live 位置 | Docker socket | 适用场景 |
|------|------|---------------|---------------|----------|
| Full 模式 | `texdock/sharelatex-full-fonts` | 主容器内 | 不需要 | 简单本地/局域网部署 |
| Sandbox 模式 | `texdock/sharelatex-web` + `texdock/texlive` | 独立编译容器 | 需要 | 编译隔离实验 |

请勿在同一 Compose 栈中混合使用两种模式。

---

## 镜像说明

### Full 模式镜像（推荐）

Full 镜像将 Overleaf CE、TeX Live、CJK 字体和辅助脚本打包在一个容器中：

```text
texdock/sharelatex-full-fonts:<version>
texdock/sharelatex-full-fonts:latest
```

包含内容：
- Overleaf Community Edition
- TeX Live scheme-full
- 开源 CJK 字体（Noto CJK、文泉驿等）
- 私有 Windows 字体（宋体 SimSun、黑体 SimHei、仿宋 FangSong、楷体 KaiTi），通过 `fonts.zip` 导入
- Fontconfig 字体别名，兼容常见 Windows 字体名称

### Sandbox 模式镜像

Sandbox 模式使用两个镜像：

```text
texdock/sharelatex-web:latest
texdock/texlive:2026.1
```

Web 镜像不包含 TeX Live。每次 LaTeX 编译在独立的 TeXLive 容器中运行。

---

## 部署

### Full 模式部署

```bash
# 克隆仓库
git clone https://github.com/texdock/texdock.git
cd texdock

# 创建环境文件
cp .env.example .env
# 编辑 .env（设置 TEXDOCK_OVERLEAF_DATA_DIR 等）

# 启动服务
docker compose --env-file .env up -d
```

### Sandbox 模式部署

```bash
# 克隆仓库
git clone https://github.com/texdock/texdock.git
cd texdock

# 创建环境文件
cp .env.sandbox.example .env.sandbox
# 编辑 .env.sandbox（设置宿主机路径等）

# 初始化宿主机目录
./scripts/init-host-dirs.sh .env.sandbox

# 启动服务
docker compose --env-file .env.sandbox -f docker-compose.sandbox.yml up -d
```

---

## 构建

### 前置条件

- 启用 BuildKit 的 Docker
- `scripts/fonts/private/fonts.zip`（用于 Windows 字体支持）

### 构建 Full 镜像链

```bash
export IMAGE_NAMESPACE=texdock
export VERSION=$(cat VERSION)

# 步骤 1：基础镜像
docker build -f server-ce/Dockerfile-base \
  --build-arg TEXDOCK_VERSION="$VERSION" \
  -t "$IMAGE_NAMESPACE/sharelatex-base:$VERSION" \
  -t "$IMAGE_NAMESPACE/sharelatex-base:latest" .

# 步骤 2：Community Edition 镜像
docker build -f server-ce/Dockerfile \
  --build-arg TEXDOCK_VERSION="$VERSION" \
  --build-arg OVERLEAF_BASE_TAG="$IMAGE_NAMESPACE/sharelatex-base:$VERSION" \
  -t "$IMAGE_NAMESPACE/sharelatex:$VERSION" \
  -t "$IMAGE_NAMESPACE/sharelatex:latest" .

# 步骤 3：TeX Live 完整镜像
docker build -f server-ce/Dockerfile-full \
  --build-arg TEXDOCK_VERSION="$VERSION" \
  --build-arg BASE_IMAGE="$IMAGE_NAMESPACE/sharelatex:$VERSION" \
  -t "$IMAGE_NAMESPACE/sharelatex-full:$VERSION" \
  -t "$IMAGE_NAMESPACE/sharelatex-full:latest" .

# 步骤 4：Windows 字体叠加层（可选，需要 fonts.zip）
docker build -f server-ce/Dockerfile-windows-fonts \
  --build-arg TEXDOCK_VERSION="$VERSION" \
  --build-arg BASE_IMAGE="$IMAGE_NAMESPACE/sharelatex-full:$VERSION" \
  -t "$IMAGE_NAMESPACE/sharelatex-full-fonts:$VERSION" \
  -t "$IMAGE_NAMESPACE/sharelatex-full-fonts:latest" .
```

### 构建 Sandbox 镜像

```bash
docker build -f server-ce/Dockerfile-sandbox-web \
  -t "$IMAGE_NAMESPACE/sharelatex-web:latest" .

docker build -f server-ce/Dockerfile-sandbox-texlive \
  --build-arg TEXLIVE_REPOSITORY=https://mirrors.tuna.tsinghua.edu.cn/CTAN/systems/texlive/tlnet \
  -t "$IMAGE_NAMESPACE/texlive:2026.1" .
```

---

## 功能特性

- 中文界面默认（zh-CN）
- 完整 TeX Live 镜像（scheme-full）
- 开源 CJK 字体（Noto CJK、文泉驿等）
- 私有 Windows 字体（宋体、黑体、仿宋、楷体）通过 fonts.zip 导入
- Fontconfig 字体别名，兼容常见 Windows 字体名称
- SMTP 邮件配置支持
- LDAP 认证配置支持
- 可选的管理员扩展功能
- 可选的修订跟踪扩展功能
- 可选的 Sandbox 编译模式（使用独立 TeXLive 容器）

---

## 从 ShareLaTeX 6.2.1 选择性回移

TeXDock 从 ShareLaTeX 6.2.1 选择性回移了以下 bug 修复和安全修复：

| 编号 | 标题 | 服务 |
|------|------|------|
| REL-001 | handleApiError headers-sent 保护 | web |
| BUG-004 | LatexRunner 从 stdout 检测运行次数 | clsi |
| BUG-005 | Minted 目录正则修复 | clsi |
| SEC-001 | 密码控制字符清理 | web |
| SEC-004 | OT update.doc 字段验证 | real-time |

详见 `docs/backports/sharelatex-6.2.1/pilot-1/`。

---

## 许可证

本项目基于 Overleaf Community Edition，遵循 AGPL-3.0 许可证发布。

详见 [LICENSE](LICENSE)。
