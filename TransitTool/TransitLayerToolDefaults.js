import TransitLayerTool from "./TransitLayerTool";
import AbstractLayerToolDefaults from "../abstract/AbstractLayerToolDefaults";
import AutocompleteSidebarInput from "../../../inputs/input/AutocompleteSidebarInput";
import AutocompleteSidebarButton from "./inputs/AutocompleteSidebarButton";
import AutocompleteSidebarStopType from "./inputs/AutocompleteSidebarStopType";
import AutocompleteSidebarColorInput from "./inputs/AutocompleteSidebarColorInput";
import AutocompleteSidebarStopOrder from "./inputs/AutocompleteSidebarStopOrder";
import AutocompleteSidebarTTImport from "./inputs/AutocompleteSidebarImportTT";
import AutocompleteSidebarFilters from "./inputs/AutocompleteSidebarFilters";
import AutocompleteTransitDataVisualisation from './inputs/AutocompleteTransitDataVisualisation';

/**
 * @author Juraj Lazur
 */
const TYPE = 'transit';

const INPUT_ID_PREFIX = "geovisto-input-" + TYPE;

/**
 * Data mapping model which can be used in the sidebar form.
 */
const MAPPING_MODEL = {
    text_input: {
        id: INPUT_ID_PREFIX + "-text-input",
        name: "text_input",
        label: "Input text",
        input: AutocompleteSidebarInput.ID()
    },
    text_input2: {
        id: INPUT_ID_PREFIX + "-text-input2",
        name: "text_input2",
        label: "Input text",
        input: AutocompleteSidebarInput.ID()
    },
    stop_type: {
        id: INPUT_ID_PREFIX + "-stop-type",
        name: "stop_type",
        label: "Stop icon type",
        input: AutocompleteSidebarStopType.ID()
    },
    color_input: {
        id: INPUT_ID_PREFIX + "-color-input",
        name: "color_input",
        label: "Line color",
        input: AutocompleteSidebarColorInput.ID()
    },
    stop_order: {
        id: INPUT_ID_PREFIX + "-stop-order",
        name: "stop_order",
        label: "Stop order",
        input: AutocompleteSidebarStopOrder.ID()
    },
    import_tt: {
        id: INPUT_ID_PREFIX + "-tt-import",
        name: "import_tt",
        label: "Import trips",
        input: AutocompleteSidebarTTImport.ID()
    },
    filters: {
        id: INPUT_ID_PREFIX + "-filters",
        name: "filters",
        label: "Choose lines",
        input: AutocompleteSidebarFilters.ID()
    },
    button_1: {
        id: INPUT_ID_PREFIX + "-button-1",
        name: "button_1",
        label: "But_1",
        input: AutocompleteSidebarButton.ID()
    },
    button_2: {
        id: INPUT_ID_PREFIX + "-button-2",
        name: "button_2",
        label: "But_2",
        input: AutocompleteSidebarButton.ID()
    },
    button_3: {
        id: INPUT_ID_PREFIX + "-button-3",
        name: "button_3",
        label: "But_3",
        input: AutocompleteSidebarButton.ID()
    },
    button_4: {
        id: INPUT_ID_PREFIX + "-button-4",
        name: "button_4",
        label: "But_4",
        input: AutocompleteSidebarButton.ID()
    },
    data_vis: {
        id: INPUT_ID_PREFIX + "-data_vis",
        name: "data_vis",
        input: AutocompleteTransitDataVisualisation.ID()
    }
}


/**
 * This class provide functions which return the default state values.
 * 
 * @author Jiri Hynek
 */
class TransitLayerToolDefaults extends AbstractLayerToolDefaults {

    /**
     * It initializes tool defaults.
     */
    constructor() {
        super();
    }

    /**
     * It returns a unique type string of the tool which is based on the layer it wraps.
     */
    getType() {
        return TransitLayerTool.TYPE();
    }

    /**
     * It returns the layer name.
     */
    getLayerName() {
        return "Transit layer";
    }

    /**
     * It returns the default mapping of data domains to chart dimensions.
     */
    getDataMapping() {
        let dataMapping = {};

        return dataMapping;
    }

    /**
     * It returns the data mapping model.
     */
    getDataMappingModel() {
        return MAPPING_MODEL;
    }

    /**
     * It returns default centroids.
     */
    getCentroids() {
        return JSON.parse(JSON.stringify(this.getMapObject().getMap().getState().getCentroids()));
    }
}
export default TransitLayerToolDefaults;