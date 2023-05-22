import AbstractSidebarInput from "../../../../inputs/AbstractSidebarInput";
import TabDOMUtil from "../../../../util/TabDOMUtil";

const ID = "geovisto-button-autocomplete";

const COMPONENT_DIV_INPUT_CLASS = ID + "-component";

const COMPONENT_INPUT_CLASS = ID + "-button";

/**
 * This class represents button.
 *
 * @author Juraj Lazur
 */
class AutocompleteSidebarButton extends AbstractSidebarInput {

    constructor(settings){
        super(settings);
        
        // settings
        this.label = settings.label;

        // div elements
        this.formDiv = undefined;
        this.inputDiv = undefined;
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
        if (visible === true) {
            this.formDiv.style.display = "";
        }
        if (visible === false) {
            this.formDiv.style.display = "none";
        }
    }

    /**
     * Static function sets button label.
     */
    setLabel(label) {
        if (label !== ""){
            this.input.innerHTML = label;
        }
    }

    create() {
        this.createForm();

        return this.formDiv;
    }

    /*
     * Creates elements.
     */
    createForm() {
        // div for the whole autocomplete component
        this.formDiv = document.createElement('div'); 
        this.formDiv.classList.add(ID);

        // input div
        this.inputDiv = document.createElement('div');
        this.inputDiv.classList.add(COMPONENT_DIV_INPUT_CLASS);

        // input button
        this.input = document.createElement('button');
        this.input.innerHTML = this.label;
        TabDOMUtil.setAttributes(this.input,
            [ "class", "type"],
            [ COMPONENT_INPUT_CLASS, "button"]);

        // construct elements
        this.formDiv.appendChild(this.inputDiv);
        this.inputDiv.appendChild(this.input);
    }
}
export default AutocompleteSidebarButton;