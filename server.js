const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const path = require('path');
const fs = require('fs');

// Create agent with cookies if available
const cookiePath = path.join(__dirname, 'cookies.json');
let agent;
if (fs.existsSync(cookiePath)) {
    try {
        const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
        agent = ytdl.createAgent(cookies);
        console.log('✅ Cookies loaded successfully');
    } catch (err) {
        console.error('❌ Failed to load cookies:', err.message);
    }
} else {
    console.log('⚠️ No cookies.json found. If you encounter 403 errors, please add cookies.json');
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ===== GET VIDEO INFO =====
app.get('/api/info', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL diperlukan' });

    try {
        const options = {
            agent,
            lang: 'en',
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.youtube.com/',
                }
            }
        };

        const info = await ytdl.getInfo(url, options);
        const videoDetails = info.videoDetails;

        // Get available formats
        const formats = info.formats;

        // Filter video formats with audio
        const videoFormats = formats
            .filter(f => f.hasVideo && f.hasAudio && f.container === 'mp4')
            .map(f => ({
                itag: f.itag,
                quality: f.qualityLabel,
                height: f.height,
                mimeType: f.mimeType,
                contentLength: f.contentLength,
                fps: f.fps
            }))
            .sort((a, b) => (b.height || 0) - (a.height || 0));

        // Also get video-only for higher qualities
        const videoOnlyFormats = formats
            .filter(f => f.hasVideo && !f.hasAudio && f.container === 'mp4')
            .map(f => ({
                itag: f.itag,
                quality: f.qualityLabel,
                height: f.height,
                mimeType: f.mimeType,
                contentLength: f.contentLength,
                fps: f.fps,
                videoOnly: true
            }))
            .sort((a, b) => (b.height || 0) - (a.height || 0));

        // Audio formats
        const audioFormats = formats
            .filter(f => f.hasAudio && !f.hasVideo)
            .map(f => ({
                itag: f.itag,
                audioBitrate: f.audioBitrate,
                mimeType: f.mimeType,
                contentLength: f.contentLength
            }))
            .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

        // Deduplicate video formats by height
        const seenHeights = new Set();
        const uniqueVideoFormats = [];
        // Prefer formats with audio first  
        for (const f of videoFormats) {
            if (f.height && !seenHeights.has(f.height)) {
                seenHeights.add(f.height);
                uniqueVideoFormats.push(f);
            }
        }
        // Then add video-only for higher res not already covered
        for (const f of videoOnlyFormats) {
            if (f.height && !seenHeights.has(f.height)) {
                seenHeights.add(f.height);
                uniqueVideoFormats.push(f);
            }
        }
        uniqueVideoFormats.sort((a, b) => (b.height || 0) - (a.height || 0));

        const duration = parseInt(videoDetails.lengthSeconds);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        res.json({
            videoId: videoDetails.videoId,
            title: videoDetails.title,
            channel: videoDetails.author.name,
            duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url || '',
            videoFormats: uniqueVideoFormats,
            audioFormats: audioFormats
        });
    } catch (err) {
        console.error('Info error:', err.message);
        res.status(500).json({ error: 'Gagal mengambil info video. Pastikan URL valid.' });
    }
});

// ===== DOWNLOAD VIDEO =====
app.get('/api/download', async (req, res) => {
    const { url, itag, type } = req.query;
    if (!url) return res.status(400).json({ error: 'URL diperlukan' });

    try {
        const options = {
            agent,
            lang: 'en',
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.youtube.com/',
                }
            }
        };

        const info = await ytdl.getInfo(url, options);
        const title = info.videoDetails.title.replace(/[^\w\s-]/g, '').trim();

        if (type === 'audio') {
            // Download audio only
            res.header('Content-Disposition', `attachment; filename="${title}.mp3"`);
            res.header('Content-Type', 'audio/mpeg');

            const stream = ytdl(url, {
                quality: 'highestaudio',
                filter: 'audioonly',
                agent,
                requestOptions: options.requestOptions,
                highWaterMark: 1 << 25 // 32MB buffer for smoother streaming
            });
            stream.pipe(res);
            stream.on('error', (err) => {
                console.error('Audio stream error:', err.message);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Download audio gagal' });
                }
            });
        } else {
            // Download video
            const selectedItag = itag ? parseInt(itag) : null;
            const downloadOptions = {
                quality: selectedItag || 'highest',
                agent,
                requestOptions: options.requestOptions,
                highWaterMark: 1 << 25
            };

            res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
            res.header('Content-Type', 'video/mp4');

            const format = info.formats.find(f => f.itag === selectedItag);
            if (format && format.contentLength) {
                res.header('Content-Length', format.contentLength);
            }

            const stream = ytdl(url, downloadOptions);
            stream.pipe(res);
            stream.on('error', (err) => {
                console.error('Video stream error:', err.message);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Download video gagal' });
                }
            });
        }
    } catch (err) {
        console.error('Download error:', err.message);
        res.status(500).json({ error: 'Download gagal. Coba lagi.' });
    }
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`\n🚀 SaveTube Server berjalan di http://localhost:${PORT}\n`);
    console.log('Buka http://localhost:3000 di browser untuk mulai download!\n');
});
