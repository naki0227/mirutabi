import React from 'react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-4 pt-24 pb-10">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">利用規約・免責事項</h1>

                <section className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">1. はじめに</h2>
                    <p className="text-gray-600 leading-relaxed">
                        本利用規約（以下「本規約」といいます。）は、Mirutabi（以下「当サービス」といいます。）の利用条件を定めるものです。
                        ユーザーの皆様には、本規約に従って当サービスをご利用いただきます。
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">2. AI生成コンテンツに関する免責事項</h2>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                        <p className="text-gray-700 font-bold mb-2">重要：情報の正確性について</p>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            当サービスは、人工知能（AI）技術を使用して旅行プランやスポット情報を生成・提案します。
                            AIは常に最新かつ正確な情報を提供するよう努めますが、その内容の正確性、完全性、有用性、安全性等を保証するものではありません。
                        </p>
                        <ul className="list-disc list-inside mt-2 text-gray-600 text-sm space-y-1">
                            <li>提案された施設の営業時間、料金、定休日などは変更されている可能性があります。</li>
                            <li>交通機関の時刻表や運行状況は、必ず公式サイト等で最新情報をご確認ください。</li>
                            <li>当サービスの情報を利用した結果生じた損害について、運営者は一切の責任を負いません。</li>
                        </ul>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">3. 禁止事項</h2>
                    <p className="text-gray-600 leading-relaxed mb-2">ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません。</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                        <li>法令または公序良俗に違反する行為</li>
                        <li>犯罪行為に関連する行為</li>
                        <li>当サービスのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                        <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                        <li>他のユーザーに成りすます行為</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">4. サービスの変更・停止</h2>
                    <p className="text-gray-600 leading-relaxed">
                        運営者は、ユーザーに通知することなく、当サービスの内容を変更し、または当サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">5. 個人情報の取り扱い</h2>
                    <p className="text-gray-600 leading-relaxed">
                        当サービスは、ユーザーの個人情報を適切に取り扱います。
                        取得した情報は、サービスの提供、改善、およびユーザーへの連絡のためにのみ使用されます。
                        詳細はプライバシーポリシー（別途定める場合）をご参照ください。
                    </p>
                </section>

                <div className="text-center mt-10 text-sm text-gray-500">
                    <p>制定日：{new Date().toLocaleDateString()}</p>
                    <p>© 2025 Mirutabi</p>
                </div>
            </div>
        </div>
    );
}
