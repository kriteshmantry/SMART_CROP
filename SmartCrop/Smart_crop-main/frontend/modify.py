import sys

def modify_dashboard():
    with open('src/pages/FarmerDashboard.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the injection point
    marker = '  const farmerName = farmerProfile?.first_name'
    idx = content.find(marker)
    if idx == -1:
        print('Marker not found!')
        return

    logic = content[:idx]
    
    # Append the tabs and UI
    ui = '''
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const goFinancial = () => setActiveTab('financial');
    window.addEventListener('openLoanSettings', goFinancial);
    window.addEventListener('openLoanModal', goFinancial);
    return () => {
      window.removeEventListener('openLoanSettings', goFinancial);
      window.removeEventListener('openLoanModal', goFinancial);
    };
  }, []);

  return (
    <div className={`min-h-[100dvh] transition-colors duration-300 relative ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Dynamic Tab Content with Bottom Padding for Navbar */}
      <div className="pb-24 pt-2">
        {activeTab === 'home' && (
          <HomeTab 
            weatherData={weatherData} 
            analysisData={analysisData} 
            isDarkMode={isDarkMode} 
            location={location} 
            t={t} 
          />
        )}
        {activeTab === 'advisory' && (
          <AdvisoryTab 
            analysisData={analysisData}
            candidateCrops={candidateCrops}
            isDarkMode={isDarkMode}
            t={t}
            lang={lang}
            changeLanguage={changeLanguage}
            onPlayAudio={playTextToSpeech}
            isPlayingAudio={isPlayingAudio}
            district={location}
          />
        )}
        {activeTab === 'market' && (
          <MarketTab 
            mandiPrices={analysisData?.market_price_summary ? [analysisData.market_price_summary] : null}
            isDarkMode={isDarkMode}
            t={t}
          />
        )}
        {activeTab === 'financial' && (
          <FinancialTab 
            isDarkMode={isDarkMode}
            t={t}
            loanProfile={loanProfile}
            setLoanProfile={setLoanProfile}
          />
        )}
      </div>

      {/* Fixed Bottom Navigation Bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-1 pb-4 pt-2 shadow-[0_-8px_20px_-5px_rgba(0,0,0,0.1)] ${isDarkMode ? 'bg-slate-900/95 backdrop-blur-xl border-t border-slate-800' : 'bg-white/95 backdrop-blur-xl border-t border-gray-100'}`}>
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center flex-1 py-1 transition-all ${activeTab === 'home' ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600 scale-105') : (isDarkMode ? 'text-slate-500' : 'text-gray-400')}`}> 
          <Home className="h-6 w-6 mb-1" />
          <span className="text-[10px] font-black uppercase tracking-wider">Home</span>
        </button>
        <button onClick={() => setActiveTab('advisory')} className={`flex flex-col items-center flex-1 py-1 transition-all ${activeTab === 'advisory' ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600 scale-105') : (isDarkMode ? 'text-slate-500' : 'text-gray-400')}`}> 
          <Sprout className="h-6 w-6 mb-1" />
          <span className="text-[10px] font-black uppercase tracking-wider">Advisory</span>
        </button>
        <button onClick={() => setActiveTab('market')} className={`flex flex-col items-center flex-1 py-1 transition-all ${activeTab === 'market' ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600 scale-105') : (isDarkMode ? 'text-slate-500' : 'text-gray-400')}`}> 
          <TrendingUp className="h-6 w-6 mb-1" />
          <span className="text-[10px] font-black uppercase tracking-wider">Prices</span>
        </button>
        <button onClick={() => setActiveTab('financial')} className={`flex flex-col items-center flex-1 py-1 transition-all ${activeTab === 'financial' ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600 scale-105') : (isDarkMode ? 'text-slate-500' : 'text-gray-400')}`}> 
          <CreditCard className="h-6 w-6 mb-1" />
          <span className="text-[10px] font-black uppercase tracking-wider">Finance</span>
        </button>
      </div>

    </div>
  );
};

export default FarmerDashboard;
'''
    
    # Add imports
    imports = """import HomeTab from '../components/dashboard-tabs/HomeTab';
import AdvisoryTab from '../components/dashboard-tabs/AdvisoryTab';
import MarketTab from '../components/dashboard-tabs/MarketTab';
import FinancialTab from '../components/dashboard-tabs/FinancialTab';
import { Home } from 'lucide-react';
"""
    final_content = imports + logic + ui
    with open('src/pages/FarmerDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(final_content)
    print('Dashboard updated successfully!')

if __name__ == '__main__':
    modify_dashboard()
