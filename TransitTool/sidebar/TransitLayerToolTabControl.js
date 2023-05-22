import TransitLayerToolTabControlDefaults from "./TransitLayerToolTabControlDefaults";
import TransitLayerToolTabControlState from "./TransitLayerToolTabControlState";
import AbstractLayerToolTabControl from "../../abstract/sidebar/AbstractLayerToolTabControl";
import AutocompleteSidebarInput from "../../../../inputs/input/AutocompleteSidebarInput";
import AutocompleteSidebarButton from "../inputs/AutocompleteSidebarButton";
import AutocompleteSidebarStopType from "../inputs/AutocompleteSidebarStopType";
import AutocompleteSidebarColorInput from "../inputs/AutocompleteSidebarColorInput";
import AutocompleteSidebarStopOrder from "../inputs/AutocompleteSidebarStopOrder";
import AutocompleteSidebarTTImport from "../inputs/AutocompleteSidebarImportTT";
import AutocompleteSidebarFilters from "../inputs/AutocompleteSidebarFilters";
import AutocompleteTransitDataVisualisation from "../inputs/AutocompleteTransitDataVisualisation";

/**
 * This class provides controls for management of the layer sidebar tab.
 * 
 * @author Juraj Lazur
 */
class TransitLayerToolTabControl extends AbstractLayerToolTabControl {

    // Main switch for working mode
    mode = 'modeLine';

    constructor(tool) {
        super(tool);

        this.tabContent = undefined;
    }

    /**
     * It creates new defaults of the tab control.
     */
    createDefaults() {
        return new TransitLayerToolTabControlDefaults();
    }

    /**
     * It creates new state of the tab control.
     */
    createState() {
        return new TransitLayerToolTabControlState();
    }

    /**
     * It acquire selected data mapping from input values.
     */
    getInputValues() {
        // get data mapping model
        let model = this.getDefaults().getDataMappingModel();
        
        // create new selection
        let dataMapping = {};

        // get selected data domains values
        dataMapping[model.text_input.name] = this.textInput.getValue();
        dataMapping[model.text_input2.name] = this.textInput2.getValue();

        return dataMapping;
    }

    /**
     * It updates selected input values according to the given data mapping.
     * 
     * @param {*} dataMapping 
     */
    setInputValues(dataMapping) {
        // get data mapping model
        let model = this.getDefaults().getDataMappingModel();

        // update inputs
        this.textInput.setValue(dataMapping[model.text_input.name]);
        this.textInput2.setValue(dataMapping[model.text_input2.name]);
    }

    getElementsMode() {
        return this.mode;
    }

    setElementsMode(mode) {
        this.mode = mode;
        this.textInput.setVisible(false);
        this.textInput2.setVisible(false);
        this.stopType.setVisible(false);
        this.colorInput.setVisible(false);
        this.stopOrder.setVisible(false);
        this.importTT.setVisible(false);
        this.filters.setVisible(false);
        this.inputButton1.setVisible(false);
        this.inputButton2.setVisible(false);
        this.dataVis.setVisible(false);

        this.textInput.options = [];
        this.textInput.setValue('');
        this.textInput.input.placeholder = '';
        this.textInput2.options = [];
        this.textInput2.setValue('');
        this.textInput2.input.placeholder = '';
        this.colorInput.setColor('#ffffff');
        this.stopOrder.deleteStops();
        this.filters.deleteButtons();

        this.getTool().selected_stop = undefined;
        this.getTool().selected_line = undefined;
        this.getTool().selected_route = undefined;

        if (this.getTool().control !== undefined) {
            if (this.getTool().viewMode) {
                this.getTool().control.unsetInViewMode();
            } else {
                this.getTool().control.unset();
            }
        }

        if (this.getTool().viewMode && this.mode !== 'filterMode') {
            return;
        }

        var options = [];

        if (this.mode === 'stopMode' || this.mode === 'stopModeNew') {
            this.textInput.setVisible(true);
            this.textInput.setLabel("Stop name");
            this.textInput.input.placeholder = 'Choose stop name';
            this.inputButton1.setVisible(true);
            if (this.mode === 'stopMode') {
                this.inputButton1.setLabel("Apply changes");
            } else {
                this.inputButton1.setLabel("Save new stop");
            }
            this.getTool().control.set('stopMode');
            this.stopType.setVisible(true);
        } else if (this.mode === 'lineMode') {
            this.textInput.setVisible(true);
            this.textInput.setLabel("Line short name");
            this.textInput.input.placeholder = 'Choose line name';
            this.colorInput.setVisible(true);
            this.inputButton1.setVisible(true);
            this.getTool().lines.forEach(function (line) {
                options.push(line.name);
            })

            this.textInput.options = options;
            this.inputButton1.setLabel("Apply changes");
            this.inputButton2.setVisible(true);
            this.inputButton2.setLabel("Save as new line");
            this.importTT.setVisible(true);
        } else if (this.mode === 'routeMode' || this.mode === 'routeModeNew') {
            this.textInput.setVisible(true);
            this.textInput.setLabel("Route's line ID");
            this.textInput.input.placeholder = "Choose route's line";
            this.textInput2.setVisible(true);
            this.textInput2.setLabel("Route ID");
            this.textInput2.input.placeholder = "Choose route's name";
            this.inputButton1.setVisible(true);

            this.getTool().lines.forEach(function (line) {
                options.push(line.name);
            })

            this.textInput.options = options;

            if (this.mode === 'routeMode') {
                this.stopOrder.setVisible(true);
                this.inputButton1.setLabel("Apply changes");
            } else {
                this.inputButton1.setLabel("Save new route");
            }

            this.getTool().control.set('routeMode');
        } else if (this.mode === 'filterMode' || this.mode === 'filterModeNew') {
            this.filters.setVisible(true);

            let options = [], rou = [];
            this.getTool().lines.forEach(function (line) {
                line.routes.forEach(function (route) {
                    rou.push({name: route.name, vis: route.vis});
                })
                options.push({name: line.name, vis: line.vis, routes: rou});
                rou = [];
            })
            this.filters.addButtons(options, this.getTool().isViewMode());

            this.getTool().control.set('filterMode');
        }
    }


    button1Action() {
        if (this.mode === 'stopMode' || this.mode === 'stopModeNew') {
            if (this.getTool().stop_save()) {
                this.setElementsMode('lineMode');
            }
        } else if (this.mode === 'lineMode') {
            if (this.getTool().line_save('save')) {
                this.setElementsMode('lineMode');
            }
        } else if (this.mode === 'routeMode' || this.mode === 'routeModeNew') {
            if (this.getTool().route_save()) {
                this.setElementsMode('lineMode');
            }
        }
    }

    button2Action() {
        if (this.mode === 'lineMode') {
            if (this.getTool().line_save('save_as_new')) {
                this.setElementsMode('lineMode');
            }
        }
    }

    /**
     * It returns the sidebar tab pane.
     */
    getTabContent() {
        var _this = this;

        let changeDimensionAction = function(e) {
            _this.getTool().onSelectionChanged();
        }

        let stopTypeChanged = function (e) {
            if (_this.stopType.getIndex() !== e) {
                _this.stopType.setIndex(parseInt(e));

                if (_this.getTool().selected_stop !== undefined) {
                    _this.getTool().selected_stop.setIcon(_this.getTool().StopIconsHovered[_this.stopType.getIndex()]);
                    _this.getTool().selected_stop.options.index = _this.stopType.getIndex();
                }
            }
        }

        let stopOrderChanged = function (indexes) {
            var waypoints = _this.getTool().selected_route.route.getWaypoints();
            if (indexes.length === undefined) {
                _this.getTool().selected_route.route.spliceWaypoints(indexes, 1);
            } else {
                var point;
                point = waypoints[indexes[0]];
                waypoints[indexes[0]] = waypoints[indexes[1]];
                waypoints[indexes[1]] = point;

                _this.getTool().selected_route.route.setWaypoints(waypoints);
            }
        }

        let timeTablesLoad = function (input_data, holidays, school_holidays) {
            _this.getTool().on_trips_load(input_data, holidays, school_holidays);
        }

        let filtersChanged = function (name, value, type) {
            _this.getTool().line_change_visibility(name, value, type);
        }
        
        // tab content
        let tab = document.createElement('div');
        let elem = tab.appendChild(document.createElement('div'));

        // get data mapping model
        let model = this.getDefaults().getDataMappingModel();
        let dataDomainLabels = this.getTool().getMap().getState().getMapData().getDataDomainLabels();

        // text input
        this.textInput = new AutocompleteSidebarInput({ label: model.text_input.label,
            options: dataDomainLabels, action: changeDimensionAction });
        elem.appendChild(this.textInput.create());

        // text input2
        this.textInput2 = new AutocompleteSidebarInput({ label: model.text_input2.label, options: dataDomainLabels });
        elem.appendChild(this.textInput2.create());

        // stop type
        this.stopType = new AutocompleteSidebarStopType({ label: model.stop_type.label,
            options: this.getTool().getIconImages(), action: stopTypeChanged });
        elem.appendChild(this.stopType.create());

        // color picker
        this.colorInput = new AutocompleteSidebarColorInput({ label: model.color_input.label });
        elem.appendChild(this.colorInput.create());

        // stop order
        this.stopOrder = new AutocompleteSidebarStopOrder({ action: stopOrderChanged });
        elem.appendChild(this.stopOrder.create());

        // button 1
        this.inputButton1 = new AutocompleteSidebarButton({ label: model.button_1.label });
        elem.appendChild(this.inputButton1.create());
        this.inputButton1.input.addEventListener('click', event => {
            this.button1Action();
        });

        // button 2
        this.inputButton2 = new AutocompleteSidebarButton({ label: model.button_2.label });
        elem.appendChild(this.inputButton2.create());
        this.inputButton2.input.addEventListener('click', event => {
            this.button2Action();
        });

        // Filters
        this.filters = new AutocompleteSidebarFilters({ action: filtersChanged });
        elem.appendChild(this.filters.create());

        // stop type
        this.importTT = new AutocompleteSidebarTTImport({ label: model.import_tt.label, action: timeTablesLoad });
        elem.appendChild(this.importTT.create());

        // Transit data visualisation
        this.dataVis = new AutocompleteTransitDataVisualisation({ label: model.data_vis.label })
        elem.appendChild(this.dataVis.create());

        this.setInputValues(this.getTool().getState().getDataMapping());

        this.setElementsMode('lineMode');
        
        return tab;
    }

}
export default TransitLayerToolTabControl;