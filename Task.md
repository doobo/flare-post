\## 基于cloudflare的worker信息发布平台

* 参考项目:https://github.com/maillab/cloud-mail
* 基于cloudflare的kv和D1，以及对应的worker部署，构建基础的项目结构
* 信息发布平台，需后台能编辑管理信息，首页可搜索信息，主要发布vm，vpn等优惠信息，能跳转外部URL(内部转发)
* 后台信息编辑部分，支持markdown编辑，页面渲染支持markdown文档渲染，添加外部URL可自动转内部地址
* 移动端支持友好，特别是信息展示页，和前端首页，后端管理页，PC端兼容即可，方便大量编辑文档
* Architecture.md，是技术方案，基于该方案实现对应的模块功能，基于worker发布
* 如果需要执行npm等命令，可以用volta run npm执行

