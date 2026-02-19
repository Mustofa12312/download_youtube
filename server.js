const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const YTDLP_PATH = path.join(__dirname, 'yt-dlp');

// Helper function to get video info
function getYtDlpInfo(url) {
    return new Promise((resolve, reject) => {
        // -j: dump JSON
        // --no-playlist: only single video
        // --cookies: use cookies if exist
        const args = ['-j', '--no-playlist', url];

        if (fs.existsSync(path.join(__dirname, 'cookies.json'))) {
            args.push('--cookies', path.join(__dirname, 'cookies.json'));
        }

        const process = spawn(YTDLP_PATH, args);
        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        process.on('close', (code) => {
            if (code === 0) {
                try {
                    const info = JSON.parse(stdout);
                    resolve(info);
                } catch (e) {
                    reject(new Error('Failed to parse JSON output'));
                }
            } else {
                reject(new Error(stderr || 'yt-dlp process failed'));
            }
        });
    });
}

// ===== GET VIDEO INFO =====
app.get('/api/info', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL diperlukan' });

    try {
        const info = await getYtDlpInfo(url);

        // Map yt-dlp formats to our structure
        const formats = info.formats || [];

        // Filter valid formats
        const videoFormats = formats
            .filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.ext === 'mp4') // Video + Audio
            .map(f => ({
                itag: f.format_id, // Use format_id as identifier
                quality: f.format_note || `${f.height}p`,
                height: f.height,
                mimeType: `video/${f.ext}`,
                contentLength: f.filesize || f.filesize_approx,
                fps: f.fps
            }))
            .sort((a, b) => (b.height || 0) - (a.height || 0));

        const videoOnlyFormats = formats
            .filter(f => f.vcodec !== 'none' && f.acodec === 'none' && f.ext === 'mp4') // Video Only
            .map(f => ({
                itag: f.format_id,
                quality: f.format_note || `${f.height}p`,
                height: f.height,
                mimeType: `video/${f.ext}`,
                contentLength: f.filesize || f.filesize_approx,
                fps: f.fps,
                videoOnly: true
            }))
            .sort((a, b) => (b.height || 0) - (a.height || 0));

        const audioFormats = formats
            .filter(f => f.vcodec === 'none' && f.acodec !== 'none') // Audio Only
            .map(f => ({
                itag: f.format_id,
                audioBitrate: f.abr,
                mimeType: `audio/${f.ext}`,
                contentLength: f.filesize || f.filesize_approx
            }))
            .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

        // Deduplicate logic
        const seenHeights = new Set();
        const uniqueVideoFormats = [];

        for (const f of videoFormats) {
            if (f.height && !seenHeights.has(f.height)) {
                seenHeights.add(f.height);
                uniqueVideoFormats.push(f);
            }
        }
        for (const f of videoOnlyFormats) {
            if (f.height && !seenHeights.has(f.height)) {
                seenHeights.add(f.height);
                uniqueVideoFormats.push(f);
            }
        }
        uniqueVideoFormats.sort((a, b) => (b.height || 0) - (a.height || 0));

        // Duration formatting
        const duration = info.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        res.json({
            videoId: info.id,
            title: info.title,
            channel: info.uploader,
            duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            thumbnail: info.thumbnail,
            videoFormats: uniqueVideoFormats,
            audioFormats: audioFormats
        });

    } catch (err) {
        console.error('Info error:', err.message);
        res.status(500).json({ error: 'Gagal mengambil info. Pastikan URL valid atau coba lagi nanti.' });
    }
});

// ===== DOWNLOAD VIDEO =====
app.get('/api/download', (req, res) => {
    const { url, itag, type } = req.query;
    if (!url) return res.status(400).json({ error: 'URL diperlukan' });

    // Try to get title first? No, too slow. Just stream.
    // Use generic name or we can pass title from frontend if we want perfect filenames.
    // But backend should handle headers.
    // We'll use "video.mp4" or "audio.mp3" as default, or try to get filename from yt-dlp first?
    // Getting filename requires another call.
    // Let's use a generic name for now to be fast, or rely on frontend passing title?
    // Frontend logic passes url, itag, type.

    const filename = `download-${Date.now()}.${type === 'audio' ? 'mp3' : 'mp4'}`;

    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    if (type === 'audio') {
        res.header('Content-Type', 'audio/mpeg');
    } else {
        res.header('Content-Type', 'video/mp4');
    }

    const args = [];
    if (fs.existsSync(path.join(__dirname, 'cookies.json'))) {
        args.push('--cookies', path.join(__dirname, 'cookies.json'));
    }

    if (type === 'audio') {
        // Download audio
        // -f bestaudio -x --audio-format mp3 
        // Streaming via stdout requires -o -
        // But transcoding to mp3 might not work easily via stdout pipe without ffmpeg strict.
        // yt-dlp can stream original audio format.
        // If we want mp3, yt-dlp needs ffmpeg installed.
        // Let's assume user wants 'bestaudio' regardless of format or just stream the itag.
        if (itag) {
            args.push('-f', itag);
        } else {
            args.push('-f', 'bestaudio');
        }
    } else {
        // Video
        if (itag) {
            // Check if itag is video-only. If so, we need to merge audio?
            // Merging requires ffmpeg and writing to file first usually.
            // Streaming merge to stdout is tricky but yt-dlp supports it if ffmpeg is present.
            // safely: -f itag+bestaudio/best
            args.push('-f', `${itag}+bestaudio/best`);
        } else {
            args.push('-f', 'best');
        }
    }

    args.push('-o', '-', url); // Output to stdout

    const process = spawn(YTDLP_PATH, args);

    process.stdout.pipe(res);

    process.stderr.on('data', (data) => {
        console.error(`yt-dlp stderr: ${data}`);
    });

    process.on('close', (code) => {
        if (code !== 0) {
            console.error(`yt-dlp exited with code ${code}`);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Download failed' });
            }
        }
    });

    // Handle client disconnect
    req.on('close', () => {
        process.kill();
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`\n🚀 SaveTube Server (yt-dlp) berjalan di http://localhost:${PORT}\n`);
    console.log('Buka http://localhost:3000 di browser untuk mulai download!\n');
});
