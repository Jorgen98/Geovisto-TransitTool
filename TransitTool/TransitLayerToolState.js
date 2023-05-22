import AbstractLayerToolState from "../abstract/AbstractLayerToolState";

/**
 * This class provide functions for using the state of the layer tool.
 * 
 * @author Jiri Hynek
 * @author Juraj Lazur
 */
class TransitLayerToolState extends AbstractLayerToolState {

    /**
     * It creates a tool state.
     */
    constructor() {
        super();

        this.data = {stops: [], lines: [], routes: []};
        this.imported = false;
    }

    /**
     * It initializes the state using the initial props. Optionally, defaults can be set if property is undefined.
     * 
     * @param {*} props 
     * @param {*} defaults 
     */
    initialize(props, defaults) {
        super.initialize(props, defaults);
    }

    /**
     * It resets state with respect to initial props. Optionally, defaults can be set if property is undefined.
     * 
     * @param {TransitLayerToolDefaults} defaults
     */
    reset(defaults) {
        super.reset(defaults);
    }

    /**
     * Help function which resets the state properties realated with map if not defined.
     */
    resetMapVariables(map, defaults) {
        super.resetMapVariables(map, defaults);
        
        let props = this.getProps();
        this.setCentroids(props.centroids == undefined && defaults && map ? defaults.getCentroids() : props.centroids);

        this.setDataState(false);
    }

    /**
     * The metod takes config and desrializes the values.
     * 
     * @param {*} config 
     */
    deserialize(config) {
        super.deserialize(config);

        if (config.stops !== undefined) {
            this.data.stops = config.stops;
        }

        if (config.lines !== undefined) {
            this.data.lines = config.lines;

            if (config.routes !== undefined) {
                this.data.routes = config.routes;
            }
        }

        this.setDataState(true);
    }


    /**
     * The method serializes the tool state. Optionally, defaults can be set if property is undefined.
     * 
     * @param {TransitLayerToolDefaults} defaults
     */
    serialize(defaults) {
        let config = super.serialize(defaults);

        config.stops = [];
        let stop_indexes = [], index = 0, waypoints = [];

        this.stops.forEach(function (stop, index) {
            config.stops.push({id: index, name: stop.options.title, latLng: stop.getLatLng(), type: stop.options.index});
            stop_indexes.push({map: stop._leaflet_id, export: index});
        })

        config.lines = [];
        config.routes = [];

        this.lines.forEach(function (line, index) {
            config.lines.push({id: index, name: line.name, color: line.color, vis: line.vis});

            line.routes.forEach(function (route) {
                route.waypoints.forEach(function (point) {
                    if (point[1] !== undefined) {
                        stop_indexes.forEach(function (id) {
                            if (id.map === point[1]) {
                                waypoints.push({id: id.export});
                            }
                        })
                    } else {
                        waypoints.push({pos: point[0]});
                    }
                })

                config.routes.push({id: index, name: route.name, vis: route.vis, waypoints: waypoints})
                waypoints = [];
            })
        })

        return config;
    }

    /**
     * It returns a Leaflet svg layer.
     */
    getLayer() {
        return this.layer;
    }

    /**
     * It sets a Leaflet svg layer.
     * 
     * @param {L.svg} layer 
     */
    setLayer(layer) {
        this.layer = layer;
    }

    /**
     * It returns the centroids.
     */
    getCentroids() {
        return this.centroids;
    }

    /**
     * It sets the centroids.
     * 
     * @param {*} centroids 
     */
    setCentroids(centroids) {
        this.centroids = centroids;
    }

    /**
     * It returns work data for the force layout algorithm.
     */
    getWorkData() {
        return this.workData;
    }

    /**
     * It returns imported deserialized data.
     */
    getImportedData() {
        return this.data;
    }

    /**
     * Clear imported data.
     */
    clearImportedData() {
        this.data = {stops: [], lines: [], routes: []};
    }

    /**
     * It returns if there are data to import
     */
    getDataState() {
        return this.imported;
    }

    /**
     * Set imported data state.
     */
    setDataState(value) {
        this.imported = value;
    }

    /**
     * It sets the work data for the force layout algorithm.
     * 
     * @param {*} workData 
     */
    setWorkData(workData) {
        this.workData = workData;
    }

    setVisualisationData(stops, lines) {
        this.stops = stops;
        this.lines = lines;
    }
}
export default TransitLayerToolState;