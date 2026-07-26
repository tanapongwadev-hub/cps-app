# Deployment Guide

## Build

```bash
pnpm build
```

Output: `.next/` directory

## Production Environment Variables

ตั้งค่าใน hosting platform:

```env
NEXT_PUBLIC_APP_NAME=Admin Template
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_ENV=production

NEXT_PUBLIC_API_BASE_URL=https://api.yourcompany.com
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_ENABLE_MOCK_API=false

NEXT_PUBLIC_ENABLE_REGISTRATION=false
NEXT_PUBLIC_ENABLE_DARK_MODE=true
NEXT_PUBLIC_ENABLE_I18N=true
```

## Deploy Targets

### Vercel (แนะนำ สำหรับ Next.js)

1. Push code ไป GitHub
2. Connect repo ใน Vercel
3. ตั้ง environment variables
4. Deploy

```bash
# หรือ deploy ด้วย CLI
pnpm dlx vercel
```

### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

```bash
# Build
docker build -t admin-template .

# Run
docker run -p 3000:3000 --env-file .env.production admin-template
```

### Self-hosted (Node.js)

```bash
# Build
pnpm build

# Start
pnpm start
```

ต้องใช้ reverse proxy (nginx, Caddy) สำหรับ HTTPS

### Static Export (ถ้าไม่ต้องการ API routes)

แก้ `next.config.ts`:
```ts
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};
```

```bash
pnpm build
# Output: out/ directory
```

## Pre-Deployment Checklist

✅ **Code Quality**:
- [ ] `pnpm lint` ผ่าน
- [ ] `pnpm type-check` ผ่าน
- [ ] `pnpm test` ผ่าน
- [ ] `pnpm build` สำเร็จ
- [ ] Coverage >= 60%

✅ **Environment**:
- [ ] ตั้งค่า env vars ครบ
- [ ] ปิด Mock API (`NEXT_PUBLIC_ENABLE_MOCK_API=false`)
- [ ] ตั้ง API base URL ชี้ไป production backend

✅ **Security**:
- [ ] เปิด HTTPS
- [ ] ตั้ง CORS ที่ backend
- [ ] เปิด security headers (CSP, HSTS, etc.)
- [ ] Rotate secrets
- [ ] ตรวจสอบไม่มี secret ใน client code

✅ **Performance**:
- [ ] Optimize images
- [ ] Enable compression
- [ ] ตั้ง cache headers
- [ ] ใช้ CDN

✅ **Monitoring**:
- [ ] ตั้ง error tracking (Sentry)
- [ ] ตั้ง analytics (GA, Plausible)
- [ ] ตั้ง uptime monitoring
- [ ] ตั้ง alerting

## CI/CD Example (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test
      - run: pnpm build
```

## Performance Optimization

### 1. Image Optimization

```tsx
import Image from "next/image";

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // LCP image
/>
```

### 2. Code Splitting

```tsx
import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("./heavy-chart"), {
  loading: () => <Skeleton />,
});
```

### 3. Bundle Analysis

```bash
pnpm dlx @next/bundle-analyzer
```

### 4. CDN

ตั้ง CDN (Cloudflare, CloudFront) หน้า Next.js app เพื่อ cache static assets

## Rollback Plan

1. เก็บ build artifacts ไว้
2. ใช้ blue-green deployment
3. เก็บ database migration scripts แยก
4. มี feature flags สำหรับ gradual rollout

## Post-Deployment

- ตรวจสอบ logs
- ตรวจสอบ error tracking
- ตรวจสอบ performance metrics
- เก็บ feedback จาก users
- Monitor ใน 24-48 ชม. แรก
