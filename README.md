# FDE01 工程工作台

AiToMoney FDE 项目内部网站（第一阶段：网站与展示）。

- 线上：https://fde01.aitomoney.online （内部研发验证环境，非客户生产）
- 服务器：47.103.149.238 `/opt/fde01`
- 任务书：FDE-WEB-01（飞书 docx `Tba2dzrdZoR4HmxXpYdcn6x5n0M`）

## 技术栈

- Node.js ≥ 22（用到内置 `node:sqlite`，无需原生编译）
- Next.js 16 + React 19 + TypeScript
- 认证：jose（JWT）+ bcryptjs；middleware 全站拦截
- 数据库：SQLite（`data/fde01.db`，WAL）

## 本地开发

```bash
npm install
export AUTH_SECRET=$(openssl rand -hex 32)
export INIT_ADMIN_PASSWORD='<至少12位>'
export INIT_DEMO_PASSWORD='<至少12位>'
node scripts/seed.mjs   # 仅首次建库；幂等，重复执行不会重置数据
npm run dev             # http://localhost:3030
```

缺少 `AUTH_SECRET`（或 < 32 字符）时服务**拒绝启动**，不会回退默认密钥。

## 部署（服务器）

```bash
# 1. 安装依赖（服务器需先 unset 代理变量）
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
npm ci

# 2. 初始化数据（仅首次；口令来自环境变量，不进仓库）
node scripts/seed.mjs

# 3. 构建 + 启动（systemd）
npm run build
systemctl start fde01
```

systemd 单元 `/etc/systemd/system/fde01.service`：
- 以低权限用户 `fde01` 运行
- 仅监听 `127.0.0.1:3030`（公网不可直连；nginx 反代提供 HTTPS）
- `EnvironmentFile=/opt/fde01/.env`（含 AUTH_SECRET 及初始口令，权限 600）
- `ExecStartPre` 仅在库文件不存在时执行 seed（不作为数据重置工具）

nginx：`/etc/nginx/conf.d/fde01.aitomoney.online.conf`（80 跳 443；证书 Let's Encrypt，certbot.timer 自动续期）

## 健康检查与运维

```bash
systemctl status fde01            # 服务状态
ss -tlnp | grep 3030              # 应为 127.0.0.1:3030
curl -I https://fde01.aitomoney.online/login   # 200
journalctl -u fde01 -f            # 日志（不含密码/令牌）
```

## 备份与恢复

```bash
# 备份（sqlite 用 .backup 保证一致性；配合文件级备份）
sqlite3 /opt/fde01/data/fde01.db ".backup /opt/backups/fde01-$(date +%F).db"
# 或停服后直接拷贝：systemctl stop fde01 && cp data/fde01.db ...

# 恢复
systemctl stop fde01
cp <backup>.db /opt/fde01/data/fde01.db && chown fde01:fde01 /opt/fde01/data/fde01.db
systemctl start fde01
```

## 回滚

注意：**不要回退到 V0.1（b476d10 及之前）**——该版本存在已知安全问题（默认密钥回退、root 运行、固定口令、无限速）。回滚请在 V0.2+（5f281d4）之后的提交中选择；跨版本回滚前先核对数据库 schema 兼容性（应用启动时会自动执行幂等迁移，见下）。

```bash
cd /opt/fde01
git log --oneline                 # 找回滚点（V0.2+）
git checkout <commit>
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
npm ci && npm run build
systemctl restart fde01
```

## 数据库迁移

应用启动时自动执行幂等迁移（src/lib/db.ts）：对已存在的老库按需 `ALTER TABLE` 补列（is_demo / source_ref / audit_log），新库由 scripts/seed.mjs 一次建全。迁移不删数据、可重复执行。

## 数据与安全说明

- 演示/合成数据带 `is_demo=1` 标记，页面可筛选，统计分开
- admin 角色可写（白名单字段 + 审计日志 audit_log）；demo 角色只读
- 登录接口限速：同 IP+用户名 15 分钟内 5 次失败后锁定
- 客户原图、模型、私有规则不上传本站
- 仓库不含 `.env`、`data/`（见 .gitignore）
