\## 基于cloudflare的worker信息发布平台

* 项目基础架构已搭建，能正常启动，后续功能优化
* Publish页修改，支持富文本编辑，支持markdown编辑，可切换，存储文档的类型

# 基于 Cloudflare Worker 的信息发布平台（Publish 模块优化方案）

## 1\. 项目背景

当前系统基于 Cloudflare Worker 已完成基础架构搭建，可正常运行。后续重点优化 **Publish 页面编辑能力、分类体系、URL 跳转逻辑**。

\---

## 2\. Publish 页面功能优化

### 2.1 编辑器能力升级

Publish 页面支持两种编辑模式，并可自由切换：

#### （1）富文本编辑模式（Rich Text Editor）

* 支持基础排版：

  * 标题（H1/H2/H3）
  * 加粗 / 斜体
  * 有序 / 无序列表
  * 链接插入
  * 代码块（可选）
* 所见即所得（WYSIWYG）

#### （2）Markdown 编辑模式

* 支持标准 Markdown 语法：

  * # 标题
  * **bold**
  * 
  * list
  * [text](url)
  * `code`
* 实时预览（左右分栏或切换预览）

#### （3）模式切换机制

* 编辑器顶部 toggle：Rich Text ↔ Markdown
* 切换时需处理内容转换：

  * Markdown → HTML
  * HTML → Markdown
* 防止数据丢失（切换前提示）

\---

## 3\. 内容存储结构优化

```json
{
  "id": "post\\\_id",
  "title": "标题",
  "content\\\_type": "richtext | markdown",
  "content": "HTML 或 Markdown",
  "category\\\_id": 1,
  "created\\\_at": 1234567890,
  "updated\\\_at": 1234567890
}
```

### 存储规则

* Markdown模式：存 Markdown 原文
* 富文本模式：存 HTML
* content\_type 用于渲染判断

\---

## 4\. Category 分类系统优化

### 4.1 数据来源

category\_list 字典表

```json
{
  "id": 1,
  "name": "虚拟机",
  "children": \\\[
    {
      "id": 11,
      "name": "KVM"
    }
  ]
}
```

\---

### 4.2 初始化分类

系统启动自动初始化：

#### 一级分类

* 虚拟机
* VPN
* 域名
* 服务器
* 网络工具
* 安全工具

#### 二级分类示例

* 虚拟机：KVM / VMware
* VPN：商业VPN / 自建VPN
* 域名：注册商 / DNS解析

\---

### 4.3 分类选择

* Tree Select
* 单选分类
* 支持默认选中最近使用分类

\---

## 5\. URL 处理逻辑（重点）

### 5.1 规则

识别所有 URL：

* http://
* https://

\---

### 5.2 替换逻辑

原始：
https://example.com/page

替换：
/redirect?url=encoded\_url

示例：
/redirect?url=https%3A%2F%2Fexample.com%2Fpage

\---

### 5.3 Redirect 页面逻辑

访问 /redirect：

1. 展示目标链接
2. 倒计时 3 秒
3. 自动跳转

\---

### 5.4 安全建议

* 白名单域名
* 防 open redirect
* 记录跳转日志

\---

## 6\. 发布流程

1. 编辑内容（Rich / Markdown）
2. 提交 content + type
3. 后端扫描 URL
4. 替换 redirect 链接
5. 存储数据库
6. 返回 post\_id

\---

## 7\. 可扩展优化

* SEO meta 自动生成
* XSS 过滤
* autosave
* 草稿系统
* tag 系统



