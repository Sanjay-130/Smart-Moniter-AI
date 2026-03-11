import axios from 'axios';
import asyncHandler from 'express-async-handler';

// ── Wandbox: 100% free, no API key, no registration, open-source ──
// Docs: https://github.com/melpon/wandbox/blob/master/kennel2/API.rst
const WANDBOX_URL = 'https://wandbox.org/api/compile.json';

// Wandbox compiler IDs — verified live from https://wandbox.org/api/list.json
const LANG_CONFIG = {
    python: { compiler: 'cpython-3.13.8', options: '' },
    javascript: { compiler: 'nodejs-20.17.0', options: '' },
    java: { compiler: 'openjdk-jdk-22+36', options: '' },
    cpp: { compiler: 'gcc-13.2.0', options: 'c++17,warning' },
    c: { compiler: 'gcc-13.2.0-c', options: 'c11,warning' },
};

// Fallback compiler IDs tried automatically if the primary fails
const LANG_FALLBACK = {
    python: ['cpython-3.12.0', 'cpython-3.11.0', 'cpython-3.10.0'],
    javascript: ['nodejs-18.13.0', 'nodejs-16.14.0'],
    java: ['openjdk-jdk-21.0.2+13', 'openjdk-jdk-15.0.3+2'],
    cpp: ['gcc-head', 'gcc-12.3.0'],
    c: ['gcc-head-c', 'gcc-12.3.0-c'],
};

/**
 * Try to execute code on Wandbox. If the primary compiler ID fails
 * (404 / unknown compiler error), attempt fallbacks automatically.
 */
const runOnWandbox = async (langKey, code, input) => {
    const config = LANG_CONFIG[langKey];
    const compilers = [config.compiler, ...(LANG_FALLBACK[langKey] || [])];

    let lastError;
    for (const compiler of compilers) {
        try {
            const payload = {
                code,
                compiler,
                stdin: input ?? '',
            };
            if (config.options) payload.options = config.options;

            const { data } = await axios.post(WANDBOX_URL, payload, {
                timeout: 30000,
                headers: { 'Content-Type': 'application/json' },
            });

            // Wandbox returns { error: "Unknown compiler ..." } for bad compiler IDs
            const wandboxErr = (data.error ?? data.compiler_error ?? '').toLowerCase();
            if (wandboxErr.includes('unknown compiler') || wandboxErr.includes('unknown')) {
                lastError = new Error(`Compiler "${compiler}" not found on Wandbox`);
                continue;
            }

            return data;
        } catch (err) {
            lastError = err;
            // 4xx means bad compiler name — try next; 5xx/network → stop
            if (err.response && err.response.status >= 500) throw err;
        }
    }
    throw lastError;
};

// @desc    Compile and execute code via Wandbox (free, no API key)
// @route   POST /api/compile
// @access  Private
export const compileCode = asyncHandler(async (req, res) => {
    const { language, code, input } = req.body;

    if (!code || !code.trim()) {
        res.status(400);
        throw new Error('No code provided');
    }

    const langKey = (language || '').toLowerCase();

    if (!LANG_CONFIG[langKey]) {
        res.status(400);
        throw new Error(
            `Unsupported language: "${language}". Supported: ${Object.keys(LANG_CONFIG).join(', ')}`
        );
    }

    // ── Java: Wandbox saves every submission as "prog.java"
    // Java requires the PUBLIC class name to match the filename.
    // Fix: strip the `public` modifier from ALL top-level class declarations
    // so the class can live in prog.java regardless of its name.
    // Public METHODS and FIELDS are intentionally left untouched.
    let processedCode = code;
    if (langKey === 'java') {
        // Replace "public class Foo" → "class Foo" (handles any class name)
        processedCode = code.replace(/\bpublic\s+(class\s+)/g, '$1');
    }

    try {
        const data = await runOnWandbox(langKey, processedCode, input);

        // Wandbox response fields:
        //   status          → exit code as string ("0" = success)
        //   program_output  → stdout from the running program
        //   program_error   → stderr from the running program (runtime errors)
        //   compiler_output → compiler stdout (warnings etc.)
        //   compiler_error  → compiler stderr (compile errors — takes priority)

        const programOutput = data.program_output ?? '';
        const programError = data.program_error ?? '';
        const compileError = data.compiler_error ?? '';
        const exitCode = parseInt(data.status ?? '0', 10);

        // Compile errors take priority over runtime errors
        const stderr = compileError.trim() || programError.trim();

        // Normalised shape — same as what the frontend already expects
        const normalised = {
            language,
            run: {
                stdout: programOutput,
                stderr,
                code: exitCode,
            },
        };

        res.json(normalised);
    } catch (error) {
        if (res.headersSent) return;

        const msg =
            error.response?.data?.error ??
            error.response?.data ??
            error.message ??
            'Code execution failed';

        console.error('[compileController] Wandbox error:', msg);
        res.status(502);
        throw new Error(`Code execution service error: ${msg}`);
    }
});
