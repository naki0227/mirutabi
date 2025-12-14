# Mirutabi (ミルタビ) 🌍

**ルート共有と信頼で紡ぐ、旅の体験アーカイブSNS**

![Status](https://img.shields.io/badge/status-pre--open-yellow)
![Deploy](https://img.shields.io/badge/deploy-Vercel-black)

## 🌐 Demo

**[https://mirutabi.vercel.app/](https://mirutabi.vercel.app/)**

## 🎯 Concept

単なる写真投稿ではなく、「**この道を辿れば、同じ感動に出会える**」という文化の継承を目指す旅行SNS。

旅人同士が支え合い、世界の物語をつなぐプラットフォームです。

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗺️ **Route Sharing** | 旅のルートをマップ上で共有 |
| ⭐ **Trust Score** | 信頼スコアで質の高い情報を届ける |
| 📸 **Experience Archive** | 写真と体験を記録・共有 |
| 🔍 **Discovery** | 他のユーザーの旅程を探索 |
| 💬 **Community** | 旅人同士のコミュニケーション |

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Backend** | Supabase (Auth, Database, Storage) |
| **Maps** | Mapbox / Google Maps API |
| **Deploy** | Vercel |

## 📁 Project Structure

```
mirutabi/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Home page
│   ├── routes/             # Route-related pages
│   └── profile/            # User profiles
├── components/             # Reusable components
├── lib/                    # Utilities & services
├── public/                 # Static assets
└── supabase/               # Supabase config
```

## 🔑 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

## 🔗 Related Projects

Part of the [Enludus](https://enludus.vercel.app/) ecosystem.

## 📄 License

MIT

---

<p align="center">
© 2025 Enludus. All rights reserved.
</p>
