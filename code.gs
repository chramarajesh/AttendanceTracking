function doGet() {
  const email = Session.getActiveUser().getEmail();
  if (!email.endsWith('@gmail.com')) {
    return HtmlService.createHtmlOutput('Access denied. Domain users only.');
  }
  return HtmlService.createHtmlOutputFromFile("Tracker");
}

function logAttendance(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tracker");

  let address = data.location; // fallback

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.lat}&lon=${data.lng}`;
    const response = UrlFetchApp.fetch(url, {
      headers: { 'User-Agent': 'GoogleAppsScript' }
    });
    const json = JSON.parse(response.getContentText());
    if (json && json.display_name) {
      address = json.display_name;
    }
  } catch (err) {
    Logger.log("Reverse geocoding failed: " + err.message);
  }

  try {
    sheet.appendRow([
      new Date(),
      data.empid || '',
      data.name || '',
      data.email || '',
      data.action || '',
      address,
      data.date || '',
      data.time || ''
    ]);
  } catch (err) {
    Logger.log("Sheet append failed: " + err.message);
  }
}

function getEmployeeList() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('EmployeeList');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const empIdIndex = headers.indexOf('Employee ID');
  const nameIndex = headers.indexOf('Name');
  const emailIndex = headers.indexOf('Email ID');

  return data.slice(1).map(row => [
    row[empIdIndex] || '',
    row[nameIndex] || '',
    row[emailIndex] || ''
  ]);
}



