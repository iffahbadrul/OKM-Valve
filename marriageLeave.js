
(() => {
    'use strict';

    kintone.events.on(['app.record.create.submit', 'app.record.edit.submit'], (event) => {
        var record = event.record;
        var employeeName = record.Name.value; 
        var leaveType = record.Type_of_Leave.value; 
        var leaveDays = parseFloat(record.lt.value) || 0;  

        if (leaveType !== "Marriage Leave") {
            return event; 
        }

        var query = `Name = "${employeeName}"`; 
        var params = {
            app: 76,  
            query: query
        };

        return kintone.api(kintone.api.url('/k/v1/records', true), 'GET', params)
            .then((resp) => {
                if (resp.records.length > 0) {
                    let recordData = resp.records[0];

                    let balance = parseFloat(recordData.Marriage_Leave_Balance?.value) || 0;

                    console.log(`Employee: ${employeeName}, Balance: ${balance}`);

                    if (balance <= 0) {
                        event.error = `You have no Marriage Leave balance.`;
                    } else if (leaveDays > balance) {
                        event.error = `You can only apply for ${balance} days of Marriage Leave.`;
                    }
                } else {
                    event.error = `No marriage leave balance record found.`;
                }

                return event;
            })
            .catch((err) => {
                console.error("Error fetching leave balance:", err);
                event.error = "An error occurred while checking leave balance.";
                return event;
            });
    });

})();

