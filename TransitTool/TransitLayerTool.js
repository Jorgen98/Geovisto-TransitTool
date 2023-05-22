import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet/src/dom/DomUtil';
import './style/transitLayer.scss';
import stop_icon_0 from './style/stop_0.png'
import stop_icon_0_0 from './style/stop_0_0.png'
import stop_icon_0_hover from './style/stop_0_hover.png'
import stop_icon_0_0_hover from './style/stop_0_0_hover.png'
import stop_icon_1 from './style/stop_1.png'
import stop_icon_1_0 from './style/stop_1_0.png'
import stop_icon_1_hover from './style/stop_1_hover.png'
import stop_icon_1_0_hover from './style/stop_1_0_hover.png'
import stop_icon_2 from './style/stop_2.png'
import stop_icon_2_0 from './style/stop_2_0.png'
import stop_icon_2_hover from './style/stop_2_hover.png'
import stop_icon_2_0_hover from './style/stop_2_0_hover.png'
import midpoint_icon from './style/midpoint.png'
import midpoint_icon_hover from './style/midpoint_hover.png'
import vehicle_icon from './style/vehicle.png'
import TransitLayerToolTabControl from './sidebar/TransitLayerToolTabControl';
import TransitLayerToolState from './TransitLayerToolState';
import TransitLayerToolDefaults from './TransitLayerToolDefaults';
import SelectionTool from '../../selection/SelectionTool';
import AbstractLayerTool from '../abstract/AbstractLayerTool';
import * as DomEvent from "leaflet/src/dom/DomEvent";

/**
 * Transit layer tool.
 *
 * @author Juraj Lazur
 */

L.Control.TransitControl = L.Control.extend({
    onAdd: function() {
        var el = L.DomUtil.create('div', 'leaflet-bar transit-control');

        this.buttons = [];

        this.buttons.push(this._createButton(el, this.options.fn, this.options.icons[0], 'stopMode'));
        this.buttons.push(this._createButton(el, this.options.fn, this.options.icons[1], 'routeMode'));
        this.buttons.push(this._createButton(el, this.options.fn, this.options.icons[2], 'filterMode'));
        this.buttons.push(this._createButton(el, this.options.fn, this.options.icons[3], 'viewMode'));

        return el;
    },

    _createButton(el, fn, icon, title) {
        var but = L.DomUtil.create('a', 'transit_button_unset', el);
        but.innerHTML = '<i id="" class="' + icon + '" title="' + title + '"></i>';
        but.href = '#';
        but.title = title;

        DomEvent.disableClickPropagation(but);
        DomEvent.on(but, 'click', fn, but);

        return but;
    },

    set(mode) {
        this.buttons.forEach(function (button) {
            if (button.title === mode) {
                button.setAttribute('id', 'setMode');
            }
        })
    },

    setViewMode() {
        this.buttons.forEach(function (button) {
            if (button.title === 'viewMode') {
                button.setAttribute('id', 'setMode');
            } else if (button.title !== 'filterMode'){
                button.setAttribute('id', 'disableMode');
            }
        })
    },

    unset() {
        this.buttons.forEach(function (button) {
            button.removeAttribute('id');
        })
    },

    unsetInViewMode() {
        this.buttons.forEach(function (button) {
            if (button.title === 'filterMode') {
                button.removeAttribute('id');
            }
        })
    },

    unsetViewMode() {
        this.buttons.forEach(function (button) {
            button.removeAttribute('id');
        })
    }
});

L.control.transitControl = function(opts) {
    return new L.Control.TransitControl(opts);
}

var id = 0;

class TransitLayerTool extends AbstractLayerTool {

    // Class variables
    selected_stop = undefined;
    selected_line = undefined;
    selected_route = undefined;
    selected_midpoint = undefined;

    stops = [];
    lines = [];

    trips = [];
    vehicles = [];
    holidays = [];
    school_holidays = [];

    new_route_stops = [];
    new_route_polygons = [];
    route_midpoints = [];
    old_position = undefined;
    old_index = undefined;
    REFRESH_TIME = 5;
    APPEAR_TIME = 30;
    viewMode = false;
    processingData = false;

    // Map icons
    StopIcons = [
        L.icon({
            iconUrl: stop_icon_0,
            iconSize: [37, 95],
            iconAnchor: [18, 95]}),
        L.icon({
            iconUrl: stop_icon_0_0,
            iconSize: [37, 47],
            iconAnchor: [18, 43]}),
        L.icon({
            iconUrl: stop_icon_1,
            iconSize: [37, 95],
            iconAnchor: [7, 95]}),
        L.icon({
            iconUrl: stop_icon_1_0,
            iconSize: [37, 47],
            iconAnchor: [18, 43]}),
        L.icon({
            iconUrl: stop_icon_2,
            iconSize: [37, 95],
            iconAnchor: [7, 95]}),
        L.icon({
            iconUrl: stop_icon_2_0,
            iconSize: [37, 47],
            iconAnchor: [18, 43]})
    ];

    StopIconsHovered = [
        L.icon({
            iconUrl: stop_icon_0_hover,
            iconSize: [43, 100],
            iconAnchor: [21, 100]}),
        L.icon({
            iconUrl: stop_icon_0_0_hover,
            iconSize: [45, 60],
            iconAnchor: [22, 49]}),
        L.icon({
            iconUrl: stop_icon_1_hover,
            iconSize: [43, 100],
            iconAnchor: [10, 100]}),
        L.icon({
            iconUrl: stop_icon_1_0_hover,
            iconSize: [45, 60],
            iconAnchor: [22, 49]}),
        L.icon({
            iconUrl: stop_icon_2_hover,
            iconSize: [43, 100],
            iconAnchor: [10, 100]}),
        L.icon({
            iconUrl: stop_icon_2_0_hover,
            iconSize: [45, 60],
            iconAnchor: [22, 49]})
    ];

    MidpointIcons = [
        L.icon({
            iconUrl: midpoint_icon,
            iconSize: [25, 25],
            iconAnchor: [12, 12]}),
        L.icon({
            iconUrl: midpoint_icon_hover,
            iconSize: [31, 31],
            iconAnchor: [15, 15]})
    ]

    // Vehicle icon
    VehicleIcon  = function(line) {
        return L.divIcon({
            className: 'vehicle_icon',
            html: '<span class="dot"><div class="vehicle_label">' + line + '</div></span>'
        });
    }

    /**
     * It creates a new tool with respect to the props.
     *
     * @param {*} props
     */
    constructor(props) {
        super(props);
    }

    /**
     * A unique string of the tool type.
     */
    static TYPE() {
        return "geovisto-tool-transit";
    }

    /**
     * It creates a copy of the uninitialized tool.
     */
    copy() {
        return new TransitLayerTool(this.getProps());
    }

    /**
     * It creates new defaults of the tool.
     */
    createDefaults() {
        return new TransitLayerToolDefaults();
    }

    /**
     * It returns default tool state.
     */
    createState() {
        return new TransitLayerToolState();
    }

    getSidebarTabControl() {
        if(this.tabControl == undefined) {
            this.tabControl = this.createSidebarTabControl();
        }
        return this.tabControl;
    }

    /**
     * It creates new tab control.
     */
    createSidebarTabControl() {
        return new TransitLayerToolTabControl({ tool: this });
    }

    /**
     * Help function which acquires and returns the selection tool if available.
     */
    getSelectionTool() {
        if(this.selectionTool == undefined) {
            let tools = this.getMap().getState().getTools().getByType(SelectionTool.TYPE());
            if(tools.length > 0) {
                this.selectionTool = tools[0];
            }
        }
        return this.selectionTool;
    }

    /**
     * Creates progress bar element.
     */
    setDataProcessingState(state, step) {
        if (state) {
            this.step = step;
            this.processingData = true;
            let root = document.getElementById('my-geovisto-map');
            this.progressDiv = document.createElement('div');
            let label = document.createElement('div');
            label.classList.add('progress_label');
            label.innerHTML = '<div>Processing data</div>';

            let progress_bar = document.createElement('progress');
            progress_bar.classList.add('progress_bar');
            progress_bar.setAttribute("value", "0");
            progress_bar.setAttribute("max", "100");

            this.progressDiv.appendChild(label);
            label.appendChild(progress_bar);
            this.progressDiv.classList.add('loading');

            root.appendChild(this.progressDiv);
        } else {
            this.processingData = false;
            this.progressDiv.remove();
        }
    }

    /**
     * Set progress value in progress bar.
     */
    setProcessPercentage() {
        this.progressDiv.children[0].children[1].value += this.step;
    }

    /**
     * Function to return map to default state with saved objects only.
     */
    setDefaultMapState(createRoutes = true) {
        if (this.tabControl.getElementsMode() === 'stopModeNew' &&
            this.selected_stop !== undefined) {
            this.selected_stop.setIcon(this.StopIcons[this.selected_stop.options.index]);
            this.stop_save();
        } else if (this.tabControl.getElementsMode() === 'stopMode' &&
            this.selected_stop !== undefined) {
            this.selected_stop.dragging.disable();
            this.selected_stop.setLatLng(this.old_position);
            this.selected_stop.options.index = this.old_index;
            this.selected_stop.setIcon(this.StopIcons[this.old_index]);
        } else if (this.viewMode) {
            if (this.selected_stop !== undefined)
                this.selected_stop.setIcon(this.StopIcons[this.selected_stop.options.index]);
        }

        if (createRoutes) {
            if (this.selected_route !== undefined) {
                this.getMap().getState().getLeafletMap().removeControl(this.selected_route.route);
                this.selected_route.route = this.route_create(this.selected_route.waypoints, this.selected_route.color, 0,
                    this.selected_route.name, false);
            }
        }
        var _this = this;
        this.route_midpoints.forEach(function (point) {
            _this.getState().getLayer().removeLayer(point);
        })

        this.selected_line = undefined;
        this.selected_route = undefined;
        this.selected_midpoint = undefined;

        if (this.new_route_stops.length > 0){
            this.new_route_stops[this.new_route_stops.length - 1].setIcon(
                this.StopIcons[this.new_route_stops[this.new_route_stops.length - 1].options.index]);
            this.new_route_stops = [];
            this.new_route_polygons.forEach(function (polygon) {
                polygon.remove();
            })
        }
        this.tabControl.setElementsMode('lineMode');
    }

    /**
     * Return map icons.
     */
    getIconImages() {
        var icons = [];
        this.StopIcons.forEach( function (icon) {
            icons.push(icon.options.iconUrl);
        })

        return icons;
    }

    /**
     * Return if viewMode is enabled.
     */
    isViewMode() {
        return this.viewMode;
    }

    /**
     * Add new stop function.
     */
    stop_add(position) {
        var _this = this;
        this.selected_stop = L.marker([position.lat, position.lng],
            {title: "",
                draggable: true,
                id: undefined,
                icon: _this.StopIconsHovered[_this.tabControl.stopType.getIndex()],
                index: _this.tabControl.stopType.getIndex()})
            .addTo(this.getState().getLayer())
            .on('click', function (e) {
                _this.stop_click(e);
            })
        this.selected_stop.options.id = L.stamp(this.selected_stop);
    }

    /**
     * Save new or changed stop data.
     */
    stop_save() {
        if (this.selected_stop === undefined){
            return false;
        }

        this.selected_stop._icon.title = this.tabControl.textInput.getValue();
        this.selected_stop.options.title = this.tabControl.textInput.getValue();
        this.selected_stop.dragging.disable();
        this.selected_stop.setIcon(this.StopIcons[this.selected_stop.options.index]);

        if (this.old_position !== undefined && this.selected_stop.getLatLng().lat !== this.old_position.lat &&
            this.selected_stop.getLatLng().lng !== this.old_position.lng &&
            this.tabControl.getElementsMode() === 'stopMode') {
            var _this = this, TIME = 1100, t = 0;
            this.lines.forEach(function (line) {
                line.routes.forEach(function (route) {
                    route.waypoints.forEach(function (point) {
                        if (point[1] === _this.selected_stop.options.id) {
                            point[0].lat = _this.selected_stop.getLatLng().lat;
                            point[0].lng = _this.selected_stop.getLatLng().lng;

                            if (route.route !== undefined) {
                                _this.getMap().getState().getLeafletMap().removeControl(route.route);
                                if (line.vis) {
                                    setTimeout(() => {route.route = _this.route_create(route.waypoints, route.color,
                                        0, route.name)}, t);
                                    t += TIME;
                                }
                            } else {
                                _this.trip_compute_stops(route.name);
                            }
                        }
                    })
                })
            })

            this.old_position = undefined;
        }

        if (this.stops.indexOf(this.selected_stop) === -1)
            this.stops.push(this.selected_stop);

        return true;
    }

    /**
     * Prepare information about stop, when user clicks on it in viewMode.
     */
    stop_show_info(e) {
        let stop = e.target, lines = [], _this = this;
        this.lines.forEach(function (line) {
            line.routes.forEach(function (route) {
                route.waypoints.forEach(function (point, i) {
                    if (point[1] === stop.options.id) {
                        lines.push({name: route.name, end_1: '', end_2: '', index: 0, line: line.name});
                        _this.stops.forEach(function (item) {
                            if (item.options.id === route.waypoints[0][1]) {
                                lines[lines.length - 1].end_1 = item.options.title;
                            }
                            if (item.options.id === route.waypoints[route.waypoints.length - 1][1]) {
                                lines[lines.length - 1].end_2 = item.options.title;
                            }
                        })
                        lines[lines.length - 1].index  = i;
                        lines[lines.length - 1].index_2  = route.waypoints.length - i;
                    }
                })
            })
        })

        let date = new Date();
        let ac_time = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds(),
            day_type, is_trip = false, result = [], week_day = date.getDay();

        lines.forEach(function (line) {
            _this.trips.forEach(function (trip) {
                if (trip.route_name === line.name) {
                    trip.trips.forEach(function (t) {
                        if ((t.dep_time - 3600) < ac_time && trip.trip_stops !== undefined &&
                            (t.dep_time + (trip.trip_stops.length * _this.REFRESH_TIME)) > ac_time){

                            if ((ac_time < t.dep_time + trip.stop_times[line.index * 2 + 1] &&
                                line.index * 2 < trip.stop_times.length - 2 && t.dir === 0) ||
                                (ac_time < t.dep_time + trip.stop_times[line.index_2 * 2] &&
                                    line.index_2 * 2 < trip.stop_times.length - 2 && t.dir === 1)) {
                                if (week_day === 0 || week_day === 6) {
                                    day_type = 2;
                                } else {
                                    if (_this.trip_is_holiday(date, trip.route_name))
                                        day_type = 2;
                                    else if (_this.trip_is_school_holiday(date, trip.route_name))
                                        day_type = 1;
                                    else
                                        day_type = 0;
                                }

                                t.day_type.forEach(function (day) {
                                    if (day === day_type){
                                        is_trip = true;
                                    }
                                })
                                if (is_trip && t.dir === 0) {
                                    result.push({line: line.line, time: t.dep_time + trip.stop_times[line.index * 2 + 1],
                                        dest: line.end_2});
                                } else if (is_trip && t.dir === 1) {
                                    result.push({line: line.line, time: t.dep_time + trip.stop_times[line.index_2 * 2 - 1],
                                        dest: line.end_1});
                                }
                                is_trip = false;
                            }
                        }
                    })
                }
            })
        })

        result.sort((x, y) => (x.time > y.time) ? 1 : -1);

        result.forEach(function (item) {
            item.time = Math.floor(item.time / (60 * 60)).toString().padStart(2, "0") + ':' +
                Math.round(item.time % (60 * 60) / 60).toString().padStart(2, "0")
        })

        this.tabControl.dataVis.setVisible(true);
        this.tabControl.dataVis.showBusStop(stop.options.title, result);
    }

    /**
     * Function to handle on stop click event.
     */
    stop_click(e) {
        if (this.viewMode) {
            this.setDefaultMapState(false);
            this.selected_stop = e.target;
            this.selected_stop.setIcon(this.StopIconsHovered[this.selected_stop.options.index]);
            this.stop_show_info(e);
        } else if (this.tabControl.getElementsMode() === 'lineMode' ||
            this.tabControl.getElementsMode() === 'filterMode' ||
            this.tabControl.getElementsMode() === 'routeMode' ||
            this.tabControl.getElementsMode() === 'stopMode' ||
            this.tabControl.getElementsMode() === 'stopModeNew') {

            if (this.tabControl.getElementsMode() === 'stopMode' ||
                this.tabControl.getElementsMode() === 'filterMode' ||
                this.tabControl.getElementsMode() === 'stopModeNew' ||
                this.tabControl.getElementsMode() === 'routeMode') {
                this.setDefaultMapState();
            }

            this.tabControl.setElementsMode('stopMode');

            this.selected_stop = e.target;

            this.old_position = Object.assign({}, this.selected_stop.getLatLng());
            this.old_index = this.selected_stop.options.index;
            this.selected_stop.dragging.enable();
            this.tabControl.textInput.setValue(this.selected_stop.options.title);
            this.tabControl.stopType.setIndex(this.selected_stop.options.index);
            this.selected_stop.setIcon(this.StopIconsHovered[this.selected_stop.options.index]);
        } else if (this.tabControl.getElementsMode() === 'routeModeNew') {
            if (this.new_route_stops[this.new_route_stops.length - 1] === e.target){
                return;
            }

            if (this.new_route_stops.length > 0) {
                this.new_route_stops[this.new_route_stops.length - 1].setIcon(
                    this.StopIcons[this.new_route_stops[this.new_route_stops.length - 1].options.index]);
            }

            this.new_route_stops.push(e.target);
            this.new_route_stops[this.new_route_stops.length - 1].setIcon(
                this.StopIconsHovered[this.new_route_stops[this.new_route_stops.length - 1].options.index]);

            if (this.new_route_stops.length > 1) {
                this.new_route_polygons.push(new L.polyline(
                    [this.new_route_stops[this.new_route_stops.length - 2].getLatLng(),
                        this.new_route_stops[this.new_route_stops.length - 1].getLatLng()],
                    { color: '#E84248',
                        weight: 4,
                        opacity: 0.8,
                        smoothFactor: 1
                }));
                this.new_route_polygons[this.new_route_polygons.length - 1].addTo(this.getMap().getState().getLeafletMap());
            }
        }
    }

    /**
     * Clear midpoints on the end of route.
     * On the end of route can be stops only.
     */
    stop_delete_clear_midpoints(waypoints, direction) {
        if (direction === 'up') {
            if (waypoints[0][1] === undefined) {
                waypoints.splice(0, 1);
                this.stop_delete_clear_midpoints(waypoints, direction)
            }
        } else if (direction === 'down') {
            if (waypoints[waypoints.length - 1][1] === undefined) {
                waypoints.splice(waypoints.length - 1, 1);
                this.stop_delete_clear_midpoints(waypoints, direction)
            }
        }
    }

    /**
     * Stop delete.
     */
    stop_delete() {
        if (this.selected_stop === undefined || this.viewMode) {
            return;
        }
        var _this = this, rou = true, TIME = 1100, t = 0;

        this.lines.forEach(function (line) {
            line.routes.forEach(function (route) {
                route.waypoints.forEach(function (point) {
                    if (point[1] === _this.selected_stop.options.id) {
                        point[1] = undefined;
                        if (route.route !== undefined)
                            _this.getMap().getState().getLeafletMap().removeControl(route.route);
                        rou = false;
                    }
                })

                if (!rou) {
                    _this.stop_delete_clear_midpoints(route.waypoints, 'up');
                    _this.stop_delete_clear_midpoints(route.waypoints, 'down');

                    if (route.waypoints.length === 1) {
                        var pos = line.routes.indexOf(route);
                        line.routes.splice(pos, 1);
                    } else {
                        if (line.vis) {
                            setTimeout(() => {route.route = _this.route_create(route.waypoints, route.color,
                                0, route.name)}, t);
                            t += TIME;
                        }
                    }
                }
                rou = true;
            })
        })

        var pos = this.stops.indexOf(this.selected_stop);
        this.stops.splice(pos, 1);

        this.getState().getLayer().removeLayer(this.selected_stop);
        this.selected_stop = undefined;
        this.setDefaultMapState(false);
    }

    /**
     * Process imported stop data.
     */
    stop_on_import(name, latLng, type) {
        var _this = this, index, position, result = undefined;
        this.stops.forEach(function (stop) {
            position = stop.getLatLng();

            if (position.lat === stop.lat && position.lng === stop.lng) {
                result = stop.options.id;
            }
        })

        if (result !== undefined) {
            return result;
        }

        this.selected_stop = L.marker(latLng,
            {title: name,
                draggable: false,
                id: undefined,
                icon: _this.StopIcons[type],
                index: type})
            .addTo(this.getState().getLayer())
            .on('click', function (e) {
                _this.stop_click(e);
            })
        this.selected_stop.options.id = L.stamp(this.selected_stop);
        index = this.selected_stop.options.id;
        this.selected_stop._icon.title = this.selected_stop.options.title;
        this.stops.push(this.selected_stop);

        this.selected_stop = undefined;

        return index;
    }

    /**
     * Change line or route visibility.
     */
    line_change_visibility(name, value, type) {
        var _this = this, line;

        if (type === 'line') {
            this.lines.forEach(function (item) {
                if (item.name === name) {
                    line = item;
                }
            })

            if (value) {
                let TIME = 1100, t = 0, count = 0;

                line.routes.forEach(function (route){
                    if (route.vis) {
                        count++;
                    }
                })

                this.setDataProcessingState(true, 100 / count);

                line.routes.forEach(function (route){
                    if (route.vis) {
                        setTimeout(() => {route.route = _this.route_create(route.waypoints, route.color,
                            0, route.name, false);
                            _this.setProcessPercentage()}, t);
                        t += TIME;
                    }
                })

                setTimeout(() => {this.setDataProcessingState(false)}, t);

                this.trip_set_TT_day();
            } else {
                line.routes.forEach(function (route){
                    if (route.vis) {
                        _this.getMap().getState().getLeafletMap().removeControl(route.route);
                    }

                    _this.trips.forEach(function (trip) {
                        if (trip.route_name === route.name) {
                            _this.vehicles.forEach(function (vehicle) {
                                if (vehicle.trip === trip){
                                    vehicle.trip_stops = [];
                                }
                            })
                        }
                    })
                })
            }

            line.vis = value;
            this.onTimeChanged();
        } else {
            this.lines.forEach(function (line) {
                line.routes.forEach(function (route) {
                    if (route.name === name) {
                        if (value) {
                            route.route = _this.route_create(route.waypoints, route.color,
                                0, route.name, false);
                        } else {
                            _this.getMap().getState().getLeafletMap().removeControl(route.route);
                            route.route = undefined;
                        }
                        route.vis = value;
                    }
                })
            })
        }
    }

    /**
     * Save new or changed line data.
     */
    line_save(mode) {
        if (this.tabControl.textInput.getValue() !== undefined) {
            if (this.selected_line !== undefined && this.tabControl.getElementsMode() === 'lineMode' && mode === 'save') {
                var _this = this;
                this.selected_line.name = this.tabControl.textInput.getValue();

                if (this.selected_line.color !== this.tabControl.colorInput.getColor()){
                    this.selected_line.color = this.tabControl.colorInput.getColor();

                    let TIME = 1100, t = 0;

                    this.setDataProcessingState(true, this.selected_line.routes.length / 100);

                    this.selected_line.routes.forEach(function (route) {
                        route.color = _this.selected_line.color;
                        if (_this.selected_line.vis) {
                            if (route.vis) {
                                _this.getMap().getState().getLeafletMap().removeControl(route.route);
                                setTimeout(() => {route.route = _this.route_create(route.waypoints, route.color,
                                    0, route.name, false);
                                    _this.setProcessPercentage()}, t);
                                t += TIME;
                            }
                        }
                    })

                    this.setDataProcessingState(false);
                }
                return true;
            } else if (this.tabControl.getElementsMode() === 'lineMode' && mode === 'save_as_new') {
                this.lines.push({name: this.tabControl.textInput.getValue(),
                    color: this.tabControl.colorInput.getColor(), routes: [], vis: true});
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * Line delete function.
     */
    line_delete() {
        if (this.selected_line === undefined) {
            return;
        }

        var _this = this;

        this.selected_line.routes.forEach(function (route){
            _this.getMap().getState().getLeafletMap().removeControl(route.route);

            _this.trips.forEach(function (trip) {
                if (trip.route_name === route.name) {
                    trip.trip_stops = [];
                    trip.trip_stops = undefined;
                }

                _this.vehicles.forEach(function (vehicle) {
                    if (vehicle.trip === trip){
                        vehicle.trip_stops = [];
                    }
                })
            })
        })

        var pos = this.lines.indexOf(this.selected_line);
        this.lines.splice(pos, 1);
        this.setDefaultMapState();
    }

    /**
     * Process imported line data.
     */
    line_on_import(name, color, vis) {
        this.lines.push({name: name, color: color, routes: [], vis: vis});

        return this.lines.length - 1;
    }

    /**
     * Prepare data for stop order tool when user click on map.
     */
    route_click_prepare_stops() {
        var _this = this;
        var stop_labels = [];
        this.selected_route.waypoints.forEach(function (point) {
            if (point[1] !== undefined) {
                _this.stops.forEach(function (stop) {
                    if (stop.options.id === point[1]) {
                        stop_labels.push([0, stop.options.title]);
                    }
                })
            } else {
                stop_labels.push([1, 'midpoint']);
            }
        })

        this.tabControl.stopOrder.addStops(stop_labels, this.selected_route.route.getWaypoints());
    }

    /**
     * Process on route user clicked event.
     */
    route_click(rou) {
        if (this.tabControl.getElementsMode() !== 'lineMode') {
            this.setDefaultMapState();
        }

        if (this.viewMode) {
            return;
        }

        this.tabControl.setElementsMode('routeMode');
        var _this = this;

        this.lines.forEach(function (line){
            line.routes.forEach(function (route) {
                if (route.route !== undefined && route.route._line.stamp === rou.stamp){
                    _this.tabControl.textInput.setValue(line.name);
                    _this.selected_route = route;
                }
            })
        })

        this.getMap().getState().getLeafletMap().removeControl(this.selected_route.route);
        this.selected_route.route = this.route_create(this.selected_route.waypoints, this.selected_route.color, 1);

        this.route_click_prepare_stops();
        this.tabControl.textInput2.setValue(this.selected_route.name);
    }

    /**
     * Wait function, until route is computed in LeafletJS Routing Machine plugin.
     */
    route_compute_stops(e, name) {
        let _this = this;

        if (e.target._selectedRoute === undefined) {
            setTimeout(function () {
                _this.trip_compute_stops(name);
            }, 1000);
        } else {
            _this.trip_compute_stops(name);
        }
    }

    /**
     * Create route or working route.
     */
    route_create(waypoints, color, type, name = undefined, recompute = true) {
        var _this = this;
        if (type === 0) {
            let points = [];
            waypoints.forEach(function (point) {
                points.push(point[0]);
            })
            return L.Routing.control({
                waypoints: points,
                createMarker: function () {
                    return null;
                },
                routeLine: function (route) {
                    var line = L.Routing.line(route, {
                        addWaypoints: false,
                        extendToWaypoints: false,
                        routeWhileDragging: false,
                        autoRoute: true,
                        allowUTurns: true,
                        show: false,
                        styles: [{
                            color: color, weight: 4, opacity: 1.0,
                            smoothFactor: 1
                        }],
                    });
                    line.stamp = L.stamp(line);
                    line.eachLayer(function (l) {
                        l.on('click', function (e) {
                            _this.route_click(line);
                        });

                    });
                    return line;
                }
            })
                .addTo(this.getMap().getState().getLeafletMap())
                .on('routesfound', function (e) {
                    if (recompute) {
                        _this.route_compute_stops(e, name);
                    }
                })
        } else {
            let points = [];
            waypoints.forEach(function (point) {
                points.push(point[0]);
            })
            return L.Routing.control({
                waypoints: points,
                createMarker: function (index, point) {
                    let temp_point = undefined;
                    waypoints.forEach(function (waypoint) {
                        if (waypoint[0] === point.latLng && waypoint[1] !== undefined) {
                            temp_point = waypoint;
                        }
                    })

                    if (temp_point !== undefined) {
                        return null;
                    }
                    temp_point = L.marker(point.latLng,
                        {draggable: false,
                            icon: _this. MidpointIcons[0]
                        })
                        .addTo(_this.getState().getLayer())
                        .on('click', function (e) {
                            if (_this.selected_midpoint !== undefined) {
                                _this.selected_midpoint.dragging.disable();
                                _this.selected_midpoint.setIcon(_this. MidpointIcons[0]);
                            }
                            _this.selected_midpoint = e.target;
                            _this.selected_midpoint.dragging.enable();
                            _this.selected_midpoint.setIcon(_this.MidpointIcons[1]);
                        })
                    _this.selected_midpoint = temp_point;
                    _this.route_midpoints.push(temp_point);
                    return temp_point;
                },
                routeLine: function (route) {
                    return L.Routing.line(route, {
                        addWaypoints: true,
                        extendToWaypoints: false,
                        routeWhileDragging: false,
                        autoRoute: true,
                        styles: [{
                            color: color, weight: 4, opacity: 1.0,
                            smoothFactor: 1, dashArray: '12,12'
                        }],
                    });
                }
            })
                .addTo(this.getMap().getState().getLeafletMap())
                .on('routesfound', function (e) {
                    _this.tabControl.stopOrder.addMidpoint(e.waypoints);
                })
        }
    }

    /**
     * Save changed route.
     */
    route_save() {
        if (this.tabControl.textInput2.getValue() === '') {
            return false;
        }

        var _this = this;

        this.lines.forEach(function (line){
            if (line.name === _this.tabControl.textInput.getValue()) {
                _this.selected_line = line;
            }
        })

        if (this.selected_line === undefined) {
            return false;
        }

        if (this.tabControl.getElementsMode() === 'routeModeNew' && this.selected_route === undefined) {
            if (this.new_route_stops.length < 1) {
                return false;
            }

            let stop_points = [];
            this.new_route_stops.forEach(function (waypoint) {
                stop_points.push([waypoint.getLatLng(), waypoint.options.id]);
            })

            this.selected_line.routes.push({route: undefined, name: this.tabControl.textInput2.getValue(),
                waypoints: stop_points, color: this.selected_line.color, vis: true});

            if (this.selected_line.vis) {
                this.selected_line.routes[this.selected_line.routes.length - 1].route = this.route_create(stop_points,
                    this.selected_line.color, 0, this.tabControl.textInput2.getValue())
            }

            this.new_route_stops[this.new_route_stops.length - 1].setIcon(
                this.StopIcons[this.new_route_stops[this.new_route_stops.length - 1].options.index]);
            this.new_route_stops = [];
            this.new_route_polygons.forEach(function (polygon) {
                polygon.remove();
            })

        } else if (this.selected_route !== undefined) {
            this.lines.forEach(function (line){
                line.routes.forEach(function (route) {
                    if (route === _this.selected_route) {
                        _this.selected_line = line;
                    }
                })
            })
            var new_waypoints = [], pushed = false;
            this.selected_route.route._line._route.inputWaypoints.forEach(function (point) {
                _this.selected_route.waypoints.forEach(function (old_point){
                    if (old_point[0] === point.latLng && !pushed) {
                        if (old_point[1] !== undefined) {
                            new_waypoints.push(old_point);
                            pushed = true;
                        }
                    }
                })
                if (!pushed) {
                    new_waypoints.push([point.latLng, undefined])
                }
                pushed = false;
            })

            this.getMap().getState().getLeafletMap().removeControl(this.selected_route.route);

            if (this.selected_line.name !== this.tabControl.textInput.getValue()) {
                this.lines.forEach(function (line){
                    line.routes.forEach(function (route) {
                        if (route === _this.selected_route) {
                            var pos = line.routes.indexOf(route);
                            line.routes.splice(pos, 1);
                        }
                    })
                })

                this.lines.forEach(function (line){
                    if (line.name === _this.tabControl.textInput.getValue()) {
                        _this.selected_line = line;
                    }
                })

                if (this.selected_line === undefined) {
                    return false;
                }

                this.selected_line.routes.push (
                    {route: undefined, name: this.tabControl.textInput2.getValue(),
                        waypoints: new_waypoints, color: this.selected_line.color, vis: this.selected_route.vis});
                if (this.selected_line.vis) {
                    this.selected_line.routes[this.selected_line.routes.length - 1].route =
                        this.route_create(new_waypoints, this.selected_line.color, 0,
                            this.tabControl.textInput2.getValue())
                }
                this.new_route_stops = [];

                this.setDefaultMapState(false);
                return true;
            }
            this.selected_route.route = this.route_create(new_waypoints, this.selected_line.color, 0,
                this.tabControl.textInput2.getValue())
            this.selected_route.waypoints = new_waypoints;
            this.selected_route.name = this.tabControl.textInput2.getValue();
        } else {
            return false;
        }
        this.setDefaultMapState(false);
        return true;
    }

    /**
     * Delete route.
     */
    route_delete() {
        if (this.viewMode){
            return;
        }
        var _this = this;
        this.lines.forEach(function (line){
            if (line.name === _this.tabControl.textInput.getValue()) {
                _this.selected_line = line;
            }
        })

        var pos = this.selected_line.routes.indexOf(this.selected_route);
        this.selected_line.routes.splice(pos, 1);
        this.getMap().getState().getLeafletMap().removeControl(this.selected_route.route);

        this.trips.forEach(function (trip) {
            if (trip.route_name === _this.selected_route.name) {
                trip.trip_stops = [];
                trip.trip_stops = undefined;

                _this.vehicles.forEach(function (vehicle) {
                    if (vehicle.trip === trip){
                        vehicle.trip_stops = [];
                    }
                })
            }
        })

        this.setDefaultMapState(false);
    }

    /**
     * Process imported route data.
     */
    route_on_import(route, stop_indexes) {
        let _this = this, waypoints = [], index = route.id;

        route.waypoints.forEach(function (point) {
            if (point.id === undefined) {
                waypoints.push([point.pos, undefined])
            } else {
                stop_indexes.forEach(function (stop) {
                    if (stop.id === point.id) {
                        waypoints.push([undefined, stop.map])
                    }
                })
            }
        })

        waypoints.forEach(function (point) {
            if (point[0] === undefined) {
                _this.stops.forEach(function (stop) {
                    if (stop.options.id === point[1]) {
                        point[0] = stop.getLatLng();
                    }
                })
            }
        })

        this.lines[index].routes.push({route: undefined, name: route.name, waypoints: waypoints,
            color: this.lines[index].color, vis: route.vis});

        if (this.lines[index].vis) {
            if (route.vis) {
                this.lines[index].routes[this.lines[index].routes.length - 1].route =
                    this.route_create(waypoints, this.lines[index].color, 0, route.name);
            } else {
                this.trip_compute_stops(route.name);
            }
        }
    }

    /**
     * Function to handle leaflet map clicked event.
     */
    onMapClick(event) {
        if (this.viewMode) {
            this.setDefaultMapState(false);
        } else if (this.tabControl.getElementsMode() === 'stopModeNew') {
            if (this.selected_stop !== undefined) {
                this.selected_stop.setIcon(this.StopIcons[this.selected_stop.options.index]);
                this.stop_save();
            }
            this.stop_add(event.latlng);
        } else if (this.tabControl.getElementsMode() === 'stopMode') {
            this.selected_stop.dragging.disable();
            this.selected_stop.setLatLng(this.old_position);
            this.selected_stop.options.index = this.old_index;
            this.selected_stop.setIcon(this.StopIcons[this.old_index]);
            this.tabControl.setElementsMode('stopModeNew');
            this.stop_add(event.latlng);
        } else if (this.tabControl.getElementsMode() === 'routeMode') {
            if (this.selected_midpoint !== undefined) {
                this.selected_midpoint.dragging.disable();
                this.selected_midpoint.setIcon(this. MidpointIcons[0]);
                this.selected_midpoint = undefined;
            }
        } else if (this.tabControl.getElementsMode() !== 'routeModeNew') {
            this.setDefaultMapState();
        }
    }

    /**
     * Function to handle subtool selection.
     */
    onButtonClick(event) {
        if (event.target.title === 'viewMode') {
            if (!this.viewMode) {
                this.control.setViewMode();
                this.viewMode = true;
                this.setDefaultMapState();
            } else {
                this.control.unsetViewMode();
                this.viewMode = false;
                this.setDefaultMapState(false);
            }
        } else if (!this.viewMode) {
            if (this.tabControl.getElementsMode() === event.target.title ||
                this.tabControl.getElementsMode() === event.target.title + 'New') {
                this.setDefaultMapState();
            } else {
                this.setDefaultMapState();
                this.tabControl.setElementsMode(event.target.title + 'New');
            }
        } else if (this.viewMode && event.target.title === 'filterMode') {
            if (this.tabControl.getElementsMode() === event.target.title) {
                this.setDefaultMapState(false);
            } else {
                this.setDefaultMapState(false);
                this.tabControl.setElementsMode(event.target.title);
            }
        }

        event.stopPropagation();
    }

    /**
     * Process on subTool selection.
     */
    onKeyPressed(event) {
        if (event.originalEvent.key === 'Escape') {
            if (this.selected_midpoint !== undefined) {
                this.selected_midpoint.dragging.disable();
                this.selected_midpoint.setIcon(this. MidpointIcons[0]);
                this.selected_midpoint = undefined;
            } else {
                this.setDefaultMapState();
            }
        } else if (event.originalEvent.key === 'Delete') {
            if (this.viewMode) {
                return;
            }
            if (this.tabControl.getElementsMode() === 'stopMode') {
                this.stop_delete();
            } else if (this.tabControl.getElementsMode() === 'stopModeNew') {
                if (this.selected_stop !== undefined) {
                    this.stop_delete();
                }
            } else if (this.tabControl.getElementsMode() === 'lineMode') {
                this.line_delete();
            } else if (this.tabControl.getElementsMode() === 'routeMode') {
                var _this = this;
                this.route_midpoints.forEach(function (point) {
                    _this.getState().getLayer().removeLayer(point);
                })
                this.selected_midpoint = undefined;
                this.route_delete();
            } else if (this.tabControl.getElementsMode() === 'routeModeNew'){
                this.setDefaultMapState();
            }
        }
    }

    /**
     * Process on line select event in user input.
     */
    onSelectionChanged() {
        var _this = this;

        if (this.tabControl.getElementsMode() === 'lineMode') {
            this.lines.forEach(function (line) {
                if (line.name === _this.tabControl.textInput.getValue()) {
                    _this.selected_line = line;
                }
            })

            if (this.selected_line !== undefined) {
                this.tabControl.colorInput.setColor(this.selected_line.color);
            }
        }
    }

    /**
     * Main function for imported data processing.
     */
    on_data_import() {
        let input = this.getState().getImportedData();
        let TIME = 1100, t = 0, per = 0;

        // If input is undefined or empty, stop function execution
        if (input === undefined || this.getState().getDataState() === false ||
            (input.stops.length === 0 && input.lines.length === 0 && input.routes.length === 0)) {
            return;
        }

        // Compute loading time
        input.routes.forEach(function (route) {
            if (route.vis) {
                per++;
            }
        })

        this.setDataProcessingState(true, 100 / per);

        let _this = this, stop_indexes = [], line_indexes = [];

        // Stops import
        input.stops.forEach(function (stop, index) {
            stop_indexes.push({map: _this.stop_on_import(stop.name, stop.latLng, stop.type), id: index})
        })

        // Lines import
        input.lines.forEach(function (line) {
            line_indexes.push(_this.line_on_import(line.name, line.color, line.vis))
        })

        // Routes import
        input.routes.forEach(function (route) {
            if (route.vis) {
                setTimeout(() => {_this.route_on_import(route, stop_indexes);
                    _this.setProcessPercentage()}, t);
                t += TIME;
            } else {
                _this.route_on_import(route, stop_indexes);
            }
        })

        setTimeout(() => {_this.setDataProcessingState(false)}, t);

        this.setDefaultMapState(false);
        this.getState().clearImportedData();
        this.getState().setDataState(false);
    }

    /**
     * When time changed function.
     */
    onTimeChanged() {
        var time = new Date();
        var ac_time = time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds();

        if (!this.processingData) {
            this.on_data_import();
            this.vehicle_set_on_map(ac_time);
            this.vehicle_set_position(ac_time);
            console.log('time:', time.getHours().toString().padStart(2, "0") + ':' +
                time.getMinutes().toString().padStart(2, "0") + ':' + time.getSeconds().toString().padStart(2, "0"),
                'Number of active vehicles:', this.vehicles.length);
        }
    }

    /**
     * Extend default class function. Add listener function on leaflet map.
     */
    create() {
        var _this = this;

        this.getMap().getState().getLeafletMap().on('click', function (e) {
            _this.onMapClick(e);
        });

        this.getMap().getState().getLeafletMap().on('keydown', function (e) {
            _this.onKeyPressed(e);
        });

        this.getState().setVisualisationData(this.stops, this.lines);

        super.create();
    }

    /**
     * It creates layer items.
     */
    createLayerItems() {
        // create Choropleth layer
        let layer = L.featureGroup([]);

        this.getState().setLayer(layer);

        return [ layer ];
    }

    /**
     * It deletes layer items.
     */
    deleteLayerItems() {
        let layer = this.getState().getLayer();

        // get layer element
        if(layer._container != undefined) {
            let layerElement = layer._container.childNodes[0];
            // delete layer element's children (connections)
            while (layerElement.firstChild) {
                layerElement.removeChild(layerElement.lastChild);
            }
        }

        this.lines.forEach(function (line) {
            line.routes.forEach(function (route) {
                _this.getMap().getState().getLeafletMap().removeControl(route.route);
            })
        })

    }

    /**
     * Extend default class function. Show tool control and routes.
     */
    showLayerItems() {
        let _this = this, TIME = 1100, t = 0, count = 0;

        this.control = L.control.transitControl({position: 'topleft', fn: function (e) {
            _this.onButtonClick(e);
            },
            icons: ['fa fa-flag', 'fa fa-random', 'fa fa-filter', 'fa fa-eye']})
            .addTo(this.getMap().getState().getLeafletMap());

        this.lines.forEach(function (line) {
            line.routes.forEach(function (route) {
                if (line.vis){
                    if (route.vis) {
                        count++;
                    }
                }
            })
        })

        this.setDataProcessingState(true, 100 / count);

        this.lines.forEach(function (line) {
            line.routes.forEach(function (route) {
                if (line.vis){
                    if (route.vis) {
                        setTimeout(() => {route.route = _this.route_create(route.waypoints, route.color, 0,
                            route.name, false),
                        _this.setProcessPercentage()}, t);
                        t += TIME;
                    }
                }
            })
        })

        setTimeout(() => {this.setDataProcessingState(false)}, t);

        while (id){
            window.clearInterval(id);
            id--;
        }

        id = window.setInterval(function () {
            _this.onTimeChanged()
        }, 5000);

        super.showLayerItems();
    }

    /**
     * Extend default class function. Hide tool control and routes.
     */
    hideLayerItems() {
        this.control.remove();

        this.setDefaultMapState(false);

        let _this = this;

        this.lines.forEach(function (line) {
            line.routes.forEach(function (route) {
                if (route.route !== undefined) {
                    _this.getMap().getState().getLeafletMap().removeControl(route.route);
                }
            })
        })

        this.trips.forEach(function (trip) {
            _this.trip_delete_vehicles(trip);
        })

        clearInterval(this.interval);

        super.hideLayerItems();
    }

    compute_trip_points(route, route_waypoints, way_times) {
        /**
         * Algorithm of realtime vehicle movement
         *
         * Every route is defined on map by lines - tuple of points
         * Main idea - vehicle will move only from point to point on refresh time
         * So we compute this specific points, depends on refresh time and way time between stops
         * In the end, every vehicle will move only from point to point on its route
         *
         * Route is divide on lines, every line is defined by two points
         * First we need to know index of stop points
         *
         * Then we can compute distances between stops
         *
         * If we have distances we compute how many points will be between stops
         * It depends on distance, refresh time and travel time between two stops
         *
         * The last step is compute positions of specific points - we create trip points array
         */
        let stop_positions = [], indices = route._selectedRoute.waypointIndices;
        let lines_length = [], stop_distances = [], stop_times = [], travel_times = [];
        let i, j, k, len = 0, x, y, per = 0;
        let trip_points = [];

        // Select only stop indices, not midpoints indices
        route_waypoints.forEach(function (point, index) {
            if (point[1] !== undefined)
                stop_positions.push(indices[index])
        })

        // Compute real distances between stops
        // Compute distance between two stops, between two indexes
        for (i = 1; i < stop_positions.length; i++) {
            for (j = stop_positions[i - 1]; j < stop_positions[i]; j++) {
                // First we save current line length
                lines_length.push(route._selectedRoute.coordinates[j].distanceTo(route._selectedRoute.coordinates[j + 1]));
                // Then we add current line length to whole distance between stops
                len += route._selectedRoute.coordinates[j].distanceTo(route._selectedRoute.coordinates[j + 1]);
            }

            // At last we save whole distance between 2 stops
            stop_distances.push(len);
            len = 0;
        }

        // Compute stop time durations
        for (i = 0; i < Math.floor(way_times.length / 2) * 2 - 1; i += 2) {
            stop_times.push(way_times[i + 1] - way_times[i]);
        }

        // Compute travel time durations
        for (i = 1; i < Math.floor(way_times.length / 2) * 2 - 2; i += 2) {
            travel_times.push(way_times[i + 1] - way_times[i]);
        }

        // Compute distance between specific trip points
        // If there is error, in timetable is more stops then on map or reverse,
        // algorithm compute movement only for common stops
        for (i = 0; (i < stop_distances.length) && (i < travel_times.length); i++) {
            // Compute distance for every tuple of stops
            // First we compute how many points will be between stops
            // number of points = route time between stops / refresh time

            // As second we compute points distances
            // distance = whole distance between stop / number of points
            stop_distances[i] /= (travel_times[i] / this.REFRESH_TIME).toFixed(2);
        }

        // The last step - compute trip points

        // Add first point on trip
        for (i = 0; i <= Math.floor(stop_times[0] / this.REFRESH_TIME); i++)
            trip_points.push(route._selectedRoute.coordinates[0]);

        for (i = 1; i < stop_positions.length; i++) {
            j = stop_positions[i - 1];
            while (j < stop_positions[i]) {
                // Is trip point on current line
                // If yes, compute position

                if ((stop_distances[i - 1] + len).toFixed(2) < lines_length[j]) {

                    // Compute position of point on line
                    per = (stop_distances[i - 1] + len) / (lines_length[j]);

                    // Compute position
                    x = route._selectedRoute.coordinates[j].lat +
                        ((route._selectedRoute.coordinates[j + 1].lat - route._selectedRoute.coordinates[j].lat) * per);
                    y = route._selectedRoute.coordinates[j].lng +
                        ((route._selectedRoute.coordinates[j + 1].lng - route._selectedRoute.coordinates[j].lng) * per);
                    // Save trip point
                    trip_points.push(L.latLng(x, y));
                    len += stop_distances[i - 1];
                // If not go to next line
                } else {
                    len -= lines_length[j];
                    j++;
                }
            }

            // We reached stop, so we add number of same points - stop points
            // This will simulates waiting at stop
            if (i !== stop_positions.length - 1)
                for (k = 0; k < Math.floor(stop_times[i] / this.REFRESH_TIME); k++) {
                    trip_points.push(route._selectedRoute.coordinates[stop_positions[i]]);
                }

            len = 0;
        }

        // Add last stop on trip
        for (i = 0; i < Math.floor(stop_times[stop_times.length - 1] / this.REFRESH_TIME); i++)
            trip_points.push(route._selectedRoute.coordinates[stop_positions[stop_positions.length - 1]]);

        return trip_points;
    }

    /**
     * Compute vehicle moving points - part 1
     */
    trip_compute_stops(route_id) {
        let cur_route, l;

        this.lines.forEach(function (line){
            line.routes.forEach(function (route) {
                if (route.name === route_id){
                    cur_route = route;
                    l = line.name;
                }
            })
        })

        if (cur_route === undefined || this.trips.length === 0) {
            return;
        }

        // If there is no route, program need to compute temporary route for trip stop computation
        if (cur_route.route === undefined) {
            // Compute temp route
            this.trip_compute_temp_route(cur_route.name, cur_route.waypoints, l)
        } else {
            // Use existing route
            this.trip_finish_stop_comp(cur_route.name, cur_route.route, cur_route.waypoints, l)
        }
    }

    /**
     * Compute vehicle moving points - part 2a
     */
    trip_compute_temp_route(name, waypoints, l) {
        let points = [], route;
        waypoints.forEach(function (point) {
            points.push(point[0]);
        })
        route = L.Routing.control({
            waypoints: points,
            createMarker: function () {
                return null;
            },
            routeLine: function (route) {
                return L.Routing.line(route, {
                    addWaypoints: false,
                    extendToWaypoints: false,
                    autoRoute: true,
                    styles: [{
                        color: 'black', opacity: 0.0
                    }],
                });
            }
        })
            .addTo(this.getMap().getState().getLeafletMap());

        this.trip_comp_wait(name, route, waypoints, l);
    }

    /**
     * Compute vehicle moving points - part 2b
     */
    trip_comp_wait(name, route, waypoints, l) {
        let _this = this;
        if (route._selectedRoute === undefined) {
            setTimeout(function () {
                _this.trip_comp_wait(name, route, waypoints, l);
            }, 1000);
        } else {
            _this.trip_finish_stop_comp(name, route, waypoints, l);
            _this.getMap().getState().getLeafletMap().removeControl(route);
        }
    }

    /**
     * Compute vehicle moving points - part 3
     */
    trip_finish_stop_comp(name, route, waypoints, l) {
        let _this = this;
        this.trips.forEach(function (trip) {
            if (trip.route_name === name) {
                trip.line = l;
                if (trip.trip_stops === undefined) {
                    trip.trip_stops = _this.compute_trip_points(route, waypoints,
                        trip.stop_times);
                } else {
                    trip.trip_stops = _this.compute_trip_points(route, waypoints,
                        trip.stop_times);

                    _this.vehicles.forEach(function (vehicle) {
                        if (vehicle.trip === trip){
                            vehicle.trip_stops = trip.trip_stops;
                        }
                    })
                }
            }
        })

        this.trip_set_TT_day();
        this.setProcessPercentage();
    }

    /**
     * Process and save information about holiday dates.
     */
    actualize_holidays(saved_data, data, rou, mode) {
        let pom = [], found = false;
        saved_data.forEach(function (item) {
            item.routes.forEach(function (it) {
                rou.forEach(function (r) {
                    if (it === r) {
                        found = true;
                    }
                })
                if (found === false) {
                    pom.push(it);
                }
                found = false;
            })
            item.routes = pom;
            pom = [];
        })

        data.forEach(function (item) {
            saved_data.forEach(function (it) {
                if (mode === 0) {
                    if (item === it.date) {
                        rou.forEach(function (r) {
                            it.routes.push(r);
                        })
                        found = true;
                    }
                } else {
                    if (item.from === it.dates.from && item.to === it.dates.to) {
                        rou.forEach(function (r) {
                            it.routes.push(r);
                        })
                        found = true;
                    }
                }
            })

            if (!found) {
                if (mode === 0) {
                    saved_data.push({date: item, routes: rou});
                } else {
                    saved_data.push({dates: item, routes: rou});
                }
            }
            found = false;
        })
    }

    /**
     * Delete old trip points and vehicles.
     */
    trips_delete_old_data(route_name) {
        let _this = this, del_index = -1;
        this.trips.forEach(function (trip, index) {
            if (trip.route_name === route_name) {
                del_index = index;
                _this.trip_delete_vehicles(trip);
            }
        })

        if (del_index !== -1) {
            this.trips.splice(del_index, 1);
        }
    }

    /**
     * Delete old vehicles.
     */
    trip_delete_vehicles(trip) {
        let _this = this;
        this.vehicles.forEach(function (vehicle) {
            if (vehicle.trip === trip){
                _this.vehicle_delete(vehicle);
                _this.trip_delete_vehicles(trip);
            }
        })
    }

    /**
     * Process imported transport data.
     */
    on_trips_load(input_data, holidays, school_holidays) {
        var _this = this, rou = [], TIME = 1100, t = 0;

        if (input_data !== undefined) {
            this.setDataProcessingState(true, 100 / input_data.length);

            // Save imported data
            input_data.forEach(function (data) {
                // Delete old data
                _this.trips_delete_old_data(data.route_name);

                _this.trips.push(data);
                rou.push(data.route_name);
                setTimeout(() => { _this.trip_compute_stops(data.route_name)}, t);
                t += TIME;
            })

            if (holidays !== undefined) {
                this.actualize_holidays(this.holidays, holidays, rou, 0);
            }

            if (school_holidays !== undefined) {
                this.actualize_holidays(this.school_holidays, school_holidays, rou, 1);
            }
        }

        // Actualize transit system mode for new trips
        this.trip_set_TT_day();

        setTimeout(() => { _this.setDataProcessingState(false)}, t);
    }

    /**
     * Compute if trip belongs to holiday mode of transit system.
     */
    trip_is_holiday(date, route) {
        let cur_date = date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString() + '-' +
            date.getDate().toString(), ret_value = false;

        this.holidays.forEach(function (item) {
            if (item.date === cur_date) {
                item.routes.forEach(function (r) {
                    if (r === route) {
                        ret_value = true;
                    }
                })
            }
        })

        return ret_value;
    }

    /**
     * Compute if trip belongs to school holiday mode of transit system.
     */
    trip_is_school_holiday(date, route) {
        let cur_date = date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString() + '-' +
            date.getDate().toString(), ret_value = false;

        this.school_holidays.forEach(function (item) {
            if (item.dates.from <= cur_date && item.dates.to >= cur_date) {
                item.routes.forEach(function (r) {
                    if (r === route) {
                        ret_value = true;
                    }
                })
            }
        })

        return ret_value;
    }

    /**
     * Set working mode of every trip.
     */
    trip_set_TT_day() {
        var day_type, week_day, date = new Date(), _this = this, is_trip = false;
        week_day = date.getDay();

        this.trips.forEach(function (trip) {
            _this.trip_delete_vehicles(trip);
        })

        // Day time mods
        // 0 - normal working days - Mon to Fri
        // 1 - school holidays - Mon to Fri
        // 2 - Sat + Sun + state holidays

        this.trips.forEach(function (trip) {
            // Compute mode
            if (week_day === 0 || week_day === 6) {
                day_type = 2;
            } else {
                if (_this.trip_is_holiday(date, trip.route_name))
                    day_type = 2;
                else if (_this.trip_is_school_holiday(date, trip.route_name))
                    day_type = 1;
                else
                    day_type = 0;
            }

            // Compute, if trip will be execute in computed mode
            trip.trips.forEach(function (t) {
                t.day_type.forEach(function (day) {
                    if (day === day_type){
                        is_trip = true;
                    }
                })
                t.done = !is_trip;
                is_trip = false;
            })
        })
    }

    /**
     * Process user on vehicle click event.
     */
    vehicle_on_click(trip, dir, dep_time) {
        if (!this.viewMode) {
            return;
        }

        this.setDefaultMapState(false);

        let times = [], labels = [], index = 0, actual = false, time, waypoints;
        let t = new Date();
        let ac_time = t.getHours() * 3600 + t.getMinutes() * 60 + t.getSeconds();

        // Get trip stop times
        if (dir === 0) {
            for (let i = 1; i < trip.stop_times.length; i+=2) {
                time = dep_time + trip.stop_times[i];
                if (ac_time < time) {
                    times.push(Math.floor(time / (60 * 60)).toString().padStart(2, "0") +
                        ':' + Math.floor(time % (60 * 60) / 60).toString().padStart(2, "0"));
                    actual = true;
                }
                if (!actual) {
                    index++;
                }
            }
        } else {
            for (let i = trip.stop_times.length - 2; i >= 0 ; i-=2) {
                time = dep_time + trip.stop_times[trip.stop_times.length - 1] - trip.stop_times[i];
                if (ac_time < time) {
                    times.push(Math.floor(time / (60 * 60)).toString().padStart(2, "0") +
                        ':' + Math.floor(time % (60 * 60) / 60).toString().padStart(2, "0"));
                    actual = true;
                }
                if (!actual) {
                    index++;
                }
            }
        }

        this.lines.forEach(function (line) {
            line.routes.forEach(function (route) {
                if (route.name === trip.route_name) {
                    waypoints = route.waypoints;
                }
            })
        })

        // Get trip stop labels
        if (dir === 0) {
            for (let i = index; i < waypoints.length; i++) {
                if (waypoints[i][1] !== undefined) {
                    this.stops.forEach(function (stop) {
                        if (stop.options.id === waypoints[i][1]){
                            labels.push(stop.options.title);
                        }
                    })
                }
            }
        } else {
            for (let i = waypoints.length - 1 - index; i >= 0; i--) {
                if (waypoints[i][1] !== undefined) {
                    this.stops.forEach(function (stop) {
                        if (stop.options.id === waypoints[i][1]){
                            labels.push(stop.options.title);
                        }
                    })
                }
            }
        }

        this.tabControl.dataVis.setVisible(true);
        this.tabControl.dataVis.showVehicle(times, labels);
    }

    /**
     * Add vehicle on map.
     */
    vehicle_add(trip_stops, dir, index, trip, dep_time, line) {
        var start_index, _this = this;

        if (dir === 0){
            if (index < 0) {
                start_index = 0;
            } else {
                start_index = index;
            }
        } else if (dir === 1) {
            if (index < 0) {
                start_index = trip_stops.length - 1;
            } else {
                start_index = trip_stops.length - 1 - index;
            }
        }

        // Create vehicle icon and add it to map
        var vehicle = L.marker(trip_stops[start_index],
            {draggable: false,
                icon: _this.VehicleIcon(line)})
            .addTo(this.getState().getLayer())
            .on('click', function (e) {
                _this.vehicle_on_click(trip, dir, dep_time);
            })

        // Save vehicle information
        this.vehicles.push({veh: vehicle, trip_stops: trip_stops, dir: dir, index: index, trip: trip});
    }

    /**
     * Set vehicle position.
     */
    vehicle_set_position() {
        var position;
        var _this = this;

        this.vehicles.forEach(function (vehicle) {
            // Position depends on trip direction
            if (vehicle.dir === 0) {
                if (vehicle.index < 0) {
                    // Vehicle is on start stop
                    position = 0;
                } else if (vehicle.index > (vehicle.trip_stops.length - 1)) {
                    // Vehicle ends trip
                    _this.vehicle_delete(vehicle);
                    return;
                } else {
                    // Set vehicle position
                    position = vehicle.index;
                }
            } else if (vehicle.dir === 1){
                if (vehicle.index < 0) {
                    // Vehicle is on start stop
                    position = vehicle.trip_stops.length - 1;
                } else if (vehicle.index > (vehicle.trip_stops.length - 1)) {
                    // Vehicle ends trip
                    _this.vehicle_delete(vehicle);
                    return;
                } else {
                    // Set vehicle position
                    position = vehicle.trip_stops.length - 1 - vehicle.index;
                }
            }

            vehicle.veh.setLatLng(vehicle.trip_stops[position]);
            vehicle.index++;
        })
    }

    /**
     * Delete vehicle from map.
     */
    vehicle_delete(vehicle) {
        var pos = this.vehicles.indexOf(vehicle);
        vehicle.veh.remove();

        this.vehicles.splice(pos, 1);
    }

    /**
     * Set starting vehicle position. It depends on time and vehicles route.
     */
    vehicle_set_on_map(ac_time) {
        // Set transit system mode at midnight.
        if (ac_time < (this.REFRESH_TIME)){
            this.trip_set_TT_day();
            return;
        }

        let visible_routes = [];

        // Vehicles can be add only on visible lines
        // Prepare list of visible lines
        this.lines.forEach(function (line) {
            if (line.vis){
                line.routes.forEach(function (route) {
                    visible_routes.push(route);
                })
            }
        })

        // Compute for every trip, if there should be created new vehicle
        let _this = this;
        this.trips.forEach(function (trip) {
            if (trip.trip_stops !== undefined) {
                // Is trips line visible?
                visible_routes.forEach(function (route) {
                    if (route.name === trip.route_name) {
                        trip.trips.forEach(function (t) {
                            // Is there vehicle on trip yet?
                            if (!t.done) {
                                // Is time to execute trip?
                                if (t.dep_time - _this.APPEAR_TIME < ac_time &&
                                    (t.dep_time + (trip.trip_stops.length * _this.REFRESH_TIME)) > ac_time){
                                    t.done = true;
                                    // Compute vehicle start position
                                    var index = Math.round((ac_time - t.dep_time) / _this.REFRESH_TIME);

                                    // Set new vehicle on map
                                    _this.vehicle_add(trip.trip_stops, t.dir, index, trip, t.dep_time, trip.line);
                                }
                            }
                        })
                    }
                })
            }
        })
    }
}
export default TransitLayerTool;
