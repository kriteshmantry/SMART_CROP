import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Brain, Activity, BookOpen, ArrowRight, ChevronRight, Leaf, Database, Cpu, Target } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Intro = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const { lang, changeLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#e8f4eb] text-[#1a2f22] font-sans selection:bg-emerald-200 overflow-x-hidden relative">
      
      {/* --- LIGHT ATMOSPHERIC BACKGROUND --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        
        {/* Soft warm gradient base - Made greener */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#e8f4eb] via-[#dcf0e2] to-[#d1ebd8]"></div>

        {/* Realistic Agricultural Imagery - Bottom Field */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[70vh] opacity-30 mix-blend-multiply"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1595844730298-b960fa25fa48?q=80&w=2500&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
            transform: `translateY(${scrollY * 0.15}px)`
          }}
        />

        {/* Realistic Foliage - Top Left */}
        <div 
          className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] opacity-40 mix-blend-multiply"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1000&auto=format&fit=crop')",
            backgroundSize: 'cover',
            maskImage: 'radial-gradient(ellipse at left center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at left center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
            transform: `translateY(${scrollY * 0.05}px)`
          }}
        />

        {/* Realistic Foliage - Right edge */}
        <div 
          className="absolute top-[30%] -right-[15%] w-[40vw] h-[60vw] opacity-35 mix-blend-multiply"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1000&auto=format&fit=crop')",
            backgroundSize: 'cover',
            maskImage: 'radial-gradient(ellipse at right center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at right center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 75%)',
            transform: `translateY(${-scrollY * 0.08}px)`
          }}
        />
        
        {/* Very subtle grain/noise for organic feel */}
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
        </div>
      </div>

      {/* --- MINIMAL LIGHT NAVIGATION --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 bg-white/60 backdrop-blur-md border-b border-[#1a2f22]/5 transition-all duration-300">
        <div className="flex items-center space-x-2.5">
          <div className="bg-gradient-to-tr from-emerald-600 to-green-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm text-white transition-transform hover:scale-105">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#1a2f22] flex items-center">
            Smart<span className="text-emerald-700 font-medium">Crop</span>
          </span>
        </div>
        <div className="flex items-center space-x-3 sm:space-x-4">
          <select 
            value={lang} 
            onChange={(e) => changeLanguage(e.target.value)}
            className="bg-white/80 border border-[#1a2f22]/10 text-[#1a2f22] text-sm rounded-full focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 cursor-pointer font-medium shadow-sm hover:border-emerald-700/30 transition-colors outline-none"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="or">ଓଡ଼ିଆ</option>
          </select>
          <button 
            onClick={() => navigate('/roles')}
            className="text-sm font-semibold text-[#1a2f22] hover:text-emerald-800 transition-colors flex items-center group px-5 py-2.5 rounded-full border border-[#1a2f22]/10 hover:border-emerald-700/30 bg-white shadow-sm hover:shadow-md"
          >
            <span className="hidden sm:inline">{t('intro_nav_enter')}</span>
            <span className="sm:hidden">App</span>
            <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 pt-36 pb-20 md:pt-48 md:pb-32 px-6 md:px-12 max-w-6xl mx-auto flex flex-col items-center text-center">
        
        {/* Light Premium Pill / Eyebrow */}
        <div className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-emerald-700/10 bg-white/80 backdrop-blur-sm mb-8 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-emerald-600 mr-2.5 shadow-[0_0_8px_rgba(5,150,105,0.4)]"></span>
          <span className="text-xs font-bold tracking-widest text-[#1a2f22] uppercase">{t('intro_eyebrow')}</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 max-w-5xl">
          <span className="text-[#1a2f22]">{t('intro_headline_1')}</span>
          <br className="hidden md:block" />
          <span className="text-emerald-700">
            {' '}{t('intro_headline_2')}
          </span>
        </h1>

        {/* Supporting Message */}
        <p className="text-lg md:text-xl text-[#4a5e52] font-medium max-w-3xl mb-12 leading-relaxed">
          {t('intro_subtitle')}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button 
            onClick={() => navigate('/roles')}
            className="w-full sm:w-auto px-8 py-4 bg-[#1a2f22] hover:bg-[#254230] text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center group"
          >
            {t('intro_cta_primary')}
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1.5 transition-transform" />
          </button>
          
          <a 
            href="#capabilities"
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-[#f2f9f5] border border-emerald-700/10 hover:border-emerald-700/30 text-[#1a2f22] rounded-xl font-semibold text-lg transition-all shadow-sm flex items-center justify-center"
          >
            {t('intro_cta_secondary')}
          </a>
        </div>
      </main>

      {/* --- PRODUCT VALUE / CAPABILITIES --- */}
      <section id="capabilities" className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20 bg-white/40 backdrop-blur-xl border-y border-[#1a2f22]/5">
        <div className="mb-16 md:mb-20 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-[#1a2f22] mb-6 tracking-tight">{t('intro_core_title')}</h2>
          <p className="text-lg text-[#4a5e52] font-medium leading-relaxed max-w-3xl mx-auto">
            {t('intro_core_subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          
          {/* Card 1 */}
          <div className="group bg-white/70 hover:bg-white border border-[#1a2f22]/5 hover:border-emerald-600/20 rounded-3xl p-8 md:p-10 transition-all duration-300 shadow-sm hover:shadow-md">
            <div className="bg-emerald-50 text-emerald-700 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100 group-hover:scale-110 group-hover:bg-emerald-100 transition-transform">
              <Sprout className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-[#1a2f22] mb-3">{t('intro_cap1_title')}</h3>
            <p className="text-[#4a5e52] leading-relaxed">
              {t('intro_cap1_desc')}
            </p>
          </div>

          {/* Card 2 */}
          <div className="group bg-white/70 hover:bg-white border border-[#1a2f22]/5 hover:border-teal-600/20 rounded-3xl p-8 md:p-10 transition-all duration-300 shadow-sm hover:shadow-md">
            <div className="bg-teal-50 text-teal-700 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-teal-100 group-hover:scale-110 group-hover:bg-teal-100 transition-transform">
              <Brain className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-[#1a2f22] mb-3">{t('intro_cap2_title')}</h3>
            <p className="text-[#4a5e52] leading-relaxed">
              {t('intro_cap2_desc')}
            </p>
          </div>

          {/* Card 3 */}
          <div className="group bg-white/70 hover:bg-white border border-[#1a2f22]/5 hover:border-orange-600/20 rounded-3xl p-8 md:p-10 transition-all duration-300 shadow-sm hover:shadow-md">
            <div className="bg-orange-50 text-orange-700 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-orange-100 group-hover:scale-110 group-hover:bg-orange-100 transition-transform">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-[#1a2f22] mb-3">{t('intro_cap3_title')}</h3>
            <p className="text-[#4a5e52] leading-relaxed">
              {t('intro_cap3_desc')}
            </p>
          </div>

          {/* Card 4 */}
          <div className="group bg-white/70 hover:bg-white border border-[#1a2f22]/5 hover:border-blue-600/20 rounded-3xl p-8 md:p-10 transition-all duration-300 shadow-sm hover:shadow-md">
            <div className="bg-blue-50 text-blue-700 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 group-hover:scale-110 group-hover:bg-blue-100 transition-transform">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-[#1a2f22] mb-3">{t('intro_cap4_title')}</h3>
            <p className="text-[#4a5e52] leading-relaxed">
              {t('intro_cap4_desc')}
            </p>
          </div>

        </div>
      </section>

      {/* --- FROM DATA TO DECISIONS --- */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-24 md:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-[#1a2f22] mb-6 tracking-tight">{t('intro_pipeline_title')}</h2>
          <p className="text-lg text-[#4a5e52] font-medium max-w-2xl mx-auto">
            {t('intro_pipeline_subtitle')}
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 bg-white border border-[#1a2f22]/5 shadow-sm p-8 md:p-12 rounded-3xl">
          
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center flex-1">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 text-slate-600 shadow-sm">
              <Database className="w-6 h-6" />
            </div>
            <h4 className="text-[#1a2f22] font-bold mb-2">{t('intro_step1')}</h4>
            <p className="text-sm text-[#4a5e52]">{t('intro_step1_desc')}</p>
          </div>

          <ChevronRight className="w-8 h-8 text-slate-300 hidden md:block" />
          <div className="h-8 w-[1px] bg-slate-200 md:hidden my-2"></div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center flex-1">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4 text-emerald-600 shadow-sm">
              <Cpu className="w-6 h-6" />
            </div>
            <h4 className="text-[#1a2f22] font-bold mb-2">{t('intro_step2')}</h4>
            <p className="text-sm text-[#4a5e52]">{t('intro_step2_desc')}</p>
          </div>

          <ChevronRight className="w-8 h-8 text-slate-300 hidden md:block" />
          <div className="h-8 w-[1px] bg-slate-200 md:hidden my-2"></div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center flex-1">
            <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mb-4 text-teal-600 shadow-sm">
              <Leaf className="w-6 h-6" />
            </div>
            <h4 className="text-[#1a2f22] font-bold mb-2">{t('intro_step3')}</h4>
            <p className="text-sm text-[#4a5e52]">{t('intro_step3_desc')}</p>
          </div>

          <ChevronRight className="w-8 h-8 text-slate-300 hidden md:block" />
          <div className="h-8 w-[1px] bg-slate-200 md:hidden my-2"></div>

          {/* Step 4 */}
          <div className="flex flex-col items-center text-center flex-1">
            <div className="w-16 h-16 rounded-full bg-[#1a2f22] text-white flex items-center justify-center mb-4 shadow-md">
              <Target className="w-6 h-6" />
            </div>
            <h4 className="text-[#1a2f22] font-bold mb-2">{t('intro_step4')}</h4>
            <p className="text-sm text-[#4a5e52]">{t('intro_step4_desc')}</p>
          </div>

        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="relative z-10 w-full border-t border-[#1a2f22]/5 py-24 md:py-32 bg-white/40 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold text-[#1a2f22] mb-8 tracking-tight">{t('intro_final_title')}</h2>
          <button 
            onClick={() => navigate('/roles')}
            className="px-10 py-5 bg-[#1a2f22] hover:bg-[#254230] text-white rounded-2xl font-bold text-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 inline-flex items-center group"
          >
            {t('intro_final_cta')}
            <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </section>

      {/* --- MINIMAL FOOTER --- */}
      <footer className="relative z-10 border-t border-[#1a2f22]/5 py-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between text-[#4a5e52] text-sm bg-white/80 backdrop-blur-md">
        <div className="flex items-center space-x-2 mb-4 md:mb-0">
          <Sprout className="w-4 h-4 text-emerald-700" />
          <span className="font-bold text-[#1a2f22]">SmartCrop</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <div className="flex space-x-6">
          <a href="#" className="hover:text-emerald-700 transition-colors font-medium">{t('intro_footer_privacy')}</a>
          <a href="#" className="hover:text-emerald-700 transition-colors font-medium">{t('intro_footer_terms')}</a>
          <a href="#" className="hover:text-emerald-700 transition-colors font-medium">{t('intro_footer_research')}</a>
        </div>
      </footer>

    </div>
  );
};

export default Intro;
