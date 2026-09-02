import sys

def fix_dashboard():
    with open('src/pages/FarmerDashboard.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix useLanguage destructuring
    content = content.replace(
        'const { t, lang } = useLanguage();',
        'const { t, lang, changeLanguage } = useLanguage();'
    )
    
    # Fix playTextToSpeech and isPlayingAudio
    # The original function was probably handleListen or something.
    # Let's just define them if they don't exist.
    
    # Find activeTab state
    idx = content.find("const [activeTab, setActiveTab] = useState('home');")
    if idx != -1:
        playback_logic = """
  const handlePlayAudio = () => {
    if (!window.speechSynthesis) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (playing) {
        setPlaying(false);
        return;
      }
    }
    const recCrop = analysisData?.crop_recommendation?.recommended_crop || 'Rice';
    const baseP = analysisData?.market_price_summary?.mandi_price_per_quintal || 2300;
    const text = `Recommended crop for ${location} is ${recCrop}. Current price is ${baseP} rupees per quintal.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
  };
"""
        # Inject it right before activeTab
        content = content[:idx] + playback_logic + content[idx:]
        
    # Replace the undefined variables in AdvisoryTab props
    content = content.replace(
        'onPlayAudio={playTextToSpeech}',
        'onPlayAudio={handlePlayAudio}'
    )
    content = content.replace(
        'isPlayingAudio={isPlayingAudio}',
        'isPlayingAudio={playing}'
    )

    with open('src/pages/FarmerDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed variables in FarmerDashboard!")

if __name__ == '__main__':
    fix_dashboard()
