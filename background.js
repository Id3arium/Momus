// Background script to handle downloads
// This persists across popup closes

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'download') {
    const { jsonData, filename, isBulkScrape } = message;

    // Create blob and download
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Determine download path and behavior
    const downloadOptions = {
      url: url,
      filename: isBulkScrape ? `reviews/${filename}` : filename,
      saveAs: !isBulkScrape  // Auto-download for bulk, prompt for single scrapes
    };

    browser.downloads.download(downloadOptions).then(() => {
      // Clean up blob URL after download starts
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }).catch(error => {
      console.error('Download failed:', error);
    });

    return true; // Keep message channel open for async response
  }
});

console.log('[Background] Momus background script loaded');
