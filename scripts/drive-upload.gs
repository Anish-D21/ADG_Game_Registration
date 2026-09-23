/**
 * DECEPTION - ID card uploader
 *
 * Paste this into script.google.com and deploy it as a Web App. It runs as YOU,
 * writing into YOUR Drive and using YOUR 15GB, which is why the server never needs
 * a Google credential of any kind - only the deploy URL and a shared token.
 *
 * SETUP
 *  1. script.google.com -> New project -> paste this file
 *  2. Project Settings -> Script Properties -> Add:
 *       UPLOAD_TOKEN   = a long random string (must match DRIVE_UPLOAD_TOKEN on the server)
 *       FOLDER_NAME    = DECEPTION ID Cards        (optional, this is the default)
 *  3. Deploy -> New deployment -> type "Web app"
 *       Execute as:        Me
 *       Who has access:    Anyone
 *     ("Anyone" is required because Render calls this without a Google login.
 *      The UPLOAD_TOKEN is what actually protects it.)
 *  4. Authorise when prompted, then copy the /exec URL
 *  5. Put that URL in DRIVE_UPLOAD_URL on the server
 *
 * PRIVACY: files are left private to your Drive on purpose. These are student ID
 * cards. Anyone signed into your Google account can open them; to let a co-organiser
 * review them, share the folder with that person from Drive rather than making the
 * files public by link.
 */

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var props = PropertiesService.getScriptProperties();
    var expected = props.getProperty('UPLOAD_TOKEN');

    if (!expected || body.token !== expected) {
      return json({ success: false, message: 'Unauthorised' });
    }
    if (!body.dataBase64 || !body.mimeType) {
      return json({ success: false, message: 'Missing file data' });
    }

    var folder = getFolder(props.getProperty('FOLDER_NAME') || 'DECEPTION ID Cards');

    // Name the file so it is identifiable in Drive without opening it.
    var safeOwner = String(body.ownerName || 'participant').replace(/[^\w .\-]/g, '');
    var safeReg = String(body.registrationId || 'unassigned').replace(/[^\w.\-]/g, '');
    var ext = (body.mimeType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    var name = safeReg + ' - ' + safeOwner + '.' + ext;

    var blob = Utilities.newBlob(Utilities.base64Decode(body.dataBase64), body.mimeType, name);
    var file = folder.createFile(blob);

    return json({
      success: true,
      fileId: file.getId(),
      url: 'https://drive.google.com/file/d/' + file.getId() + '/view',
      name: name
    });
  } catch (err) {
    return json({ success: false, message: String(err) });
  }
}

function getFolder(name) {
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Lets you confirm the deployment is live by opening the URL in a browser. */
function doGet() {
  return json({ success: true, service: 'DECEPTION ID card uploader', ready: true });
}
