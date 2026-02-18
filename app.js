/* ===== APP.JS — Main Application Logic ===== */
(function () {
    'use strict';

    // ===== DOM Elements =====
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const urlInput = $('#urlInput');
    const btnFetch = $('#btnFetch');
    const btnClear = $('#btnClear');
    const loadingBar = $('#loadingBar');
    const errorToast = $('#errorToast');
    const resultSection = $('#resultSection');
    const videoThumbnail = $('#videoThumbnail');
    const videoTitle = $('#videoTitle');
    const videoChannel = $('#videoChannel');
    const videoDuration = $('#videoDuration');
    const qualityOptions = $('#qualityOptions');
    const audioOptions = $('#audioOptions');
    const tabVideo = $('#tabVideo');
    const tabAudio = $('#tabAudio');
    const menuToggle = $('#menuToggle');
    const mobileNav = $('#mobileNav');

    let currentVideoId = '';

    // ===== PARTICLES BACKGROUND =====
    function createParticles() {
        const container = $('#particles');
        if (!container) return;
        const sizes = [200, 300, 400, 500, 600];
        for (let i = 0; i < 6; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const s = sizes[i % sizes.length];
            p.style.cssText = `width:${s}px;height:${s}px;top:${Math.random() * 100}%;left:${Math.random() * 100}%;animation-delay:${i * 3}s;animation-duration:${18 + i * 4}s;filter:blur(${60 + i * 10}px)`;
            container.appendChild(p);
        }
    }

    // ===== DYNAMIC CONTENT =====
    function renderFeatures() {
        const grid = $('#featuresGrid');
        if (!grid) return;
        const features = [
            { icon: 'speed', cls: 'icon-speed', t: 'Super Cepat', d: 'Server kecepatan tinggi untuk download video dalam hitungan detik.', svg: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' },
            { icon: 'quality', cls: 'icon-quality', t: 'Semua Kualitas', d: 'Pilih resolusi dari 360p hingga 4K Ultra HD sesuai kebutuhan.', svg: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>' },
            { icon: 'mp3', cls: 'icon-mp3', t: 'Konversi MP3', d: 'Ekstrak audio dari video YouTube dan simpan sebagai file MP3.', svg: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>' },
            { icon: 'devices', cls: 'icon-devices', t: 'Semua Device', d: 'Bisa digunakan di HP, tablet, laptop, dan desktop.', svg: '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>' },
            { icon: 'free', cls: 'icon-free', t: '100% Gratis', d: 'Tidak ada biaya tersembunyi. Gunakan sepuasnya tanpa batas.', svg: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' },
            { icon: 'secure', cls: 'icon-secure', t: 'Aman & Privat', d: 'Tidak ada data yang disimpan. Privasi kamu terjaga.', svg: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' }
        ];
        grid.innerHTML = features.map((f, i) => `
            <div class="feature-card" style="transition-delay:${i * 80}ms">
                <div class="feature-icon ${f.cls}"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${f.svg}</svg></div>
                <h3>${f.t}</h3><p>${f.d}</p>
            </div>`).join('');
    }

    function renderSteps() {
        const grid = $('#stepsGrid');
        if (!grid) return;
        const steps = [
            { n: '1', t: 'Salin Link', d: 'Copy link video YouTube dari browser atau aplikasi YouTube.' },
            { n: '2', t: 'Tempel & Pilih', d: 'Tempel link di kolom input, pilih format dan kualitas.' },
            { n: '3', t: 'Download!', d: 'Klik tombol download dan file tersimpan otomatis.' }
        ];
        const arrow = `<div class="step-connector"><svg width="40" height="20" viewBox="0 0 40 20" fill="none" stroke="currentColor" stroke-width="2" class="connector-arrow"><line x1="0" y1="10" x2="34" y2="10"/><polyline points="28 4 34 10 28 16"/></svg></div>`;
        grid.innerHTML = steps.map((s, i) => `
            <div class="step-card" style="transition-delay:${i * 120}ms">
                <div class="step-number">${s.n}</div><h3>${s.t}</h3><p>${s.d}</p>
            </div>${i < steps.length - 1 ? arrow : ''}`).join('');
    }

    function renderFAQ() {
        const list = $('#faqList');
        if (!list) return;
        const faqs = [
            { q: 'Apakah SaveTube benar-benar gratis?', a: 'Ya, SaveTube 100% gratis. Tidak ada biaya tersembunyi, tidak perlu registrasi, dan tidak ada batasan download.' },
            { q: 'Kualitas video apa saja yang tersedia?', a: 'Kami menyediakan 360p, 480p, 720p (HD), 1080p (Full HD), dan 2160p (4K). Ketersediaan tergantung video aslinya.' },
            { q: 'Bisakah mengkonversi video ke MP3?', a: 'Tentu! Pilih tab "Audio (MP3)" lalu pilih kualitas audio 128kbps, 256kbps, atau 320kbps.' },
            { q: 'Apakah bisa digunakan di HP?', a: 'Ya! SaveTube responsif dan bisa digunakan di iPhone, Android, iPad, laptop, dan desktop.' },
            { q: 'Apakah aman menggunakan SaveTube?', a: 'Keamanan pengguna adalah prioritas. Kami tidak menyimpan data apapun dan semua proses terenkripsi.' }
        ];
        list.innerHTML = faqs.map(f => `
            <div class="faq-item">
                <button class="faq-question" aria-expanded="false"><span>${f.q}</span>
                    <svg class="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div class="faq-answer"><p>${f.a}</p></div>
            </div>`).join('');
        // FAQ toggle
        list.querySelectorAll('.faq-question').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.closest('.faq-item');
                const isActive = item.classList.contains('active');
                list.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
                if (!isActive) item.classList.add('active');
                btn.setAttribute('aria-expanded', !isActive);
            });
        });
    }

    // ===== API BASE URL =====
    const API_BASE = window.location.origin;

    // ===== QUALITY RENDERING (from real video data) =====
    function renderQualityFromData(videoFormats, audioFormats) {
        const dlIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

        function getBadge(height) {
            if (height >= 2160) return { cls: 'premium', text: '4K' };
            if (height >= 1080) return { cls: 'hd', text: 'FHD' };
            if (height >= 720) return { cls: 'hd', text: 'HD' };
            return { cls: 'sd', text: 'SD' };
        }

        function formatSize(bytes) {
            if (!bytes) return '';
            const mb = (parseInt(bytes) / (1024 * 1024)).toFixed(1);
            return `~${mb} MB`;
        }

        // Render video formats
        if (videoFormats.length > 0) {
            qualityOptions.innerHTML = videoFormats.map(f => {
                const badge = getBadge(f.height);
                const size = formatSize(f.contentLength);
                const voLabel = f.videoOnly ? ' <span style="opacity:0.5;font-size:0.75rem">(video only)</span>' : '';
                return `<div class="quality-item">
                    <div class="quality-label">
                        <span class="quality-badge ${badge.cls}">${badge.text}</span>
                        <span>${f.quality || f.height + 'p'}${voLabel} ${size ? '— ' + size : ''}</span>
                    </div>
                    <button class="btn-download" data-itag="${f.itag}" data-format="mp4">${dlIcon} Download</button>
                </div>`;
            }).join('');
        } else {
            qualityOptions.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:16px;">Tidak ada format video tersedia</p>';
        }

        // Render audio formats
        if (audioFormats.length > 0) {
            audioOptions.innerHTML = audioFormats.map(f => {
                const bitrate = f.audioBitrate || 0;
                let badge = { cls: 'sd', text: `${bitrate}k` };
                if (bitrate >= 256) badge.cls = 'premium';
                else if (bitrate >= 128) badge.cls = 'hd';
                const size = formatSize(f.contentLength);
                return `<div class="quality-item">
                    <div class="quality-label">
                        <span class="quality-badge ${badge.cls}">${badge.text}</span>
                        <span>MP3 — ${bitrate}kbps ${size ? '— ' + size : ''}</span>
                    </div>
                    <button class="btn-download" data-itag="${f.itag}" data-format="mp3">${dlIcon} Download</button>
                </div>`;
            }).join('');
        } else {
            audioOptions.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:16px;">Tidak ada format audio tersedia</p>';
        }
    }

    // ===== YOUTUBE UTILS =====
    function extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
            /^([a-zA-Z0-9_-]{11})$/
        ];
        for (const p of patterns) {
            const m = url.match(p);
            if (m) return m[1];
        }
        return null;
    }

    // ===== FETCH VIDEO INFO (via backend API) =====
    async function fetchVideoInfo(videoId) {
        showLoading(true);
        hideError();
        resultSection.style.display = 'none';

        try {
            const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const res = await fetch(`${API_BASE}/api/info?url=${encodeURIComponent(ytUrl)}`);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Video tidak ditemukan');
            }
            const data = await res.json();

            // Set video info
            videoThumbnail.src = data.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            videoThumbnail.onerror = () => { videoThumbnail.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; };
            videoTitle.textContent = data.title;
            videoChannel.textContent = data.channel;
            videoDuration.textContent = data.duration || '';
            currentVideoId = videoId;

            renderQualityFromData(data.videoFormats || [], data.audioFormats || []);
            resultSection.style.display = 'block';
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

            showToast('Video ditemukan! Pilih kualitas untuk download.', 'success');
        } catch (err) {
            showError(err.message || 'Video tidak ditemukan. Pastikan link YouTube valid dan coba lagi.');
        } finally {
            showLoading(false);
        }
    }

    // ===== DOWNLOAD HANDLER (via backend API) =====
    function handleDownload(itag, format) {
        if (!currentVideoId) return;
        showToast(`Memproses download...`, 'info');

        const ytUrl = `https://www.youtube.com/watch?v=${currentVideoId}`;
        const type = format === 'mp3' ? 'audio' : 'video';
        const downloadUrl = `${API_BASE}/api/download?url=${encodeURIComponent(ytUrl)}&itag=${itag}&type=${type}`;

        // Create invisible link and trigger download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        showToast('Download dimulai! Cek folder download kamu.', 'success');
    }

    // ===== UI HELPERS =====
    function showLoading(show) {
        loadingBar.classList.toggle('active', show);
        btnFetch.disabled = show;
        if (show) btnFetch.style.opacity = '0.7';
        else btnFetch.style.opacity = '1';
    }

    function showError(msg) {
        errorToast.textContent = msg;
        errorToast.classList.add('active');
    }

    function hideError() {
        errorToast.classList.remove('active');
    }

    function showToast(msg, type = 'info') {
        const container = $('#toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // ===== SCROLL ANIMATIONS =====
    function initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        document.querySelectorAll('.feature-card, .step-card').forEach(el => observer.observe(el));
    }

    // ===== EVENT LISTENERS =====
    function initEvents() {
        // Fetch video
        btnFetch.addEventListener('click', () => {
            const url = urlInput.value.trim();
            if (!url) { showError('Masukkan link YouTube terlebih dahulu.'); return; }
            const videoId = extractVideoId(url);
            if (!videoId) { showError('Link YouTube tidak valid. Contoh: https://youtube.com/watch?v=xxxxx'); return; }
            fetchVideoInfo(videoId);
        });

        // Enter key
        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') btnFetch.click();
        });

        // Clear button
        urlInput.addEventListener('input', () => {
            btnClear.style.display = urlInput.value ? 'block' : 'none';
            hideError();
        });
        btnClear.addEventListener('click', () => {
            urlInput.value = '';
            btnClear.style.display = 'none';
            urlInput.focus();
            hideError();
        });

        // Format tabs
        tabVideo.addEventListener('click', () => {
            tabVideo.classList.add('active');
            tabAudio.classList.remove('active');
            qualityOptions.style.display = 'flex';
            audioOptions.style.display = 'none';
        });
        tabAudio.addEventListener('click', () => {
            tabAudio.classList.add('active');
            tabVideo.classList.remove('active');
            audioOptions.style.display = 'flex';
            qualityOptions.style.display = 'none';
        });

        // Download buttons (delegated)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-download');
            if (btn) {
                const itag = btn.dataset.itag;
                const format = btn.dataset.format;
                handleDownload(itag, format);
            }
        });

        // Mobile menu
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            mobileNav.classList.toggle('active');
        });
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                mobileNav.classList.remove('active');
            });
        });

        // Header scroll effect
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const header = $('#header');
            const scrollY = window.scrollY;
            if (scrollY > 50) header.style.background = 'rgba(10,10,26,0.9)';
            else header.style.background = 'rgba(10,10,26,0.7)';
            lastScroll = scrollY;
        }, { passive: true });

        // Smooth scroll for nav links
        document.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', (e) => {
                const href = a.getAttribute('href');
                if (href === '#') return;
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        // Paste from clipboard shortcut
        urlInput.addEventListener('focus', async () => {
            if (urlInput.value) return;
            try {
                const text = await navigator.clipboard.readText();
                if (text && extractVideoId(text)) {
                    urlInput.value = text;
                    btnClear.style.display = 'block';
                    showToast('Link YouTube terdeteksi dari clipboard!', 'info');
                }
            } catch (e) { /* clipboard access denied - that's ok */ }
        });
    }

    // ===== INIT =====
    document.addEventListener('DOMContentLoaded', () => {
        createParticles();
        renderFeatures();
        renderSteps();
        renderFAQ();
        initEvents();
        // Delay scroll animations slightly for paint
        requestAnimationFrame(() => {
            requestAnimationFrame(() => initScrollAnimations());
        });
    });
})();
