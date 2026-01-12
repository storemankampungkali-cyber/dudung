
/**
 * WAREFLOW MLASS - ADVANCED BACKEND ENGINE
 * -----------------------------------------
 * Petunjuk Instalasi:
 * 1. Buka Google Sheets Anda.
 * 2. Klik Extensions > Apps Script.
 * 3. Hapus semua kode yang ada dan tempel kode ini.
 * 4. Klik ikon Save (Simpan).
 * 5. Klik "Deploy" > "New Deployment".
 * 6. Pilih "Web App".
 * 7. Setel:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 8. Klik Deploy, salin URL yang diberikan (berakhiran /exec).
 * 9. Tempel URL tersebut di tab Admin > Koneksi Cloud pada aplikasi Wareflow.
 *
 * CATATAN: Jangan klik tombol "Jalankan" di editor ini untuk doGet/doPost 
 * karena akan error secara otomatis (membutuhkan parameter web request).
 */

function doGet(e) {
  // Proteksi jika dijalankan manual dari editor
  if (!e || !e.parameter) {
    return ContentService.createTextOutput("Backend Aktif. Gunakan URL ini di aplikasi Wareflow.")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Inisialisasi sheet jika belum ada
  initSheets(ss);

  if (action === 'get_all') {
    return createResponse({
      products: getSheetData(ss.getSheetByName("Products")),
      suppliers: getSheetData(ss.getSheetByName("Suppliers")),
      transactions: getSheetData(ss.getSheetByName("Transactions")),
      users: getSheetData(ss.getSheetByName("Users"))
    });
  }
}

function doPost(e) {
  // Proteksi jika dijalankan manual dari editor
  if (!e || !e.postData) {
    return createResponse({ status: "error", message: "No post data received" });
  }

  const request = JSON.parse(e.postData.contents);
  const action = request.action;
  const data = request.data;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  initSheets(ss);

  try {
    switch(action) {
      case 'save_transaction':
        appendRow(ss.getSheetByName("Transactions"), data);
        break;
      case 'save_product':
        upsertRow(ss.getSheetByName("Products"), "kode", data);
        break;
      case 'delete_product':
        deleteRow(ss.getSheetByName("Products"), "kode", data.kode);
        break;
      case 'save_supplier':
        upsertRow(ss.getSheetByName("Suppliers"), "id", data);
        break;
      case 'delete_supplier':
        deleteRow(ss.getSheetByName("Suppliers"), "id", data.id);
        break;
      case 'save_user':
        upsertRow(ss.getSheetByName("Users"), "username", data);
        break;
      case 'delete_user':
        deleteRow(ss.getSheetByName("Users"), "username", data.username);
        break;
    }
    return createResponse({ status: "success" });
  } catch (err) {
    return createResponse({ status: "error", message: err.toString() });
  }
}

/**
 * Inisialisasi Struktur Google Sheet secara otomatis
 */
function initSheets(ss) {
  const config = [
    { name: "Products", headers: ["kode", "nama", "satuanDefault", "satuanAlt1", "konversiAlt1", "satuanAlt2", "konversiAlt2", "minStok"] },
    { name: "Suppliers", headers: ["id", "nama", "alamat", "telp", "email", "pic", "ket"] },
    { name: "Transactions", headers: ["id", "tgl", "waktu", "jenis", "nama", "kode", "qty", "satuan", "displayQty", "keterangan", "user", "supplier", "noSJ", "noPO"] },
    { name: "Users", headers: ["username", "password", "role", "active", "lastLogin"] }
  ];

  config.forEach(item => {
    let sheet = ss.getSheetByName(item.name);
    if (!sheet) {
      sheet = ss.insertSheet(item.name);
      sheet.appendRow(item.headers);
      sheet.getRange(1, 1, 1, item.headers.length).setFontWeight("bold").setBackground("#f3f3f3");
    }
  });
}

/**
 * Mengambil semua data dari sheet sebagai JSON Array
 */
function getSheetData(sheet) {
  if (!sheet) return [];
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length <= 1) return [];
  
  const headers = values.shift();
  return values.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

/**
 * Menambahkan baris baru ke sheet
 */
function appendRow(sheet, data) {
  const headers = sheet.getDataRange().getValues()[0];
  const row = headers.map(h => data[h] !== undefined ? data[h] : "");
  sheet.appendRow(row);
}

/**
 * Update atau Insert data berdasarkan Key ID
 */
function upsertRow(sheet, idKey, data) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf(idKey);
  
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][idIndex] == data[idKey]) {
      rowIndex = i + 1;
      break;
    }
  }
  
  const rowData = headers.map(h => data[h] !== undefined ? data[h] : "");
  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

/**
 * Menghapus baris berdasarkan Key ID
 */
function deleteRow(sheet, idKey, idValue) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf(idKey);
  for (let i = 1; i < values.length; i++) {
    if (values[i][idIndex] == idValue) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

/**
 * Helper untuk response JSON
 */
function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
