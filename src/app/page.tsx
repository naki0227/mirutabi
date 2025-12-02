import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-300 ring-1 ring-white/10 hover:ring-white/20 transition">
              AIがあなたの旅をデザインする{' '}
              <a href="#" className="font-semibold text-indigo-400">
                <span className="absolute inset-0" aria-hidden="true" />
                Read more <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 drop-shadow-lg">
            TabiStyle
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            「爆速コスパ」も「贅沢体験」も、AIがあなたに合わせて最適化。<br />
            動画で見つける、新しい旅のカタチ。
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/diagnosis"
              className="rounded-full bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all hover:scale-105"
            >
              スタイル診断を始める
            </Link>
            <Link href="/videos" className="text-sm font-semibold leading-6 text-white hover:text-indigo-300 transition">
              動画を見る <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1: Diagnosis */}
          <Link href="/diagnosis" className="group relative block p-8 bg-white/5 rounded-2xl ring-1 ring-white/10 hover:bg-white/10 transition hover:scale-105 duration-300">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">トラベルスタイル診断</h3>
            <p className="text-gray-400">5つの質問であなたの旅のタイプを分析。最適なプランニングの基礎を作ります。</p>
          </Link>

          {/* Feature 2: AI Planning */}
          <Link href="/plan" className="group relative block p-8 bg-white/5 rounded-2xl ring-1 ring-white/10 hover:bg-white/10 transition hover:scale-105 duration-300">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">AIプランニング</h3>
            <p className="text-gray-400">「来月、5万円で温泉」のような自然な言葉で、AIが具体的な旅程を提案します。</p>
          </Link>

          {/* Feature 3: Video Feed */}
          <Link href="/videos" className="group relative block p-8 bg-white/5 rounded-2xl ring-1 ring-white/10 hover:bg-white/10 transition hover:scale-105 duration-300">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">動画フィード</h3>
            <p className="text-gray-400">TikTokライクなUIで、次の旅のインスピレーションを直感的に探せます。</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
