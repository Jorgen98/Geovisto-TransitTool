import AbstractSidebarInput from "../../../../inputs/AbstractSidebarInput";
import TabDOMUtil from "../../../../util/TabDOMUtil";

const ID = "geovisto-color-autocomplete";

const COMPONENT_DIV_INPUT_CLASS = ID + "-component";

const COMPONENT_INPUT_LABEL_CLASS = ID + "-label";

const COMPONENT_INPUT_CLASS = ID + "-input";

/**
 * This class represents color input.
 *
 * @author Juraj Lazur
 */
class AutocompleteSidebarColorInput extends AbstractSidebarInput {

    constructor(settings){
        super(settings);
        
        // settings
        this.label = settings.label;

        // div elements
        this.formDiv = undefined;
        this.inputDiv = undefined;
        this.inputLabel = undefined;
        this.input = undefined;
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
     * Static function returns actual selected color.
     */
    getColor() {
        return this.input.value;
    }

    /**
     * Static function to set input color.
     */
    setColor(value) {
        this.input.value = value;
    }

    create() {
        this.createForm();

        return this.formDiv;
    }

    /*
     * Creates input elements.
     */
    createForm() {
        // div for the whole autocomplete component
        this.formDiv = document.createElement('div'); 
        this.formDiv.classList.add(ID);

        // input div
        this.inputDiv = document.createElement('div');
        this.inputDiv.classList.add(COMPONENT_DIV_INPUT_CLASS);

        // input label
        this.inputLabel = document.createElement('div');
        this.inputLabel.classList.add(COMPONENT_INPUT_LABEL_CLASS);
        this.inputLabel.innerHTML = this.label;

        // color input
        this.input = document.createElement('input');
        TabDOMUtil.setAttributes(this.input,
            [ "type", "class"],
            [ "color", COMPONENT_INPUT_CLASS]);

        // construct elements
        this.formDiv.appendChild(this.inputDiv);
        this.inputDiv.appendChild(this.inputLabel);
        this.inputDiv.appendChild(this.input);

        // set default color
        this.setColor('#ffffff');
    }
}
export default AutocompleteSidebarColorInput;