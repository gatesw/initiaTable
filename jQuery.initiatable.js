
/**
* jquery.initiaTable
* Written by William Gates (william.gates@qg.com)
* Date: 10/13/14
*
* @author William Gates
* @version 2.0
*
* Allows dataTables to be intialized through HTML5 attributes.
* Will search through the objects passed in, and their decendents for anything 
* matching table[data-role="datatable"] and will generate a config from the dom to
* apply them on dataTable init.
* 
* If auto-creation is not desired $([selector]).initiaTable() will also initialize 
* the specified element.
* 
* Attributes should be prefixed with "dt_" followed by the option name
* Ex. data-dt-scrollY="100px"
*
* 
**/

(function (jQuery) {
    var initiaTable = {};

    /*Because HTML 5 attributes do not allow casing we need to map.*/
    var dtPropMap = {
        /*DataTables Base*/
        autowidth: "autoWidth",
        deferrender: "deferRender",
        info: "info",
        jqueryui: "jQueryUI",
        lengthchange: "lengthChange",
        ordering: "ordering",
        paging: "paging",
        processing: "processing",
        scrollx: "scrollX",
        scrolly: "scrollY",
        searching: "searching",
        serverSide: "serverSide",
        statesave: "stateSave",
        data: "data",
        ajax: "ajax",
        createdrow: "createdRow",
        drawcallback: "drawCallback",
        footercallback: "footerCallback",
        formatnumber: "formatNumber",
        headercallback: "headerCallback",
        infocallback: "infoCallback",
        initcomplete: "initComplete",
        predrawcallback: "preDrawCallback",
        rowcallback: "rowCallback",
        stateloadcallback: "stateLoadCallback",
        stateloaded: "stateLoaded",
        stateloadparams: "stateLoadParams",
        statesavecallback: "stateSaveCallback",
        statesaveparams: "stateSaveParams",
        deferloading: "deferLoading",
        destroy: "destroy",
        displaystart: "displayStart",
        dom: "dom",
        lengthmenu: "lengthMenu",
        ordercellstop: "orderCellsTop",
        orderclasses: "orderClasses",
        order: "order",
        orderfixed: "orderFixed",
        ordermulti: "orderMulti",
        pagelength: "pageLength",
        pagingtype: "pagingType",
        renderer: "renderer",
        retrieve: "retrieve",
        scrollcollapse: "scrollCollapse",
        search: "search",
        stateduration: "stateDuration",
        stripeclasses: "stripeClasses",
        tabindex: "tabIndex",
        columndefs: "columnDefs",
        columns: "columns",
        language: "language",

        /*TableTools*/
        tabletools: "tableTools",

        /*Scroller*/
        scroller: "scroller",

        /*Responsive*/
        responsive: "responsive"
    };

    /*The plug-in needs to have the startsWith function so here was want to verify it exists*/
    if (typeof String.prototype.startsWith != 'function') {
        String.prototype.startsWith = function (str) {
            return this.slice(0, str.length) == str;
        };
    }

    initiaTable.getValueFromString = function (funcName, onObject) {
        if (typeof funcName != "string") {
            return funcName;
        }

        /*If onObject is null it means we are on the first pass and should check a couple of special cases*/
        if (!onObject) {
            onObject = window;

            /*See if we are dealing with a boolean*/
            switch (funcName.toUpperCase()) {
                case 'TRUE':
                    return true;
                case 'FALSE':
                    return false;
            }

            /*See if we are dealing with a number*/
            try {
                var num = parseInt.parse(funcName);
                return num;
            } catch (e) { }

            /*See if we are dealing with a dynamic object*/
            try {
                var fixedResponse = funcName.replace(/\'/g, "\"");
                var parsedObj = JSON.parse(fixedResponse);
                return initiaTable.getValueFromString(parsedObj);
            } catch (e) { }

            /*See if we are dealing with a dynamic function*/
            try {
                var dynamicFunctString = '(' + funcName + ')';
                var dynamicFunct = eval(dynamicFunctString);
                if (typeof dynamicFunct === 'function') {
                    return dynamicFunct;
                }
            } catch (e) { }
        }

        /*We are likely dealing with a pointer or a raw string. Determine if its a valid pointer for an object or function*/
        var dotIndex = funcName.indexOf('.');
        if (dotIndex > 0) {
            var str = funcName.substr(0, dotIndex);
            var fn = onObject[str];
            if (typeof fn === 'object' || typeof fn === 'function') {
                var next = funcName.slice(dotIndex + 1);
                return initiaTable.getValueFromString(next, fn);
            }
        } else {
            var parenIndex = funcName.indexOf('(');
            if (parenIndex > 0) {
                var endParen = funcName.indexOf(')');
                var func = funcName.slice(0, parenIndex);
                var params = JSON.parse("[" + funcName.slice(parenIndex + 1, endParen) + "]");
                if ($.isFunction(onObject[func])) {
                    return onObject[func].apply(onObject, params);
                }
            } else {
                var fn = onObject[funcName];
                return fn;
            }
        }
    };

    initiaTable.getConfigValue = function (value) {
        var dtConfigValue = initiaTable.getValueFromString(value);
        return typeof dtConfigValue !== 'undefined' ? dtConfigValue : value;
    };

    initiaTable.getDataTableConfig = function (table) {
        var $table = $(table);
        /*We want to destroy the table so we don't accidentally try to initialize it twice*/
        var tableConfig = { destroy: true }
        var columns = [];

        /*Table Configs*/
        $.each($table.data(), function (key, value) {
            if (key.startsWith('dt_')) {
                var dtTblProp = dtPropMap[key.substring(3, key.length)];
                tableConfig[dtTblProp] = initiaTable.getConfigValue(value);
            }
        });

        /*Column Configs*/
        $("thead th", table).each(function () {
            var columnConfig = {};
            $.each($(this).data(), function (key, value) {
                if (key.startsWith('dt_')) {
                    var dtColProp = dtPropMap[key.substring(3, key.length)];
                    columnConfig[dtColProp] = initiaTable.getConfigValue(value);
                }
            });
            columns.push(columnConfig);
        });

        if (columns.length > 0) {
            tableConfig.columns = columns;
        }

        return tableConfig;
    };

    initiaTable.initializeDataTable = function (params) {
        var config = initiaTable.getDataTableConfig(this);
        var datatable = $(this).dataTable(config);
        $(this).removeAttr('data-role');

        return datatable;
    };

    $.fn.initializeDataTables = function () {
        $(this).each(function () {
            $(this).initiaTable();
        });
        return this;
    };

    /*Expose internal methods for callers - Useful if caller wants to grab the config json without actually initializing a table.*/
    $.fn.initiaTable = function (method) {
        if (initiaTable[method]) {
            return initiaTable[method].apply(this, Array.prototype.slice.call(arguments, 1));
        }
        else if (typeof method === 'object' || !method) {
            return initiaTable.initializeDataTable.apply(this, arguments);
        }

        $.error('Method ' + method + ' does not exist on jQuery.initiaTable');
    };

    /* Verify that DataTables is loaded and the version is supported */
    if (!(typeof $.fn.dataTable == "function" &&
          typeof $.fn.dataTableExt.fnVersionCheck == "function" &&
          $.fn.dataTableExt.fnVersionCheck('1.10.0'))) {
        alert("Warning: initiaTable 2 requires DataTables 1.10.0 or newer - www.datatables.net/download");
    }
})(jQuery);

$(document).ready(function () {
    $('table[data-role="datatable"]').initializeDataTables();

    $('body').bind('initialize', function (event) { $(event.target).initializeDataTables(); });

});