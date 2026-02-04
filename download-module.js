// ============================================
// DOWNLOAD MODULE - Production Ready
// ============================================
(function(window) {
    'use strict';
    
    // ============================================
    // CONSTANTS
    // ============================================
    var CONSTANTS = {
        // Timing
        BLOB_CLEANUP_DELAY_MS: 100,
        DOWNLOAD_THROTTLE_MS: 1000,
        DOWNLOAD_TIMEOUT_MS: 30000,
        
        // Quality settings
        JPG_QUALITY_LARGE: 0.98,      // >10MP
        JPG_QUALITY_MEDIUM: 0.95,     // 5-10MP
        JPG_QUALITY_SMALL: 0.92,      // <5MP
        
        // Thresholds
        PIXELS_LARGE_THRESHOLD: 10000000,
        PIXELS_MEDIUM_THRESHOLD: 5000000,
        
        // Limits
        MAX_CANVAS_DIMENSION: 32767,
        MAX_SAFE_PIXELS: Number.MAX_SAFE_INTEGER
    };
    
    // ============================================
    // ERROR MESSAGES
    // ============================================
    var ERROR_MESSAGES = {
        DOWNLOAD_GENERIC: 'Download failed. Please try again.',
        DOWNLOAD_SIZE: 'Image too large for download. Try reducing dimensions.',
        DOWNLOAD_CORS: 'Cannot download: Image from different source. Please re-upload.',
        DOWNLOAD_TIMEOUT: 'Download timed out. Keep this tab active and try again.',
        DOWNLOAD_THROTTLE: 'Please wait before downloading again.',
        FORMAT_INVALID: 'Invalid format selected. Using PNG.',
        BLOB_CREATION_FAILED: 'Failed to create download file. Image may be too large.',
        CANVAS_TAINTED: 'Security error: Cannot download cross-origin image.',
        INVALID_DIMENSIONS: 'Invalid output dimensions. Please adjust corners.',
        DIMENSION_TOO_LARGE: 'Output too large. Maximum {max}px per side.'
    };
    
    // ============================================
    // STATE MANAGEMENT
    // ============================================
    var DownloadState = {
        IDLE: 'idle',
        VALIDATING: 'validating',
        PROCESSING: 'processing',
        CONVERTING: 'converting',
        DOWNLOADING: 'downloading',
        ERROR: 'error'
    };
    
    var state = {
        current: DownloadState.IDLE,
        lastDownloadTime: 0,
        selectedFormat: null,
        activeBlobUrls: [],
        downloadTimeoutId: null
    };
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    /**
     * Sanitize filename to prevent XSS
     */
    function sanitizeFilename(name) {
        if (typeof name !== 'string') {
            return 'download';
        }
        return name.replace(/[^a-zA-Z0-9._-]/g, '_');
    }
    
    /**
     * Validate file format
     */
    function validateFormat(format) {
        var validFormats = ['png', 'jpg', 'jpeg'];
        if (typeof format !== 'string') {
            return 'png';
        }
        var normalized = format.toLowerCase().trim();
        return validFormats.indexOf(normalized) !== -1 ? normalized : 'png';
    }
    
    /**
     * Calculate adaptive JPG quality based on image size
     */
    function calculateQuality(canvas) {
        if (!canvas || !canvas.width || !canvas.height) {
            return CONSTANTS.JPG_QUALITY_MEDIUM;
        }
        
        var w = Math.min(canvas.width, CONSTANTS.MAX_CANVAS_DIMENSION);
        var h = Math.min(canvas.height, CONSTANTS.MAX_CANVAS_DIMENSION);
        
        // Check for overflow
        if (w > CONSTANTS.MAX_SAFE_PIXELS / h) {
            return CONSTANTS.JPG_QUALITY_LARGE; // Assume huge image
        }
        
        var totalPixels = w * h;
        
        if (totalPixels > CONSTANTS.PIXELS_LARGE_THRESHOLD) {
            return CONSTANTS.JPG_QUALITY_LARGE;
        } else if (totalPixels > CONSTANTS.PIXELS_MEDIUM_THRESHOLD) {
            return CONSTANTS.JPG_QUALITY_MEDIUM;
        } else {
            return CONSTANTS.JPG_QUALITY_SMALL;
        }
    }
    
    /**
     * Release canvas resources
     */
    function releaseCanvas(canvas) {
        if (!canvas) return;
        
        try {
            var ctx = canvas.getContext('2d');
            if (ctx) {
                // Clear all pixels
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Reset to minimal size to free GPU memory
                canvas.width = 1;
                canvas.height = 1;
                ctx.clearRect(0, 0, 1, 1);
            }
        } catch (e) {
            console.warn('Canvas release failed:', e);
        }
    }
    
    /**
     * Clean up blob URL
     */
    function cleanupBlobUrl(url) {
        if (!url) return;
        
        try {
            URL.revokeObjectURL(url);
            
            var idx = state.activeBlobUrls.indexOf(url);
            if (idx > -1) {
                state.activeBlobUrls.splice(idx, 1);
            }
        } catch (e) {
            console.warn('Blob URL cleanup failed:', e);
        }
    }
    
    /**
     * Clean up all active blob URLs
     */
    function cleanupAllBlobUrls() {
        state.activeBlobUrls.forEach(function(url) {
            try {
                URL.revokeObjectURL(url);
            } catch (e) {
                console.warn('Cleanup failed for URL:', url, e);
            }
        });
        state.activeBlobUrls = [];
    }
    
    /**
     * Detect if canvas is tainted
     */
    function isCanvasTainted(canvas) {
        try {
            canvas.toDataURL();
            return false;
        } catch (e) {
            if (e.name === 'SecurityError') {
                return true;
            }
            return false;
        }
    }
    
    /**
     * Validate canvas dimensions
     */
    function validateCanvasDimensions(canvas) {
        if (!canvas) {
            return { valid: false, error: 'INVALID_DIMENSIONS' };
        }
        
        var w = canvas.width;
        var h = canvas.height;
        
        if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) {
            return { valid: false, error: 'INVALID_DIMENSIONS' };
        }
        
        if (w > CONSTANTS.MAX_CANVAS_DIMENSION || h > CONSTANTS.MAX_CANVAS_DIMENSION) {
            return { 
                valid: false, 
                error: 'DIMENSION_TOO_LARGE',
                params: { max: CONSTANTS.MAX_CANVAS_DIMENSION }
            };
        }
        
        return { valid: true };
    }
    
    /**
     * Format error message with parameters
     */
    function formatErrorMessage(errorKey, params) {
        var message = ERROR_MESSAGES[errorKey] || errorKey;
        
        if (params) {
            Object.keys(params).forEach(function(key) {
                message = message.replace('{' + key + '}', params[key]);
            });
        }
        
        return message;
    }
    
    // ============================================
    // DOWNLOAD FUNCTION
    // ============================================
    
    /**
     * Download canvas as image
     * @param {HTMLCanvasElement} canvas - Canvas to download
     * @param {string} format - 'png' or 'jpg'
     * @param {Function} onSuccess - Success callback
     * @param {Function} onError - Error callback
     */
    function downloadCanvas(canvas, format, onSuccess, onError) {
        // Validate inputs
        var validation = validateCanvasDimensions(canvas);
        if (!validation.valid) {
            var errorMsg = formatErrorMessage(validation.error, validation.params);
            if (onError) onError(errorMsg);
            return;
        }
        
        // Check if canvas is tainted
        if (isCanvasTainted(canvas)) {
            if (onError) onError(formatErrorMessage('CANVAS_TAINTED'));
            return;
        }
        
        // Validate and normalize format
        format = validateFormat(format);
        var extension = format === 'jpg' || format === 'jpeg' ? 'jpg' : 'png';
        var mimeType = extension === 'jpg' ? 'image/jpeg' : 'image/png';
        
        // Sanitize filename
        var filename = sanitizeFilename('perspectivefix-corrected') + '.' + extension;
        
        // Calculate quality for JPG
        var quality = extension === 'jpg' ? calculateQuality(canvas) : undefined;
        
        // Set timeout for blob creation
        var timeoutId = setTimeout(function() {
            if (onError) {
                onError(formatErrorMessage('DOWNLOAD_TIMEOUT'));
            }
        }, CONSTANTS.DOWNLOAD_TIMEOUT_MS);
        
        // Use toBlob if available (better for large files)
        if (canvas.toBlob && typeof canvas.toBlob === 'function') {
            try {
                canvas.toBlob(function(blob) {
                    clearTimeout(timeoutId);
                    
                    if (!blob) {
                        if (onError) {
                            onError(formatErrorMessage('BLOB_CREATION_FAILED'));
                        }
                        return;
                    }
                    
                    try {
                        var url = URL.createObjectURL(blob);
                        state.activeBlobUrls.push(url);
                        
                        var link = document.createElement('a');
                        link.download = filename;
                        link.href = url;
                        
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        // Schedule cleanup
                        setTimeout(function() {
                            cleanupBlobUrl(url);
                        }, CONSTANTS.BLOB_CLEANUP_DELAY_MS);
                        
                        if (onSuccess) {
                            onSuccess(filename);
                        }
                    } catch (err) {
                        console.error('Blob download error:', err);
                        if (onError) {
                            onError(formatErrorMessage('DOWNLOAD_GENERIC'));
                        }
                    }
                }, mimeType, quality);
            } catch (err) {
                clearTimeout(timeoutId);
                console.error('toBlob error:', err);
                if (onError) {
                    onError(formatErrorMessage('DOWNLOAD_GENERIC'));
                }
            }
        } else {
            // Fallback to toDataURL for older browsers
            clearTimeout(timeoutId);
            
            try {
                var link = document.createElement('a');
                link.download = filename;
                
                if (extension === 'jpg') {
                    link.href = canvas.toDataURL(mimeType, quality);
                } else {
                    link.href = canvas.toDataURL(mimeType);
                }
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                if (onSuccess) {
                    onSuccess(filename);
                }
            } catch (err) {
                console.error('toDataURL error:', err);
                
                if (err.name === 'SecurityError') {
                    if (onError) {
                        onError(formatErrorMessage('CANVAS_TAINTED'));
                    }
                } else {
                    if (onError) {
                        onError(formatErrorMessage('DOWNLOAD_SIZE'));
                    }
                }
            }
        }
    }
    
    // ============================================
    // CLEANUP ON UNLOAD
    // ============================================
    window.addEventListener('beforeunload', function() {
        cleanupAllBlobUrls();
    });
    
    // ============================================
    // EXPORT
    // ============================================
    window.DownloadModule = {
        download: downloadCanvas,
        releaseCanvas: releaseCanvas,
        validateFormat: validateFormat,
        cleanupAllBlobUrls: cleanupAllBlobUrls,
        CONSTANTS: CONSTANTS,
        ERROR_MESSAGES: ERROR_MESSAGES
    };
    
})(window);
