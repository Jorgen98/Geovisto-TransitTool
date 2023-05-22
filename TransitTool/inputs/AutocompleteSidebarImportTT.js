import AbstractSidebarInput from "../../../../inputs/AbstractSidebarInput";
import TabDOMUtil from "../../../../util/TabDOMUtil";

const ID = "geovisto-import-autocomplete";

const COMPONENT_DIV_INPUT_CLASS = ID + "-component";

const COMPONENT_INPUT_LABEL_CLASS = ID + "-label";

const COMPONENT_INPUT_CLASS = ID + "-input";

/**
 * This class represents time tables import.
 *
 * @author Juraj Lazur
 */
class AutocompleteSidebarTTImport extends AbstractSidebarInput {

    constructor(settings){
        super(settings);
        
        // settings
        this.label = settings.label;
        this.action = settings.action;

        // div elements
        this.formDiv = undefined;
        this.inputDiv = undefined;
        this.input = undefined;
        this.inputDiv = undefined;
    }

    /**
     * Static function returns identifier of the input type.
     */
    static ID() {
        return ID;
    }

    /**
     * Static function to hide or show whole element.
     */
    setVisible(visible) {
        if (visible == true) {
            this.formDiv.style.display = "";
        }
        if (visible == false) {
            this.formDiv.style.display = "none";
        }
    }

    /**
     * Static function to set element label.
     */
    setLabel(label) {
        if (label != ""){
            this.input.innerHTML = label;
        }
    }

    /**
     * Static function to transform date string to seconds.
     */
    get_time(string) {
        if (string === undefined)
            return null;
        string = string.split(':');
        if (string.length !== 3){
            return null;
        }

        return parseInt(string[0]) * 60 * 60 + parseInt(string[1]) * 60 + parseInt(string[2]);
    }

    /**
     * Static function to validate date format.
     */
    get_date(string) {
        if (string === undefined)
            return null;
        string = string.split('-');
        if (string.length !== 3)
            return null

        string[0] = parseInt(string[0]);
        string[1] = parseInt(string[1]);
        string[2] = parseInt(string[2]);

        if (string[1] < 1 || string[1] > 12 || string[2] < 1  || string[2] > 31) {
            return null;
        }

        return string[0].toString() + '-' + string[1].toString() + '-' + string[2].toString();
    }

    /**
     * Process trips and route times.
     */
    compute_route_data(input_data, route) {
        var result = {route_name: route, trip_stops: undefined, stop_times: [], trips: [], line: undefined},
            res, dir, day, days = [], _this = this;
        if (input_data[route] === undefined || input_data[route].times === undefined ||
            input_data[route].trips === undefined || input_data[route].times.length < 2){
            return null;
        }

        input_data[route].times.forEach(function (dep_time) {
            res = _this.get_time(dep_time[0]);
            if (res === null)
                return null;
            result.stop_times.push(res);
            res = _this.get_time(dep_time[1]);
            if (res === null)
                return null;
            result.stop_times.push(res)
        })

        if (input_data[route].trips.length < 1){
            return null;
        }

        input_data[route].trips.forEach(function (trip) {
            res = _this.get_time(trip[0]);
            if (res === null)
                return null;
            dir = parseInt(trip[1]);
            if (isNaN(dir) || dir === undefined || (dir !== 0 && dir !== 1))
                return null;
            day = trip[2];
            if (day === undefined)
                return null;
            day.forEach(function (i){
                i = parseInt(i);
                if (isNaN(i) || i === undefined || (i !== 0 && i !== 1 && i !== 2))
                    return null;
                days.push(i);
            })
            result.trips.push({dep_time: res, dir: dir, day_type: days, done: false})
            days = [];
        })

        return result;
    }

    /**
     * Static function to process holiday dates.
     */
    compute_holidays(input_data) {
        var result = [], res, _this = this;
        if (input_data['holidays'].exceptions.length === 0) {
            return null;
        }
        input_data['holidays'].exceptions.forEach(function (date) {
            res = _this.get_date(date);
            if (res === null)
                return null;
            else
                result.push(res);
        })

        return result;
    }

    /**
     * Static function to process school holiday dates.
     */
    compute_school_holidays(input_data) {
        var result = [], res_1, res_2, _this = this;
        if (input_data['holidays'].exceptions.length === 0) {
            return null;
        }
        input_data['holidays'].school.forEach(function (date) {
            if (date.length !== 2)
                return null;
            res_1 = _this.get_date(date[0]);
            if (res_1 === null)
                return null;
            res_2 = _this.get_date(date[1]);
            if (res_2 === null)
                return null;
            result.push({from: res_1, to: res_2});
        })

        return result;
    }

    /**
     * Main data process function.
     */
    prepare_data(input_data) {
        input_data = JSON.parse(input_data);

        var final_objects = [], holidays, school_holidays,
            routes = [], x, _this = this, rou = null, rous = [];
        for (x in input_data) {
            routes.push(x);
        }

        if (routes.length === 0)
            return;

        routes.forEach(function (route) {
            if (route !== 'holidays') {
                rou = _this.compute_route_data(input_data, route);
                if (rou !== null){
                    final_objects.push(rou);
                    rous.push(rou.route_name);
                }
            }
        })

        routes.forEach(function (route) {
            if (route === 'holidays' &&  input_data[route].school !== undefined &&
                input_data[route].exceptions !== undefined) {
                rou = _this.compute_holidays(input_data, rous);
                if (rou !== null)
                    holidays = rou;

                rou = _this.compute_school_holidays(input_data, rous);
                if (rou !== null)
                    school_holidays = rou;
            }
        })

        this.action(final_objects, holidays, school_holidays);
    }

    create() {
        this.createForm();

        return this.formDiv;
    }

    createForm() {
        this.formDiv = document.createElement('div'); 
        this.formDiv.classList.add(ID);

        // input div
        this.inputDiv = document.createElement('div');
        this.inputDiv.classList.add(COMPONENT_DIV_INPUT_CLASS);

        this.inputLabel = document.createElement('div');
        this.inputLabel.classList.add(COMPONENT_INPUT_LABEL_CLASS);
        this.inputLabel.innerHTML = this.label;

        this.input = document.createElement('div');
        this.input.classList.add(COMPONENT_INPUT_CLASS);

        this.inputFile = document.createElement('input');
        TabDOMUtil.setAttributes(this.inputFile,
            [ "type", "class"],
            [ "file", ID]);

        // Read JSON file
        var _this = this;
        this.inputFile.addEventListener('change', function() {
            var reader = new FileReader();
            reader.onload = function(){
                _this.prepare_data(reader.result);
            }
            reader.readAsText(this.files[0]);
        })

        this.formDiv.appendChild(this.inputDiv);
        this.inputDiv.appendChild(this.inputLabel);
        this.input.appendChild(this.inputFile);
        this.inputDiv.appendChild(this.input);
    }
}
export default AutocompleteSidebarTTImport;