/* create datepicker */
jQuery(document).ready(function() {

    jQuery('#date').datepicker({
        minDate: new Date(2019, 5, 1),
        maxDate: new Date(2019, 12, 31),
        dateFormat: 'dd/mm/yy',
        dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
        dayNamesMin: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
        monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
        monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        constrainInput: true,
        autoSize: true,
        beforeShowDay: noWeekendsOrHolidays
    });

    $('#timepicker').timepicker({
        timeFormat: 'HH:mm',
        interval: 30,
        minTime: '0',
        maxTime: '23:30',
        defaultTime: '09',
        startTime: '10:00',
        dynamic: false,
        dropdown: true,
        scrollbar: true
    });

});