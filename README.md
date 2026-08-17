# 顾一的成长小树

一个面向个人成长的响应式网页应用，支持电脑端和手机端访问，数据自动保存，可接入 Supabase 进行云端同步。部分内容已接入免费公共 API，实现每日联网更新。

## 功能

- **首页**：时钟、日期、农历、问候语、积分统计、每日金句、历史上的今天
- **健康**：
  - 减重：目标设定、当前体重、已减重、距离目标、目标进度、训练周期、波动疏导
  - 围度：大臂围 / 背围 / 腰围 / 腹围 / 臀围 / 大腿围 / 小腿围，每周一测
  - 喝水：今日已喝、喝水目标、快捷容量按钮、喝水记录
  - 打卡：自定义健康打卡项，积分自动汇总
- **变美情报局**：
  - 今日宜美：基于定位获取实时天气（Open-Meteo），给出穿衣/护肤/妆容建议
  - 流行风向：小红书 / 抖音热门趋势 Top 5
  - 灵感军火库：收藏外部链接，自动解析标题与封面图，瀑布流卡片展示
- **学习**：每日好书推荐（约 50 字介绍）、十分钟精读一本书、每日英语口语、英语视频推荐、学习打卡
- **今日热点**：综合热榜、时政要闻、短视频热榜、申论/时政素材生成
- **树洞**：AI 树洞精灵对话（接入智谱 GLM-4-Flash）
- **积分系统**：打卡日历（爱心标记）、积分统计、按时间分组的心愿单、插图、回收站、兑换与退分

## 联网内容

以下内容已接入免费公共 API，每日自动更新并做本地缓存：

| 内容 | 数据源 |
|---|---|
| 每日金句 | 一言（hitokoto.cn） |
| 历史上的今天 | api.asilu.com |
| 综合热榜 / 时政 / 短视频 | uapis.cn 热榜 API |
| 天气与穿搭建议 | Open-Meteo（免费，无需 Key） |
| 灵感链接解析 | microlink.io（解析失败可手动填写） |
| 树洞 AI / 申论素材 | 智谱 GLM-4-Flash |

热榜支持数据源容灾：优先读取同目录 `hot.json`，不存在或过期时自动调用 uapis.cn 实时接口。

## GitHub Actions 自动更新热榜

项目已内置 `.github/workflows/hot-update.yml`，每 2 小时自动运行 `scripts/fetch-hot.js` 抓取热门平台数据并提交 `hot.json`。

使用方式：

1. 将本项目代码推送到你的 GitHub 仓库。
2. 在仓库 Settings > Actions > General > Workflow permissions 中授予「Read and write permissions」。
3. 工作流会自动按 `0 */2 * * *` 执行，也可以手动触发 `workflow_dispatch`。
4. 部署时选择从该仓库构建静态站点，`index.html` 会自动读取 `hot.json`。

## 数据持久化

### 本地保存

所有输入内容会自动保存到浏览器 `localStorage`，关闭后再打开不会丢失。

### 云端同步（Supabase）

1. 访问 [Supabase](https://supabase.com) 创建项目
2. 进入 SQL Editor，执行以下建表语句：

```sql
create table if not exists growtree_data (
    id text primary key,
    payload jsonb not null,
    updated_at timestamptz default now()
);

alter table growtree_data enable row level security;

create policy "Allow all"
    on growtree_data
    for all
    to anon
    using (true)
    with check (true);

-- 变美情报局 · 灵感军火库表（按需执行）
create table if not exists beauty_inspiration (
    id uuid primary key default gen_random_uuid(),
    url text not null,
    title text,
    cover_url text,
    tags text[] default '{}',
    note text,
    created_at timestamp with time zone default now()
);

alter table beauty_inspiration enable row level security;

create policy "allow anon all" on beauty_inspiration
    for all to anon
    using (true)
    with check (true);
```

3. 在项目 Settings > API 中复制 `Project URL` 和 `anon public` API Key
4. 打开网页，点击右上角 ⚙️ 设置，填入 Supabase URL 和 Anon Key
5. 保存后，页面底部同步状态会显示「已同步」

> 安全提示：Anon Key 是公开密钥，不要泄露 Service Role Key。如果担心数据隐私，可进一步配置 RLS 策略（例如只允许特定用户访问）。

## AI 配置（树洞 + 申论素材）

1. 前往 [智谱 AI 开放平台](https://open.bigmodel.cn) 注册并获取 API Key。
2. 在网页右上角 ⚙️ 设置中填写「AI API Key」。
3. 默认使用 `glm-4-flash` 模型，如需更换可修改「AI 接口地址」与模型（当前版本模型固定为 glm-4-flash）。
4. 保存后即可在「树洞」与「申论素材」中使用 AI。

## 部署

本项目为纯静态网页，可直接部署到任意静态托管服务。

## 文件说明

- `index.html`：页面结构
- `styles.css`：样式与响应式布局
- `app.js`：业务逻辑、数据持久化、API 调用、Supabase 同步
- `scripts/fetch-hot.js`：抓取热榜数据脚本
- `.github/workflows/hot-update.yml`：GitHub Actions 定时更新热榜
