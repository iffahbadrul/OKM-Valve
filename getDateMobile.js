
(() => {
    'use strict';

    kintone.events.on(['mobile.app.record.create.show', 'mobile.app.record.edit.show'], function(event) {
        var record = event.record;
        var buttonSpace = kintone.app.record.getSpaceElement("Button_Space"); 
        if (!buttonSpace) return event; 

        buttonSpace.innerHTML = ""; 

        var myButton = document.createElement('button');
        myButton.innerHTML = 'Generate Dates';
        myButton.className = 'kintoneplugin-button-normal';
        buttonSpace.appendChild(myButton); 

        myButton.onclick = function() {
            var record = kintone.app.record.get();

            if (!record.record.Start_Date.value || !record.record.End_Date.value) {
                alert('Please select both Start Date and End Date.');
                return;
            }

            var startDate = new Date(record.record.Start_Date.value);
            var endDate = new Date(record.record.End_Date.value);
            var tableField = record.record.Table.value;

            tableField.length = 0;

            var currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                tableField.push({
                    id: null, 
                    value: {
                        Date2: { type: "DATE", value: currentDate.toISOString().split('T')[0] }, 
                        Day_of_Week: { type: "SINGLE_LINE_TEXT", value: ""},
                        Hours: { type: "RADIO_BUTTON", value: "1" }, 
                        Type: { type: "DROP_DOWN", value: "Full"},
                        Total: { type: "CALC", value: ""}
                    }
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }

            kintone.mobile.app.record.set(record);
        };

        return event;
    });
})();
