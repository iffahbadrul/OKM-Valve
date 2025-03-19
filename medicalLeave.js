(() => {
    'use strict';

    kintone.events.on(['app.record.create.submit', 'app.record.edit.submit'], (event) => {
        var record = event.record;
        var employeeName = record.Name.value; 
        var leaveType = record.Type_of_Leave.value; 
        var leaveDays = parseInt(record.lt.value, 10) || 0;  

        if (leaveType !== "Medical Leave") { 
            return event; 
        }

        var today = new Date();
        var currentYear = today.getFullYear(); 

        if (!record.Table || record.Table.value.length === 0) {
            event.error = "Leave dates are missing.";
            return event;
        }

        for (let i = 0; i < record.Table.value.length; i++) {
            let leaveDateStr = record.Table.value[i].value.Date2?.value;
            if (!leaveDateStr) {
                event.error = "Leave date is missing.";
                return event;
            }

            let leaveDate = new Date(leaveDateStr);
            let leaveYear = leaveDate.getFullYear();

            if (leaveYear !== currentYear) {
                event.error = `You can only apply for medical leave in the current year ${currentYear}.`;
                return event;
            }
        }

        var startOfYear = `${currentYear}-01-01`;
        var endOfYear = `${currentYear}-12-31`;

        var query = `Name = "${employeeName}" and Start_Date >= "${startOfYear}" and Start_Date <= "${endOfYear}"`;

        var params = {
            app: 88,
            query: query
        };

        var xhr = new XMLHttpRequest();
        var url = kintone.api.url('/k/v1/records', true) + `?app=${params.app}&query=${encodeURIComponent(params.query)}`;

        console.log("Requesting URL:", url);

        xhr.open("GET", url, false);
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

        try {
            xhr.send();
            console.log("Response Status:", xhr.status); 

            if (xhr.status === 200) {
                var resp = JSON.parse(xhr.responseText);
                console.log("API Response:", resp); 

                if (resp.records.length > 0) {
                    let recordData = resp.records[0];

                    let balance = parseInt(recordData.Medical_Leave_Balance?.value, 10) || 0;

                    if (balance <= 0) {
                        event.error = `You have used all your Medical Leave for ${currentYear}. No days remaining.`; 
                    } else if (leaveDays > balance) {
                        event.error = `You can only apply ${balance} days of Medical Leave.`;
                    }
                } else {
                    event.error = `No leave balance record found for ${currentYear}.`;
                }
            } else {
                console.error("XHR Error:", xhr.statusText);
                event.error = "Error fetching leave balance.";
            }
        } catch (err) {
            console.error("Request failed:", err);
            event.error = "An error occurred while checking leave balance.";
        }

        return event;
    });

})();
