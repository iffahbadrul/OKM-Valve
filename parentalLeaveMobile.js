
(function () {
    "use strict";

    function validateLeave(event) {
        var record = event.record;
        var leaveType = record.Type_of_Leave.value;
        var location = record.Location.value;
        var totalDays = 0;
        
        record.Table.value.forEach(row => {
            totalDays += parseFloat(row.value.Total.value) || 0; 
        });

        console.log("Total Leave Days Applied:", totalDays);
        console.log("Selected Location:", location);

        if (leaveType === "Parental Leave" && !location) {
          event.error = "Please select a Location for Parental Leave.";
          return event;
        }

        if (location === "Selangor" && totalDays > 1) {
          event.error = "You can only apply for 1 day of Parental Leave in Selangor.";
          return event;
        }

        if (location === "Other States" && totalDays > 2) {
          event.error = "You can only apply a maximum of 2 days of Parental Leave in Other States.";
          return event;
        }

        return event;
    }

    kintone.events.on(['mobile.app.record.create.submit', 'mobile.app.record.edit.submit'], validateLeave);

})();
