<div align="center">

# 📝 TeXDock

**A Chinese-localized Overleaf Community Edition distribution with TeX Live and CJK support**

基于 Overleaf Community Edition 的非官方发行与实验性扩展版本。
提供中文界面、完整 TeX Live 镜像、CJK 字体兼容、full image 部署模式，以及可选的 sibling TeXLive sandbox 编译模式。

![Docker](https://img.shields.io/badge/docker-ready-blue?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-AGPL--3.0-green)
![TeX Live](https://img.shields.io/badge/TeX%20Live-2026-blue)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20x86__64-lightgrey)

本项目基于 [Overleaf Community Edition](https://github.com/overleaf/overleaf) 修改，遵循 [AGPL-3.0](LICENSE) 许可证发布。
TeXDock 不是 Overleaf 官方项目。

</div>

---

## Overview

TeXDock provides two deployment modes:

| Mode | Image | TeX Live location | Docker socket | Use case |
|------|-------|-------------------|---------------|----------|
| Full image | `texdock/sharelatex-full-fonts` | Inside the main container | Not required | Simple local/LAN deployment |
| Sandbox mode | `texdock/sharelatex-web` + `texdock/texlive` | Sibling compile container | Required | Compile isolation experiments |

Do not mix the two modes in one Compose stack.

---

## Images

### Full image (recommended)

The full image contains Overleaf CE, TeX Live, CJK fonts, and helper scripts in one container:

```text
texdock/sharelatex-full:<version>
texdock/sharelatex-full:latest
```

This image includes:
- Overleaf Community Edition
- TeX Live scheme-full
- Open-source CJK fonts (Noto CJK, WenQuanYi, etc.)
- Private Windows fonts (SimSun, SimHei, FangSong, KaiTi) via `fonts.zip`
- Fontconfig aliases for common Windows font names

### Sandbox images

Sandbox mode uses two images:

```text
texdock/sharelatex-web:latest
texdock/texlive:2026.1
```

The web image does not contain TeX Live. Each LaTeX compile runs in a short-lived sibling TeXLive container.

---

## Deployment

### Full image mode

```bash
# Clone the repository
git clone https://github.com/texdock/texdock.git
cd texdock

# Create environment file
cp .env.example .env
# Edit .env (set TEXDOCK_OVERLEAF_DATA_DIR, etc.)

# Start services
docker compose --env-file .env up -d
```

### Sandbox mode

```bash
# Clone the repository
git clone https://github.com/texdock/texdock.git
cd texdock

# Create environment file
cp .env.sandbox.example .env.sandbox
# Edit .env.sandbox (set host paths, etc.)

# Initialize host directories
./scripts/init-host-dirs.sh .env.sandbox

# Start services
docker compose --env-file .env.sandbox -f docker-compose.sandbox.yml up -d
```

---

## Build

### Prerequisites

- Docker with BuildKit
- `fonts.zip` in `scripts/fonts/private/` (for Windows font support)

### Build the full image chain

```bash
export IMAGE_NAMESPACE=texdock
export VERSION=$(cat VERSION)

# Step 1: Base image
docker build -f server-ce/Dockerfile-base \
  --build-arg TEXDOCK_VERSION="$VERSION" \
  -t "$IMAGE_NAMESPACE/sharelatex-base:$VERSION" \
  -t "$IMAGE_NAMESPACE/sharelatex-base:latest" .

# Step 2: Community edition image
docker build -f server-ce/Dockerfile \
  --build-arg TEXDOCK_VERSION="$VERSION" \
  --build-arg OVERLEAF_BASE_TAG="$IMAGE_NAMESPACE/sharelatex-base:$VERSION" \
  -t "$IMAGE_NAMESPACE/sharelatex:$VERSION" \
  -t "$IMAGE_NAMESPACE/sharelatex:latest" .

# Step 3: TeX Live full image
docker build -f server-ce/Dockerfile-full \
  --build-arg TEXDOCK_VERSION="$VERSION" \
  --build-arg BASE_IMAGE="$IMAGE_NAMESPACE/sharelatex:$VERSION" \
  -t "$IMAGE_NAMESPACE/sharelatex-full:$VERSION" \
  -t "$IMAGE_NAMESPACE/sharelatex-full:latest" .

# Step 4: Windows fonts overlay (requires fonts.zip in scripts/fonts/private/)
docker build -f server-ce/Dockerfile-windows-fonts \
  --build-arg TEXDOCK_VERSION="$VERSION" \
  --build-arg BASE_IMAGE="$IMAGE_NAMESPACE/sharelatex-full:$VERSION" \
  -t "$IMAGE_NAMESPACE/sharelatex-full-fonts:$VERSION" .

# Step 5: Rename fonts image to sharelatex-full (final image)
docker tag "$IMAGE_NAMESPACE/sharelatex-full-fonts:$VERSION" "$IMAGE_NAMESPACE/sharelatex-full:$VERSION"
docker tag "$IMAGE_NAMESPACE/sharelatex-full-fonts:$VERSION" "$IMAGE_NAMESPACE/sharelatex-full:latest"
docker rmi "$IMAGE_NAMESPACE/sharelatex-full-fonts:$VERSION"
```

### Build the sandbox images

```bash
docker build -f server-ce/Dockerfile-sandbox-web \
  -t "$IMAGE_NAMESPACE/sharelatex-web:latest" .

docker build -f server-ce/Dockerfile-sandbox-texlive \
  --build-arg TEXLIVE_REPOSITORY=https://mirrors.tuna.tsinghua.edu.cn/CTAN/systems/texlive/tlnet \
  -t "$IMAGE_NAMESPACE/texlive:2026.1" .
```

---

## Features

- Chinese UI defaults (zh-CN)
- Full TeX Live image (scheme-full)
- Open-source CJK fonts (Noto CJK, WenQuanYi, etc.)
- Private Windows fonts (SimSun, SimHei, FangSong, KaiTi) via fonts.zip
- Fontconfig aliases for common Windows font names
- SMTP configuration support
- LDAP configuration support
- Optional admin-related extensions
- Optional review / track-changes related extensions
- Optional sandbox compile mode with sibling TeXLive containers

---

## Selective Backport from ShareLaTeX 6.2.1

TeXDock selectively backports bug fixes and security fixes from ShareLaTeX 6.2.1:

| ID | Title | Service |
|----|-------|---------|
| REL-001 | handleApiError headers-sent guard | web |
| BUG-004 | LatexRunner stdout run count | clsi |
| BUG-005 | Minted directory regex fix | clsi |
| SEC-001 | Password control character sanitization | web |
| SEC-004 | OT update.doc field validation | real-time |

See `docs/backports/sharelatex-6.2.1/pilot-1/` for details.

---

## License

This project is based on Overleaf Community Edition and is distributed under AGPL-3.0.

See [LICENSE](LICENSE) for details.
