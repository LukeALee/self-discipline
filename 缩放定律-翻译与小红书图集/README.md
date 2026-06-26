# 《Scaling Laws, Carefully》中文翻译 + 整篇图片版

把 Lilian Weng 2026-06-24 的博客 [*Scaling Laws, Carefully*](https://lilianweng.github.io/posts/2026-06-24-scaling-laws/) **按原文内容**完整翻译成中文,并将整篇译文渲染成竖版图片(1080×1440,3:4),可直接用于小红书分发。

## 📁 文件结构

```
缩放定律-翻译与小红书图集/
├── 缩放定律-审慎之道-中文翻译.md   # 全文中文翻译(含公式、图、参考文献)
├── figures/                        # 从原文提取的 16 张配图(figure-1 … figure-16)
├── 全文图片版/
│   ├── page-01.png … page-27.png   # 整篇译文渲染的 27 页竖版图片
│   └── render_article.js           # 渲染脚本(Markdown→KaTeX→分页截图)
└── README.md
```

## 🖼️ 图片版说明(共 27 页)

- 直接对应译文原文顺序:标题/出处 → 早期史 → Kaplan → Chinchilla → 调和 → 为什么是幂律 → 数据受限区 → 拟合的棘手之处 → 引用 → 参考文献。
- 公式用 **KaTeX 离线渲染**,过宽的推导公式会自动缩放到页宽以保证完整不被裁切。
- 16 张原文配图按位置内嵌,带中文图注。
- 分页在「段落/公式/图」的整块边界处断开,不会从中间切断文字或公式。

> ⚠️ **小红书每条最多 18 张图**。27 页建议分 2 条发布(例如 1–14 页一条、15–27 页一条),或自行挑选重点页。

## ✍️ 小红书发布建议

**标题(参考):** `缩放定律一文讲透|Lilian Weng 最新博客全文中译`

**正文文案(参考):**

> Lilian Weng 最新博客《Scaling Laws, Carefully》全文中译 📈
> 从 2017 年「损失可预测」,到 Kaplan 与 Chinchilla 的世纪之争(0.73 vs 0.5),
> 再到「数据墙」时代怎么拟合缩放定律——公式、配图全保留,一次读懂大模型增长逻辑。
> 原文见 lilianweng.github.io(侵删)

**话题标签:** `#大模型` `#AI` `#ScalingLaw` `#缩放定律` `#深度学习` `#LLM` `#机器学习` `#人工智能` `#论文精读` `#算法`

## 🔧 复现 / 重新生成图片

修改 `缩放定律-审慎之道-中文翻译.md` 后重新渲染整篇图片:

```bash
# 依赖(仅首次):系统已装 Noto Sans CJK SC 字体 + Chromium
npm install playwright-core markdown-it markdown-it-texmath katex
node 全文图片版/render_article.js 全文图片版   # 输出 page-*.png
```

脚本会把译文 Markdown 转 HTML(公式走 KaTeX),按 1080×1440 分页并以 2 倍像素截图。

## ⚖️ 版权说明

- 原文版权归作者 **Lilian Weng** 所有,本仓库仅作学习与中文传播用途。
- `figures/` 中的 16 张配图来自原文,版权归原始论文作者(见各图图注与全文参考文献)。
- 翻译如有出入,以[英文原文](https://lilianweng.github.io/posts/2026-06-24-scaling-laws/)为准。
