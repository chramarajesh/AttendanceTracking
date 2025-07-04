# AttendanceTracking
Code.gs
function doGet() {
  return HtmlService.createHtmlOutputFromFile("Tracker");
}

function logAttendance(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

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
=========================================
Tracker.Html

<!DOCTYPE html>
<html lang="en">
<head>
  <base target="_top" />
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Team Attendance Tracker</title>
  <style>
    body {
      font-family: "Segoe UI", sans-serif;
      max-width: 600px;
      margin: 40px auto;
      padding: 30px;
      background-color: #f9f9f9;
      border-radius: 12px;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
      color: #333;
    }

    h2 {
      text-align: center;
      margin-bottom: 20px;
    }

    img.logo {
      display: block;
      margin: 0 auto 20px auto;
      max-height: 60px;
    }

    label {
      font-weight: bold;
      display: block;
      margin-top: 16px;
    }

    input, button {
      width: 100%;
      padding: 10px;
      margin-top: 4px;
      border-radius: 6px;
      border: 1px solid #ccc;
      box-sizing: border-box;
    }

    input[type="checkbox"] {
      width: auto;
      margin-right: 8px;
    }

    .checkbox-label {
      font-weight: normal;
      margin-top: 12px;
    }

    button {
      background-color: #007bff;
      color: white;
      font-weight: bold;
      cursor: pointer;
      margin-top: 20px;
      transition: background-color 0.3s;
    }

    button:disabled {
      background-color: #aaa;
      cursor: not-allowed;
    }

    button:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .status {
      margin-top: 16px;
      font-weight: bold;
      text-align: center;
    }

    .policy-box {
      margin-top: 30px;
      padding: 20px;
      background-color: #fffbe6;
      border-left: 4px solid #f1c40f;
      font-size: 0.95em;
      border-radius: 6px;
    }

    .policy-box h3 {
      margin-top: 0;
      color: #c27c0e;
    }

    .policy-box ul {
      padding-left: 20px;
    }

    .policy-box li {
      margin-bottom: 8px;
      line-height: 1.5;
    }

    hr {
      margin-top: 40px;
      border: 0;
      border-top: 1px solid #ccc;
    }
  </style>
</head>
<body>
  <img 
    src="https://drive.google.com/thumbnail?id=1GF0qYyPsvmVDCv9wdDnuDSvIipbspC6Y&sz=w400" 
    alt="Company Logo" 
    class="logo" 
  />

  <h2>Team Attendance Tracker</h2>

  <form id="attendanceForm" onsubmit="return false;">
    <label for="empid">Employee ID:</label>
    <input type="text" id="empid" required placeholder="Enter your employee ID" />

    <label for="name">Name:</label>
    <input type="text" id="name" required placeholder="Enter your full name" />

    <label for="email">Email ID:</label>
    <input type="email" id="email" required placeholder="Enter your official email ID" />

    <div style="margin-top: 16px;">
      <label style="display: block; margin-bottom: 6px;">Action:</label>
      <div style="display: flex; flex-wrap: nowrap; gap: 60px; align-items: center;">
        <label for="login" style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
          <input type="radio" id="login" name="action" value="Log-In" required />
          Log-In
        </label>
        <label for="logout" style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
          <input type="radio" id="logout" name="action" value="Log-Out" required />
          Log-Out
        </label>
      </div>
    </div>

    <label class="checkbox-label">
      <input type="checkbox" id="policyAgree" required />
      I have read and agree to the Privacy & User Login Policy
    </label>

    <button type="submit" id="submitBtn" disabled>Submit Attendance</button>
    <div class="status" id="status"></div>
  </form>

  <hr />

  <div class="policy-box">
    <h3>Privacy & User Login Policy</h3>
    <ul>
      <li>All users must access systems using their own authorized credentials.</li>
      <li>Sharing, exchanging, or using another individual's login ID or email is strictly prohibited.</li>
      <li>Any such activity is considered a serious security breach and may result in disciplinary action or legal consequences.</li>
      <li>Users are responsible for safeguarding their login information and must report any suspicious behavior immediately.</li>
      <li>Adherence to this policy is mandatory for all users to ensure data security and organizational integrity.</li>
    </ul>
  </div>

  <script>
    const form = document.getElementById("attendanceForm");
    const statusEl = document.getElementById("status");
    const policyAgree = document.getElementById("policyAgree");
    const submitBtn = document.getElementById("submitBtn");

    policyAgree.addEventListener("change", () => {
      submitBtn.disabled = !policyAgree.checked;
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!policyAgree.checked) {
        alert("You must agree to the policy before submitting.");
        return;
      }

      statusEl.textContent = "📍 Getting your location...";

      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
      }

      const locationTimeout = setTimeout(() => {
        statusEl.innerHTML = `
          ❌ Location request timed out.<br><br>
          Please:
          <ul style="text-align: left;">
            <li>Enable location in your browser</li>
            <li>Allow the permission popup</li>
            <li>Use Chrome or Safari if scanning via QR</li>
            <li>Refresh and try again</li>
          </ul>
        `;
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        function (position) {
          clearTimeout(locationTimeout);

          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const now = new Date();
          const date = now.toLocaleDateString("en-IN");
          const time = now.toLocaleTimeString("en-IN");

          const payload = {
            empid: document.getElementById("empid").value.trim(),
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            action: document.querySelector('input[name="action"]:checked')?.value || '',
            lat: lat,
            lng: lng,
            location: `Lat: ${lat}, Lng: ${lng}`,
            date: date,
            time: time
          };

          google.script.run
            .withSuccessHandler(() => {
              statusEl.textContent = "✅ Attendance recorded!";
              form.reset();
              submitBtn.disabled = true;
            })
            .withFailureHandler((err) => {
              console.error(err);
              statusEl.textContent = "❌ Failed to submit.";
            })
            .logAttendance(payload);
        },
        function (error) {
          clearTimeout(locationTimeout);
          console.warn("Location error:", error);
          statusEl.innerHTML = `
            ❌ Unable to access location.<br><br>
            Please:
            <ul style="text-align: left; margin-top: 8px;">
              <li>Enable location access in your device</li>
              <li>Allow the popup when asked</li>
              <li>Open in Chrome/Safari if using mobile</li>
              <li>Refresh and try again</li>
            </ul>
          `;
        },
        { timeout: 10000 }
      );
    });
  </script>
</body>
</html>


