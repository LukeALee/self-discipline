# 《Scaling Laws, Carefully》中文翻译 + 小红书图集

把 Lilian Weng 2026-06-24 的博客 [*Scaling Laws, Carefully*](https://lilianweng.github.io/posts/2026-06-24-scaling-laws/) 翻译成中文,并制作成一套适合小红书分发的竖版图片(3:4)。

## 📁 文件结构

```
缩放定律-翻译与小红书图集/
├── 缩放定律-审慎之道-中文翻译.md   # 全文中文翻译(含公式、图、参考文献)
├── figures/                        # 从原文提取的 16 张配图(figure-1 … figure-16)
├── 小红书图集/
│   ├── 01-cover.png … 12-end.png   # 12 张竖版卡片(1080×1440 @2x = 2160×2880)
│   ├── cards.json                  # 卡片文案(数据源,可改文案再渲染)
│   └── render.js                   # 渲染脚本(playwright-core + Chromium)
└── README.md
```

## 🖼️ 图集顺序(共 12 张)

| # | 卡片 | 要点 |
|---|------|------|
| 01 | 封面 | Scaling Laws 一文讲透:Kaplan vs Chinchilla 之争 |
| 02 | 一句话本质 | L 随 N/D/C 幂律下降;核心是算力在「模型 vs 数据」间分配;C≈6ND |
| 03 | 史前史 | Amari 1992 / Hestness 2017 / Rosenfeld 2020:损失早就可预测 |
| 04 | Kaplan 2020(上) | 把 scaling law 带火;大模型更省样本 |
| 05 | Kaplan 2020(下) | N_opt ∝ C^0.73,模型增速 > 数据;算力×10→模型×5.5、数据×1.8 |
| 06 | Chinchilla 2022 | 三种方法殊途同归;N_opt ∝ C^0.5,模型翻倍数据也翻倍 |
| 07 | 名场面 | 70B Chinchilla 同算力打赢 280B Gopher → 大模型普遍训练不足 |
| 08 | 和解 | 规模差异 + embedding 占比;局部指数 g 收敛到 0.5(Pearce & Song 2024) |
| 09 | 为什么是幂律 | 数据流形维度说 / 技能量子化说 |
| 10 | 数据墙 | 数据受限区;重复→双重下降;Muennighoff 2023 / Lovelace 2026 |
| 11 | 避坑 | 拟合对琐碎选择极敏感;Besiroglu 2024 复现 |
| 12 | 划重点 | 4 条 takeaways + 出处 + CTA |

## ✍️ 小红书发布建议

**标题(参考):** `缩放定律一文讲透|Kaplan 和 Chinchilla 到底在吵什么?`

**正文文案(参考):**

> 把 Lilian Weng 最新博客《Scaling Laws, Carefully》整理成了 12 张图 📈
> 从 2017 年「损失可预测」的史前史,到 Kaplan 与 Chinchilla 的世纪之争(0.73 vs 0.5),
> 再到「数据墙」时代怎么拟合缩放定律——一次看懂大模型的底层增长逻辑。
> 公式都用大白话讲了,收藏慢慢看 🔖
> 原文见 lilianweng.github.io（侵删）

**话题标签:** `#大模型` `#AI` `#ScalingLaw` `#缩放定律` `#深度学习` `#LLM` `#机器学习` `#人工智能` `#论文精读` `#算法`

## 🔧 复现 / 修改图片

修改 `小红书图集/cards.json` 里的文案后重新渲染:

```bash
cd 小红书图集
npm install playwright-core      # 仅首次
node render.js out               # 输出到 out/ 目录
```

渲染依赖系统已安装的 `Noto Sans CJK SC` 字体与 Chromium。卡片尺寸 1080×1440(小红书推荐 3:4),以 2 倍像素渲染保证清晰度。

## ⚖️ 版权说明

- 原文版权归作者 **Lilian Weng** 所有,本仓库仅作学习与中文传播用途。
- 图集中的 16 张 `figures/` 配图来自原文,版权归原始论文作者(见各图图注与全文参考文献)。
- 翻译如有出入,以[英文原文](https://lilianweng.github.io/posts/2026-06-24-scaling-laws/)为准。
