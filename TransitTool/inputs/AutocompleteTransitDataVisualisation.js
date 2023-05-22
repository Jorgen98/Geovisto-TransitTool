import AbstractSidebarInput from "../../../../inputs/AbstractSidebarInput";

const ID = "geovisto-data-autocomplete";

const COMPONENT_DIV_INPUT_CLASS = ID + "-component";

const DEPART_DIV_INPUT_CLASS = ID + "-depart";

const DEPART_TIME_DIV_INPUT_CLASS = ID + "-dep_time";

const DEPART_LINE_DIV_INPUT_CLASS = ID + "-dep_line";

const DEPART_DEST_DIV_INPUT_CLASS = ID + "-dep_dest";

const VEH_TIME_DIV_INPUT_CLASS = ID + "-veh-time";

const VEH_LABEL_DIV_INPUT_CLASS = ID + "-veh-label";

/**
 * This class represents information about vehicle or bus stop
 *
 * @author Juraj Lazur
 */
class AutocompleteTransitDataVisualisation extends AbstractSidebarInput {

    constructor(settings){
        super(settings);

        // div elements
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
        if (visible === true) {
            this.formDiv.style.display = "";
        }
        if (visible === false) {
            this.formDiv.style.display = "none";

            if (this.inputDiv !== undefined) {
                this.inputDiv.remove();
            }
        }
    }

    create() {
        this.createForm();

        return this.formDiv;
    }

    createForm() {
        this.formDiv = document.createElement('div'); 
        this.formDiv.classList.add(ID);
    }

    /**
     * Static function to show information about bus stop.
     */
    showBusStop(name, departs) {
        this.inputDiv = document.createElement('div');
        this.inputDiv.classList.add(COMPONENT_DIV_INPUT_CLASS);

        this.labelDiv = document.createElement('div');
        this.labelDiv.classList.add(ID + '-label');
        this.labelDiv.innerHTML = name;

        this.inputDiv.appendChild(this.labelDiv);

        for (let i = 0; i < 8 && i < departs.length; i++) {
            this.depDiv = document.createElement('div');
            this.depDiv.classList.add(DEPART_DIV_INPUT_CLASS);

            this.timeDiv = document.createElement('div');
            this.timeDiv.classList.add(DEPART_TIME_DIV_INPUT_CLASS);
            this.timeDiv.innerHTML = departs[i].time;

            this.lineDiv = document.createElement('div');
            this.lineDiv.classList.add(DEPART_LINE_DIV_INPUT_CLASS);
            this.lineDiv.innerHTML = departs[i].line;

            this.destDiv = document.createElement('div');
            this.destDiv.classList.add(DEPART_DEST_DIV_INPUT_CLASS);
            this.destDiv.innerHTML = departs[i].dest;

            this.depDiv.appendChild(this.timeDiv);
            this.depDiv.appendChild(this.lineDiv);
            this.depDiv.appendChild(this.destDiv);

            this.inputDiv.appendChild(this.depDiv);
        }

        this.formDiv.appendChild(this.inputDiv);
    }

    /**
     * Static function to show information about vehicle.
     */
    showVehicle(times, labels) {
        this.inputDiv = document.createElement('div');
        this.inputDiv.classList.add(COMPONENT_DIV_INPUT_CLASS);

        for (let i = 0; i < times.length; i++) {
            this.stopDiv = document.createElement('div');
            this.stopDiv.classList.add(DEPART_DIV_INPUT_CLASS);

            this.stopTimeDiv = document.createElement('div');
            this.stopTimeDiv.classList.add(VEH_TIME_DIV_INPUT_CLASS);
            this.stopTimeDiv.innerHTML = times[i];

            this.stopLabel = document.createElement('div');
            this.stopLabel.classList.add(VEH_LABEL_DIV_INPUT_CLASS);
            this.stopLabel.innerHTML = labels[i];

            this.stopDiv.appendChild(this.stopTimeDiv);
            this.stopDiv.appendChild(this.stopLabel);

            this.inputDiv.appendChild(this.stopDiv);
        }

        this.formDiv.appendChild(this.inputDiv);
    }
}
export default AutocompleteTransitDataVisualisation;