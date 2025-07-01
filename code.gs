const SHEET_ID = '1CbB-AocdDsrwIM4_hto7-9JZVCrD2M7ABkrGpVx8WnI';
const EMPLOYEE_SHEET_NAME = 'EmployeeList';
const TRACKER_SHEET_NAME = 'Tracker';
const LOCATION_API_KEY = 'pk.97e884c4a66475d35c10ad22e700fb0c';

function doGet() {
  const userEmail = Session.getEffectiveUser().getEmail();
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(EMPLOYEE_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const emailCol = headers.findIndex(h => h.trim().toLowerCase() === 'email id');
  const nameCol = headers.findIndex(h => h.trim().toLowerCase() === 'name');
  const empIdCol = headers.findIndex(h => h.trim().toLowerCase() === 'employee id');

  if ([emailCol, nameCol, empIdCol].includes(-1)) {
    return HtmlService.createHtmlOutput('❌ Missing required column headers in EmployeeList.');
  }

  const match = data.slice(1).find(row =>
    (row[emailCol] || '').toString().toLowerCase().trim() === userEmail.toLowerCase().trim()
  );

  if (!match) {
    return HtmlService.createHtmlOutput(`❌ Access Denied. You are not a registered user: ${userEmail}`);
  }

  const template = HtmlService.createTemplateFromFile('Tracker');
  template.userEmail = userEmail;
  template.userName = match[nameCol];
  template.userEmpId = match[empIdCol];

  return template.evaluate()
    .setTitle("Team Attendance Tracker")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function logAttendance(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(TRACKER_SHEET_NAME);
  const headers = sheet.getDataRange().getValues()[0];

  const nameCol = headers.findIndex(h => h.toLowerCase().trim() === 'name');
  const empIdCol = headers.findIndex(h => h.toLowerCase().trim() === 'employee id');
  const emailCol = headers.findIndex(h => h.toLowerCase().trim() === 'email');
  const logInCol = headers.findIndex(h => h.toLowerCase().trim() === 'log-in');
  const logOutCol = headers.findIndex(h => h.toLowerCase().trim() === 'log-out');
  const timestampCol = headers.findIndex(h => h.toLowerCase().trim() === 'timestamp');
  const locationCol = headers.findIndex(h => h.toLowerCase().trim() === 'location');
  const dateCol = headers.findIndex(h => h.toLowerCase().trim() === 'date');

  if ([nameCol, emailCol, empIdCol, timestampCol, locationCol, dateCol, logInCol, logOutCol].includes(-1)) {
    throw new Error('❌ Required headers are missing in Tracker sheet.');
  }

  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const existingRows = sheet.getDataRange().getValues();

  let foundRowIndex = -1;
  let hasLogIn = false;
  let hasLogOut = false;

  for (let i = 1; i < existingRows.length; i++) {
    const row = existingRows[i];
    const rowEmail = (row[emailCol] || '').toString().toLowerCase().trim();
    const rowDate = Utilities.formatDate(new Date(row[dateCol]), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    if (rowEmail === data.email.toLowerCase().trim() && rowDate === today) {
      foundRowIndex = i;
      hasLogIn = !!row[logInCol];
      hasLogOut = !!row[logOutCol];
      break;
    }
  }

  if (data.action === 'Log-In' && hasLogIn) {
    throw new Error('❌ Log-In already completed for today.');
  }
  if (data.action === 'Log-Out' && hasLogOut) {
    throw new Error('❌ Log-Out already completed for today.');
  }

  let address = data.location;
  try {
    const url = `https://us1.locationiq.com/v1/reverse?key=${LOCATION_API_KEY}&lat=${data.lat}&lon=${data.lng}&format=json`;
    const response = UrlFetchApp.fetch(url);
    const json = JSON.parse(response.getContentText());
    if (json && json.display_name) {
      address = json.display_name;
    }
  } catch (err) {
    Logger.log("Location fetch failed: " + err.message);
  }

  const now = new Date();
  const timeValue = data.time;

  if (foundRowIndex !== -1) {
    const row = sheet.getRange(foundRowIndex + 1, 1, 1, headers.length).getValues()[0];
    if (data.action === 'Log-In') row[logInCol] = timeValue;
    else if (data.action === 'Log-Out') row[logOutCol] = timeValue;

    row[timestampCol] = now;
    row[locationCol] = address;
    sheet.getRange(foundRowIndex + 1, 1, 1, row.length).setValues([row]);
  } else {
    const newRow = Array(headers.length).fill('');
    newRow[timestampCol] = now;
    newRow[dateCol] = today;
    newRow[empIdCol] = data.empid;
    newRow[nameCol] = data.name;
    newRow[emailCol] = data.email;
    newRow[locationCol] = address;
    if (data.action === 'Log-In') newRow[logInCol] = timeValue;
    else if (data.action === 'Log-Out') newRow[logOutCol] = timeValue;

    sheet.appendRow(newRow);
  }

  return `✅ ${data.action} recorded successfully for ${data.name}.`;
}

function getTodayStatus(email) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(TRACKER_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const emailCol = headers.findIndex(h => h.toLowerCase().trim() === 'email');
  const logInCol = headers.findIndex(h => h.toLowerCase().trim() === 'log-in');
  const logOutCol = headers.findIndex(h => h.toLowerCase().trim() === 'log-out');
  const dateCol = headers.findIndex(h => h.toLowerCase().trim() === 'date');

  if ([emailCol, logInCol, logOutCol, dateCol].includes(-1)) {
    return { error: 'Required headers are missing in Tracker sheet.' };
  }

  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowEmail = (row[emailCol] || '').toString().toLowerCase().trim();
    const rowDate = Utilities.formatDate(new Date(row[dateCol]), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    if (rowEmail === email.toLowerCase().trim() && rowDate === today) {
      return {
        hasLogIn: !!row[logInCol],
        hasLogOut: !!row[logOutCol]
      };
    }
  }
  return { hasLogIn: false, hasLogOut: false };
}
