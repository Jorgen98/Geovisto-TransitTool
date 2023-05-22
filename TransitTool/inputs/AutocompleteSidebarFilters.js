import AbstractSidebarInput from "../../../../inputs/AbstractSidebarInput";
import TabDOMUtil from "../../../../util/TabDOMUtil";

const ID = "geovisto-filters-autocomplete";

const LINE_DIV_INPUT_CLASS = ID + "-line";

const BUTTON_DIV_INPUT_CLASS = ID + "-button";

const ROUTES_DIV_INPUT_CLASS = ID + "-routes";

const BUTTON_HIDE_DIV_INPUT_CLASS = ID + "-button-hide";

const BUTTON_DISALLOW_DIV_INPUT_CLASS = ID + "-button-disallow";

/**
 * This class represents filter buttons.
 *
 * @author Juraj Lazur
 */
class AutocompleteSidebarFilters extends AbstractSidebarInput {

    constructor(settings){
        super(settings);
        
        // settings
        this.action = settings.action;

        // div elements
        this.formDiv = undefined;
        this.inputDiv = undefined;
        this.visibility = [];

        // Default number of elements in one row
        this.num_of_buttons = 6;
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
     * Construct lines and routes buttons.
     */
    addButtons(lines, viewMode) {
        let _this = this;

        for (let i = 0; i < lines.length; i++) {
            this.inputDiv = document.createElement('div');
            this.inputDiv.classList.add(LINE_DIV_INPUT_CLASS);

            // line button
            this.but = document.createElement('button');
            if (lines[i].vis) {
                this.visibility[i] = true;

                TabDOMUtil.setAttributes(this.but,
                    ["id", "class"],
                    [i, BUTTON_DIV_INPUT_CLASS]);
            } else {
                this.visibility[i] = false;

                TabDOMUtil.setAttributes(this.but,
                    ["id", "class"],
                    [i, BUTTON_HIDE_DIV_INPUT_CLASS]);
            }

            // button action
            this.but.innerHTML = lines[i].name;
            this.but.addEventListener('click', function (e){
                _this.buttonClicked(e.currentTarget, e.currentTarget.innerHTML, 'line');
            });

            this.inputDiv.appendChild(this.but);

            // routes buttons
            if (lines[i].routes.length > 0 && !viewMode) {
                this.inputSubDiv = document.createElement('div');
                this.inputSubDiv.classList.add(ROUTES_DIV_INPUT_CLASS);
                this.inputSubDiv.setAttribute("id", lines[i].name + '-routes');

                for (let j = 0; j < lines[i].routes.length; j++) {
                    this.subBut = document.createElement('button');
                    if (lines[i].vis) {
                        if (lines[i].routes[j].vis) {
                            this.visibility[i + '_' + j] = true;

                            TabDOMUtil.setAttributes(this.subBut,
                                ["id", "class"],
                                [i + '_' + j, BUTTON_DIV_INPUT_CLASS]);
                        } else {
                            this.visibility[i + '_' + j] = false;

                            TabDOMUtil.setAttributes(this.subBut,
                                ["id", "class"],
                                [i + '_' + j, BUTTON_HIDE_DIV_INPUT_CLASS]);
                        }
                    } else {
                        this.visibility[i + '_' + j] = lines[i].routes[j].vis;
                        this.subBut.disabled = true;

                        TabDOMUtil.setAttributes(this.subBut,
                            ["id", "class"],
                            [i + '_' + j, BUTTON_DISALLOW_DIV_INPUT_CLASS]);
                    }

                    this.subBut.innerHTML = lines[i].routes[j].name;
                    this.subBut.addEventListener('click', function (e){
                        _this.buttonClicked(e.currentTarget, e.currentTarget.innerHTML, 'route');
                    });

                    this.inputSubDiv.appendChild(this.subBut);
                }

                this.inputDiv.appendChild(this.inputSubDiv);
            }

            this.formDiv.appendChild(this.inputDiv);
        }
    }

    /**
     * Proceed user input.
     */
    buttonClicked(but, name, type) {
        // Hide line or route
        if (this.visibility[but.id]){
            but.setAttribute("class", BUTTON_HIDE_DIV_INPUT_CLASS);
            // Disable all buttons, which belongs to line
            if (type === 'line') {
                let route_div = document.getElementById(name + '-routes');
                if (route_div !== null) {
                    route_div.children.forEach(function (button) {
                        button.disabled = true;
                        button.setAttribute("class", BUTTON_DISALLOW_DIV_INPUT_CLASS);
                    })
                }
            }
            this.visibility[but.id] = false;
            this.action(name, false, type);
        // Show line or route
        } else {
            but.setAttribute("class", BUTTON_DIV_INPUT_CLASS);
            // Enable all buttons, which belongs to line
            if (type === 'line') {
                let route_div = document.getElementById(name + '-routes'), _this = this;
                if (route_div !== null) {
                    route_div.children.forEach(function (button) {
                        button.disabled = false;
                        if (_this.visibility[button.id]) {
                            button.setAttribute("class", BUTTON_DIV_INPUT_CLASS);
                        } else {
                            button.setAttribute("class", BUTTON_HIDE_DIV_INPUT_CLASS);
                        }
                    })
                }
            }
            this.visibility[but.id] = true;
            this.action(name, true, type);
        }
    }

    /**
     * Delete buttons, when filters are turned off.
     */
    deleteButtons() {
        this.visibility = [];
        this.formDiv.children.forEach(function (div) {
            div.remove();
        })
    }

    create() {
        this.createForm();

        return this.formDiv;
    }

    createForm() {
        this.formDiv = document.createElement('div');
    }
}
export default AutocompleteSidebarFilters;