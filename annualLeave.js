
(() => {
    'use strict';

    function fetchPublicHolidays() {
        const appId = 73;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const todayFormatted = today.toISOString().split('T')[0];

        const query = `Date >= "${todayFormatted}" order by Date asc`;
        const params = {
            app: appId,
            query: query,
            fields: ["Date"]
        };

        const xhr = new XMLHttpRequest();
        const url = kintone.api.url('/k/v1/records', true) + `?app=${params.app}&query=${encodeURIComponent(query)}`;
        
        xhr.open("GET", url, false);
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

        try {
            xhr.send();
            if (xhr.status === 200) {
                const resp = JSON.parse(xhr.responseText);
                return resp.records.map(record => record.Date.value);
            } else {
                console.error("Error fetching public holidays:", xhr.statusText);
                return [];
            }
        } catch (err) {
            console.error("Request failed:", err);
            return [];
        }
    }

    kintone.events.on(['app.record.create.submit', 'app.record.edit.submit'], (event) => {
        var record = event.record;
        var employeeName = record.Name.value;
        var leaveType = record.Type_of_Leave.value;
        var leaveDays = parseInt(record.lt.value, 10) || 0;

        if (leaveType !== "Annual Leave") {
            return event;
        }

        var today = new Date();
        var currentYear = today.getFullYear();

        if (!record.Table || record.Table.value.length === 0) {
            event.error = "Leave dates are missing.";
            return event;
        }

        // Fetch public holidays
        const publicHolidays = fetchPublicHolidays();

        for (let i = 0; i < record.Table.value.length; i++) {
            let leaveDateStr = record.Table.value[i].value.Date2?.value;
            if (!leaveDateStr) {
                event.error = "Leave date is missing.";
                return event;
            }

            let leaveDate = new Date(leaveDateStr);
            let leaveYear = leaveDate.getFullYear();

            if (leaveYear !== currentYear) {
                event.error = `You can only apply for leave in the current year ${currentYear}.`;
                return event;
            }

            // Check 3 working days in advance
            let requiredApplyBefore = new Date(leaveDate);
            let daysToSubtract = 3;
            while (daysToSubtract > 0) {
                requiredApplyBefore.setDate(requiredApplyBefore.getDate() - 1);
                let formattedDate = requiredApplyBefore.toISOString().split('T')[0];

                if (requiredApplyBefore.getDay() !== 0 && requiredApplyBefore.getDay() !== 6 && !publicHolidays.includes(formattedDate)) {
                    daysToSubtract--;
                }
            }

            let createdDate = new Date();
            createdDate.setUTCHours(0, 0, 0, 0);
            if (createdDate > requiredApplyBefore) {
                event.error = "You must apply for Annual Leave at least 3 working days in advance.";
                return event;
            }
        }

        // Leave balance for the current year
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
                    let balance = parseInt(recordData.Annual_Leave_Balance?.value, 10) || 0;

                    if (balance <= 0) {
                        event.error = `You have used all your Annual Leave for ${currentYear}. No days remaining.`;
                    } else if (leaveDays > balance) {
                        event.error = `You can only apply ${balance} days of Annual Leave.`;
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
