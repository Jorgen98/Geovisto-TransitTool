import AbstractSidebarInput from "../../../../inputs/AbstractSidebarInput";
import TabDOMUtil from "../../../../util/TabDOMUtil";

const ID = "geovisto-stop-type-autocomplete";

const COMPONENT_DIV_INPUT_CLASS = ID + "-component";

const COMPONENT_INPUT_CLASS = ID + "-div";

/**
 *
 * @author Juraj Lazur
 */
class AutocompleteSidebarStopType extends AbstractSidebarInput {

    constructor(settings){
        super(settings);
        
        // settings
        this.options = settings.options;
        this.setData = settings.setData;
        this.action = settings.action;

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
        }
    }

    setIndex(index) {
        if (this.index !== index) {
            var i;
            for (i = 0; i < this.inputDiv.children.length; i++) {
                if (index === i) {
                    this.inputDiv.children[i].setAttribute("id", COMPONENT_INPUT_CLASS + '-hoover');
                } else {
                    this.inputDiv.children[i].removeAttribute("id");
                }
            }

            this.index = index;
        }
    }

    getIndex() {
        return this.index;
    }

    create() {
        this.createForm();

        return this.formDiv;
    }

    createForm() {
        this.formDiv = document.createElement('div'); 
        this.formDiv.classList.add(ID);

        this.inputDiv = document.createElement('div');
        this.inputDiv.classList.add(COMPONENT_DIV_INPUT_CLASS);

        this.formDiv.appendChild(this.inputDiv);

        for (var i = 0; i < this.options.length; i++) {
            this.input = document.createElement('a');
            this.input.innerHTML = '<img src="' + this.options[i] + '" alt="Type_1" width="25">'
            TabDOMUtil.setAttributes(this.input,
                [ "class", "type", "href"],
                [ COMPONENT_INPUT_CLASS, i, '#']);

            this.inputDiv.appendChild(this.input);
            var _this = this;
            this.input.addEventListener('click', function (e) {
                if (this !== e.target) {
                    _this.action(e.target.parentElement.type);
                } else {
                    _this.action(e.target.type);
                }
            });
        }

        this.setIndex(0);
    }
}
export default AutocompleteSidebarStopType;