import TravelStyleDiagnosis from '@/components/TravelStyleDiagnosis';

export default function DiagnosisPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex flex-col items-center justify-center p-4 pt-20">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2 drop-shadow-lg">Mirutabi</h1>
                <p className="text-gray-300 text-lg">AIトラベルスタイル診断</p>
            </div>
            <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                <TravelStyleDiagnosis />
            </div>
        </div>
    );
}
