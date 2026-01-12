
/**
 * WAREFLOW MLASS BACKEND ENGINE
 * Paste this code into Extensions > Apps Script in your Google Sheets.
 * Deploy as Web App, set access to "Anyone".
 */

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
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
  const request = JSON.parse(e.postData.contents);
  const action = request.action;
  const data = request.data;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
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

function getSheetData(sheet) {
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  return values.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function appendRow(sheet, data) {
  const headers = sheet.getDataRange().getValues()[0];
  const row = headers.map(h => data[h] || "");
  sheet.appendRow(row);
}

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

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
