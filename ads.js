/* ===== ADS.JS — Ad Management System ===== */

/**
 * KONFIGURASI IKLAN
 * -----------------
 * Situs Downloader biasanya ditolak Google AdSense.
 * Rekomendasi: Gunakan Adsterra, Monetag, atau PopAds.
 * 
 * Pilih 'provider':
 * - 'adsense': Jika Anda punya akun AdSense aktif.
 * - 'custom' : Untuk menempel kode script dari Adsterra/Lainnya.
 */

const ADS_CONFIG = {
    enabled: true,          // Set true untuk menampilkan iklan
    provider: 'custom',     // Pilihan: 'adsense' atau 'custom'

    // Konfigurasi jika menggunakan Google AdSense
    adsense: {
        publisherId: 'ca-pub-XXXXXXXXXXXXXXXX',
        slots: {
            bannerTop: '1234567890',    // Slot ID untuk Header
            inContent: '0987654321',    // Slot ID di bawah hasil download
            bannerMiddle: '1122334455'  // Slot ID di tengah halaman
        }
    },

    // Konfigurasi ADSTERRA (Tempel Script Di Sini)
    custom: {
        // 1. Banner Atas (Biasanya ukuran 728x90 atau 468x60)
        bannerTop: `
            <div style="text-align:center; margin-bottom:20px;">
                <!-- TEMPEL KODE ADSTERRA 728x90 DI BAWAH SINI -->
                
                <div style="background:#222; color:#555; padding:20px; border-radius:8px; border:1px dashed #444;">
                    IKLAN BANNER ATAS (728x90)<br>
                    <small>Paste script Adsterra di file ads.js baris 26</small>
                </div>

                <!-- AKHIR KODE ADSTERRA -->
            </div>
        `,

        // 2. Iklan Dalam Konten (Muncul setelah klik download, ukuran 300x250 atau 320x50)
        inContent: `
            <div style="text-align:center; margin-top:20px; margin-bottom:20px;">
                <!-- TEMPEL KODE ADSTERRA 300x250 DI BAWAH SINI -->
                
                <div style="background:#222; color:#555; padding:30px; border-radius:8px; border:1px dashed #444;">
                    IKLAN KOTAK (300x250)<br>
                    <small>Paste script Adsterra di file ads.js baris 39</small>
                </div>

                <!-- AKHIR KODE ADSTERRA -->
            </div>
        `,

        // 3. Banner Tengah (Ukuran 728x90)
        bannerMiddle: `
            <div style="text-align:center; margin:30px 0;">
                <!-- TEMPEL KODE ADSTERRA 728x90 DI BAWAH SINI -->
                
                <div style="background:#222; color:#555; padding:20px; border-radius:8px; border:1px dashed #444;">
                    IKLAN BANNER TENGAH (728x90)<br>
                    <small>Paste script Adsterra di file ads.js baris 52</small>
                </div>

                <!-- AKHIR KODE ADSTERRA -->
            </div>
        `
    }
};

// ===== LOGIC RENDER =====
function initAds() {
    if (!ADS_CONFIG.enabled) {
        document.querySelectorAll('.ad-slot').forEach(el => el.style.display = 'none');
        return;
    }

    if (ADS_CONFIG.provider === 'adsense') {
        // Load Script AdSense
        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CONFIG.adsense.publisherId}`;
        script.crossOrigin = 'anonymous';
        script.async = true;
        document.head.appendChild(script);

        renderAdsense('adBannerTop', ADS_CONFIG.adsense.slots.bannerTop);
        renderAdsense('adInContent', ADS_CONFIG.adsense.slots.inContent); // Note: ID di HTML belum ada id khusus untuk in-content, kita render manual
        renderAdsense('adBannerMiddle', ADS_CONFIG.adsense.slots.bannerMiddle); // Perlu penyesuaian ID di HTML
    } else {
        // Custom Provider
        renderCustomAd('adBannerTop', ADS_CONFIG.custom.bannerTop);
        renderCustomAd('adBannerMiddle', ADS_CONFIG.custom.bannerMiddle);

        // Khusus in-content agak tricky karena diawali hidden, kita inject saat display
        renderCustomAd('adInContent', ADS_CONFIG.custom.inContent);
    }
}

function renderAdsense(containerId, slotId) {
    const container = document.getElementById(containerId) || document.querySelector(`.${containerId}`);
    if (!container || !slotId) return;

    container.innerHTML = `
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="${ADS_CONFIG.adsense.publisherId}"
             data-ad-slot="${slotId}"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>`;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { }
}

function renderCustomAd(containerId, htmlCode) {
    const container = document.getElementById(containerId) || document.querySelector(`.${containerId}`);
    if (!container) return;

    // Bersihkan container
    container.innerHTML = '';

    // Buat iframe 'Friendly' untuk mengisolasi script iklan (agar document.write aman)
    const iframe = document.createElement('iframe');
    iframe.title = "Advertisement";
    iframe.scrolling = "no";

    // Initial style (border 0, size 0 seolah hidden sampai dimuat)
    iframe.style.border = "none";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.overflow = "hidden";

    // Pasang iframe ke container
    container.appendChild(iframe);

    // Tulis konten iklan ke dalam iframe
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { margin:0; padding:0; text-align:center; background:transparent; display:flex; justify-content:center; align-items:center; height:100vh; overflow:hidden;}
                /* Style untuk merapikan script yg mungkin overflow */
                img, iframe { max-width: 100%; }
            </style>
        </head>
        <body>
            ${htmlCode}
        </body>
        </html>
    `);
    doc.close();
}

// Global expose untuk dipanggil app.js jika perlu refresh iklan
window.refreshAds = function () {
    if (ADS_CONFIG.enabled && ADS_CONFIG.provider === 'custom') {
        const slots = ['adBannerTop', 'adInContent', 'adBannerMiddle'];
        slots.forEach(s => {
            // Re-render logic if needed for rotation
        });
    }
};

document.addEventListener('DOMContentLoaded', initAds);

