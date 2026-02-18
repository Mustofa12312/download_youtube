/* ===== ADS.JS — Google AdSense Integration Helper ===== */

/**
 * Untuk mengaktifkan iklan Google AdSense:
 * 1. Daftar di https://www.google.com/adsense/
 * 2. Dapatkan kode publisher (ca-pub-XXXXXX)
 * 3. Ganti ADSENSE_PUBLISHER_ID di bawah
 * 4. Buat ad unit di dashboard AdSense
 * 5. Ganti slot ID di setiap ad placement
 */

const ADS_CONFIG = {
    enabled: false, // Set true setelah AdSense disetujui
    publisherId: 'ca-pub-XXXXXXXXXXXXXXXX', // Ganti dengan publisher ID Anda
    slots: {
        bannerTop: { slotId: '1234567890', format: 'horizontal' },
        inContent: { slotId: '0987654321', format: 'rectangle' },
        bannerMiddle: { slotId: '1122334455', format: 'horizontal' }
    }
};

function initAds() {
    if (!ADS_CONFIG.enabled) return;
    // Load AdSense script
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CONFIG.publisherId}`;
    script.crossOrigin = 'anonymous';
    script.async = true;
    document.head.appendChild(script);
}

function renderAd(containerId, slotConfig) {
    if (!ADS_CONFIG.enabled) return;
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="${ADS_CONFIG.publisherId}"
             data-ad-slot="${slotConfig.slotId}"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>`;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {
    initAds();
    if (ADS_CONFIG.enabled) {
        renderAd('adBannerTop', ADS_CONFIG.slots.bannerTop);
        renderAd('adInContent', ADS_CONFIG.slots.inContent);
    }
});
