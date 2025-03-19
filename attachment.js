(function() {
    "use strict";

    function validateAttachment(event) {
        var record = event.record;
        var leaveType = record.Type_of_Leave?.value;
        var attachment = record.Attachment?.value || [];
        var nextStatus = event.nextStatus?.value; 

        // console.log("Attachment:", attachment);
        // console.log("Next Status:", nextStatus);

        var requiredLeaveType = ["Medical Leave", "Emergency Leave With Document", "Hospitalization Leave"];
        var requiredStatus = "Submitted to Approver 1";

        if (requiredLeaveType.includes(leaveType) && nextStatus === requiredStatus && attachment.length === 0) {
            event.error = "Attachment is required for " + leaveType + " before submitting for approval.";
        }

        return event;
    }

    kintone.events.on(['app.record.edit.submit'], validateAttachment);
    kintone.events.on(['app.record.detail.process.proceed'], validateAttachment);

})();
