/**
 * @file driveService.js
 * @description Pushes uploaded ID cards into the organiser's Google Drive.
 *
 * Uploads go to an Apps Script web app running under the organiser's own Google
 * account (see scripts/drive-upload.gs). That script writes the file as them, using
 * their storage, so this server holds no Google credential at all - only a URL and a
 * shared token. A Drive service account cannot be used here: service accounts have no
 * storage quota of their own and every upload fails with "quota exceeded".
 *
 * If Drive is unconfigured or unreachable the caller keeps the image inline, so a
 * student is never blocked from registering by a storage problem.
 */

const TIMEOUT_MS = 20000;

export function isConfigured() {
  return Boolean(process.env.DRIVE_UPLOAD_URL && process.env.DRIVE_UPLOAD_TOKEN);
}

/**
 * @param {object} params
 * @param {string} params.dataUrl  full data: URL from the browser
 * @param {string} params.mimeType e.g. image/png
 * @param {string} [params.ownerName]
 * @param {string} [params.registrationId]
 * @returns {Promise<{url:string, fileId:string}|null>} null when Drive is unavailable
 */
export async function uploadToDrive({ dataUrl, mimeType, ownerName, registrationId }) {
  if (!isConfigured()) return null;

  const base64 = String(dataUrl).slice(String(dataUrl).indexOf(',') + 1);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(process.env.DRIVE_UPLOAD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: process.env.DRIVE_UPLOAD_TOKEN,
        dataBase64: base64,
        mimeType,
        ownerName,
        registrationId
      }),
      signal: controller.signal,
      // Apps Script answers /exec with a redirect to googleusercontent.com.
      redirect: 'follow'
    });

    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`Drive returned a non-JSON response (${res.status}). Check the deployment is set to "Anyone" access.`);
    }

    if (!body.success) {
      throw new Error(body.message || 'Drive upload rejected');
    }
    return { url: body.url, fileId: body.fileId, name: body.name };
  } catch (err) {
    const reason = err.name === 'AbortError' ? `timed out after ${TIMEOUT_MS}ms` : err.message;
    console.warn(`[Drive] Upload failed (${reason}). Keeping the image inline instead.`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export default { uploadToDrive, isConfigured };
