import AbstractSidebarInput from "../../../../inputs/AbstractSidebarInput";
import TabDOMUtil from "../../../../util/TabDOMUtil";

const ID = "geovisto-stop-order-autocomplete";

const COMPONENT_DIV_INPUT_CLASS = ID + "-component";

const STOP_DIV_INPUT_CLASS = ID + "-stop-complete";

const STOP_LABEL_DIV_INPUT_CLASS = ID + "-stop-label";

const BUTTON_DIV_INPUT_CLASS = ID + "-button";

/**
 * This class represents stop order modification.
 *
 * @author Juraj Lazur
 */
class AutocompleteSidebarStopOrder extends AbstractSidebarInput {

    constructor(settings){
        super(settings);

        this.action = settings.action;

        this.formDiv = undefined;
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
     * Static function to create route stops.
     */
    createStops() {
        var _this = this, stop_num = 0;
        this.inputDivMain = document.createElement('div');
        this.inputDivMain.classList.add(COMPONENT_DIV_INPUT_CLASS);
        this.formDiv.appendChild(this.inputDivMain);

        this.labels.forEach(function (label) {
            if (label[0] === 0) {
                stop_num++;
            }
        })

        this.labels.forEach(function (label,  index){
            _this.stop = document.createElement('div');
            _this.stop.classList.add(STOP_DIV_INPUT_CLASS);

            _this.stopName = document.createElement('div');
            _this.stopName.classList.add(STOP_LABEL_DIV_INPUT_CLASS);
            _this.stopName.innerHTML = index + ': ' + label[1]

            // input
            _this.up = document.createElement('button');
            TabDOMUtil.setAttributes(_this.up,
                [ "id", "class", "name"],
                [ index, BUTTON_DIV_INPUT_CLASS, "up"]);
            _this.up.innerHTML = '<i class="fa fa-arrow-up"></i>';
            if (index === 0 || index === _this.labels.length - 1 ||
                (index === 1 && _this.labels[0][0] === 0 && _this.labels[1][0] === 1)) {
                _this.up.setAttribute('disabled', true);
            } else {
                _this.up.addEventListener('click', function (e){
                    _this.computeIndexes(parseInt(e.currentTarget.id), e.currentTarget.name);
                });
            }

            _this.down = document.createElement('button');
            TabDOMUtil.setAttributes(_this.down,
                [ "id", "class", "name"],
                [ index, BUTTON_DIV_INPUT_CLASS, "down"]);
            _this.down.innerHTML = '<i class="fa fa-arrow-down"></i>';
            if (index === 0 || index === _this.labels.length - 1 ||
                (index === _this.labels.length - 2 &&
                    _this.labels[_this.labels.length - 1][0] === 0 &&
                    _this.labels[_this.labels.length - 2][0] === 1)) {
                _this.down.setAttribute('disabled', true);
            } else {
                _this.down.addEventListener('click', function (e){
                    _this.computeIndexes(parseInt(e.currentTarget.id), e.currentTarget.name);
                });
            }

            _this.del = document.createElement('button');
            TabDOMUtil.setAttributes(_this.del,
                [ "id", "class", "name"],
                [ index, BUTTON_DIV_INPUT_CLASS, "del"]);
            _this.del.innerHTML = '<i class="fa fa-trash"</i>';
            if (stop_num < 3 && label[0] === 0) {
                _this.del.setAttribute('disabled', true);
            } else {
                _this.del.addEventListener('click', function (e){
                    _this.computeIndexes(parseInt(e.currentTarget.id), e.currentTarget.name);
                });
            }

            // construct elements
            _this.inputDivMain.appendChild(_this.stop);
            _this.stop.appendChild(_this.stopName);
            _this.stop.appendChild(_this.up);
            _this.stop.appendChild(_this.down);
            _this.stop.appendChild(_this.del);
        })
    }

    /**
     * Static function to delete midpoints on routes end.
     */
    clear_midpoints(direction) {
        if (direction === 'up') {
            if (this.labels[0][0] === 1) {
                this.action(0);
                this.labels.splice(0, 1);
                this.points.splice(0, 1);
                this.clear_midpoints(direction)
            }
        } else if (direction === 'down') {
            if (this.labels[this.labels.length - 1][0] === 1) {
                this.action(this.labels.length - 1);
                this.labels.splice(this.labels.length - 1, 1);
                this.points.splice(this.labels.length - 1, 1);
                this.clear_midpoints(direction)
            }
        }
    }

    /**
     * Static function to compute stop indexes.
     */
    computeIndexes(id, type){
        var label, point;
        if (type === 'del') {
            this.action(id);
            this.labels.splice(id, 1);
            this.points.splice(id, 1);
            this.clear_midpoints('up');
            this.clear_midpoints('down');
        } else if (type === 'up') {
            this.action([id, id - 1]);
            label = this.labels[id];

            this.labels[id] = this.labels[id - 1];
            this.labels[id - 1] = label;
            point = this.points[id];
            this.points[id] = this.points[id - 1];
            this.points[id - 1] = point;
        } else if (type === 'down') {
            this.action([id, id + 1]);

            label = this.labels[id];
            this.labels[id] = this.labels[id + 1];
            this.labels[id + 1] = label;
            point = this.points[id];
            this.points[id] = this.points[id + 1];
            this.points[id + 1] = point;
        }

        this.deleteStops();
        this.createStops();
    }

    /**
     * Static function to create new midpoint.
     */
    addMidpoint(waypoints) {
        var new_points = [], new_labels = [], index = 0, _this = this;

        this.points.forEach(function (point, i) {
            if (point !== waypoints[index]) {
                new_points.push(waypoints[index]);
                new_labels.push([1, 'midpoint']);
                index++;
            }
            new_points.push(point);
            new_labels.push(_this.labels[i])
            index++;
        })

        this.points = new_points;
        this.labels = new_labels;
        this.deleteStops();
        this.createStops();
    }

    /**
     * Static function to process routes stop.
     */
    addStops(stop_labels, stop_points) {
        this.labels = stop_labels;
        this.points = stop_points;

        this.createStops();
    }

    /**
     * Static function to delete elements after user finished work.
     */
    deleteStops() {
        if (this.inputDivMain !== undefined)
            this.inputDivMain.remove();
    }

    create() {
        this.createForm();

        return this.formDiv;
    }

    createForm() {
        this.formDiv = document.createElement('div'); 
        this.formDiv.classList.add(ID);
    }
}
export default AutocompleteSidebarStopOrder;