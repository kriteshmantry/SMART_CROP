import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Sprout, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Landing = () => {
 const navigate = useNavigate();
 const { t } = useLanguage();

 return (
 <div 
 className="min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
 style={{
 backgroundImage:"url('/bg-greenery.jpg')",
 backgroundSize: 'cover',
 backgroundPosition: 'center',
 backgroundRepeat: 'no-repeat'
 }}
 >
 {/* Soft overlay to guarantee text readability over the background */}
 <div className="absolute inset-0 bg-white/40 backdrop-blur-xs"></div>

 <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
 <div className="text-center mb-6 sm:mb-10 max-w-2xl px-2">
 <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-green-900 tracking-tight drop-shadow-xs">
 {t('welcome')}
 </h1>
 <p className="mt-2 sm:mt-4 text-sm sm:text-base md:text-lg text-gray-800 font-medium drop-shadow-xs">
 {t('subtitle')}
 </p>
 </div>

 <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
 
 {/* Farmer Card */}
 <div 
 onClick={() => navigate('/farmer-login')}
 className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-md sm:shadow-lg border border-green-200 p-5 sm:p-8 hover:shadow-xl hover:border-green-400 hover:bg-white active:scale-[0.99] cursor-pointer transition-all duration-300 transform sm:hover:-translate-y-1 group flex flex-col items-center text-center"
 >
 <div className="bg-green-100 p-3 sm:p-4 rounded-2xl mb-4 sm:mb-6 group-hover:bg-green-200 transition-colors shadow-xs">
 <Sprout className="h-8 w-8 sm:h-12 sm:w-12 text-green-700" />
 </div>
 <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{t('farmer_title')}</h2>
 <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 flex-1 leading-relaxed">
 {t('farmer_desc')}
 </p>
 <div className="w-full sm:w-auto inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-green-50 sm:bg-transparent text-green-700 font-bold group-hover:text-green-800 group-hover:bg-green-50 transition-colors">
 <span>{t('farmer_btn')}</span>
 <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
 </div>
 </div>

 {/* Officer Card */}
 <div 
 onClick={() => navigate('/officer-login')}
 className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-md sm:shadow-lg border border-blue-200 p-5 sm:p-8 hover:shadow-xl hover:border-blue-400 hover:bg-white active:scale-[0.99] cursor-pointer transition-all duration-300 transform sm:hover:-translate-y-1 group flex flex-col items-center text-center"
 >
 <div className="bg-blue-100 p-3 sm:p-4 rounded-2xl mb-4 sm:mb-6 group-hover:bg-blue-200 transition-colors shadow-xs">
 <UserCircle className="h-8 w-8 sm:h-12 sm:w-12 text-blue-700" />
 </div>
 <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{t('officer_title')}</h2>
 <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 flex-1 leading-relaxed">
 {t('officer_desc')}
 </p>
 <div className="w-full sm:w-auto inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-blue-50 sm:bg-transparent text-blue-700 font-bold group-hover:text-blue-800 group-hover:bg-blue-50 transition-colors">
 <span>{t('officer_btn')}</span>
 <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
 </div>
 </div>

 </div>
 </div>
 </div>
 );
};

export default Landing;
