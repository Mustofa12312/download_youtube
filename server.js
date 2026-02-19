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
        // --force-ipv4: force ipv4 connection
        const args = ['-j', '--no-playlist', '--force-ipv4', url];


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
    const { url, itag, type, title } = req.query;
    if (!url) return res.status(400).json({ error: 'URL diperlukan' });

    // Sanitize title for filename
    const safeTitle = (title || `download-${Date.now()}`).replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    const ext = type === 'audio' ? 'mp3' : 'mp4';
    const filename = `${safeTitle}.${ext}`;

    // Set headers for file download
    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    res.header('Content-Type', type === 'audio' ? 'audio/mpeg' : 'video/mp4');

    const args = [];

    // Force IPv4 for better connectivity
    args.push('--force-ipv4');

    // Use cookies if available
    if (fs.existsSync(path.join(__dirname, 'cookies.json'))) {
        args.push('--cookies', path.join(__dirname, 'cookies.json'));
    }

    if (type === 'audio') {
        // Audio download logic
        if (itag) {
            args.push('-f', itag);
        } else {
            args.push('-f', 'bestaudio');
        }
    } else {
        // Video download logic
        if (itag) {
            // If specific format requested (e.g. 1080p video-only),
            // try to merge with best audio.
            // Note: Merging requires ffmpeg installed on server.
            // If ffmpeg is missing, this might fail or fallback to unmerged.
            // Since we pipe to stdout, uncontainerized streams (like raw h264) might not play well.
            // Best approach for stream: try direct format if available, else standard format.
            // We use format sorting to prefer mp4 container.
            args.push('-f', `${itag}+bestaudio[ext=m4a]/best[ext=mp4]/best`);
        } else {
            args.push('-f', 'best[ext=mp4]/best');
        }
    }

    // Output to stdout
    args.push('-o', '-');
    args.push(url);

    console.log(`Starting download for: ${url} [${type}]`);

    const process = spawn(YTDLP_PATH, args);

    // Pipe stdout to response
    process.stdout.pipe(res);

    // Initial error handling
    process.stderr.on('data', (data) => {
        const msg = data.toString();
        // Ignore progress info, log errors
        if (!msg.includes('[download]') && !msg.includes('[info]')) {
            console.error(`yt-dlp stderr: ${msg}`);
        }
    });

    process.on('close', (code) => {
        console.log(`Download process finished with code ${code}`);
        if (code !== 0 && !res.headersSent) {
            res.status(500).send('Download failed.');
        }
    });

    // Handle client disconnect
    req.on('close', () => {
        console.log('Client disconnected, killing process.');
        process.kill();
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`\n🚀 SaveTube Server (yt-dlp) berjalan di http://localhost:${PORT}\n`);
    console.log('Buka http://localhost:3000 di browser untuk mulai download!\n');
});
